/**
 * This module is responsible for building the prompts for the various API clients.
 * It uses the new promptManager to fetch ChatML prompts and then populates them with dynamic data.
 */
import { getPrompt } from '../promptManager.ts';
import { parseChatML, chatMLToPromptStructure } from '../../api/chatMLParser.js';
import { parseMagicPatterns } from './magicPatternParser.ts';

/**
 * Populates a template with magic patterns.
 * It also makes the context safe by deep copying objects to avoid mutations.
 * 
 * @param {string} template - The string template with magic patterns.
 * @param {object} context - The context to be available in the sandbox.
 * @returns {Promise<string>} The populated string.
 */
async function populateTemplate(template, context) {
  const defaultContext = {
    sessionStorage: window.sessionStorage,
    console: { log: console.log },
  }
  const allowed = { ...defaultContext }
  for (const key in context) {
    try {
      // Merge primpitive context property with default context
      if (context[key] === null || (typeof context[key] !== 'object' && typeof context[key] !== 'function')) {
        allowed[key] = context[key];
      }
      //Functions can't be deepcopied, so we merge them directly
      if (typeof context[key] === 'function') {
        allowed[key] = context[key];
      }
      // Object values are deepcopied in the magic pattern parser
      if (typeof context[key] === 'object' && context[key] !== null) {
        allowed[key] = structuredClone(context[key]);
      }

    } catch (e) {
      //fallback to JSON-copy value if deep copy fails
      allowed[key] = JSON.parse(JSON.stringify(context[key]));
    }
  }
  
  // 일반 변수 치환 ({variable.property} 형식)
  let result = template;
  
  // 재귀적으로 객체 속성에 접근하는 함수
  const getNestedProperty = (obj, path) => {
    return path.split('.').reduce((current, prop) => {
      return current && current[prop] !== undefined ? current[prop] : null;
    }, obj);
  };
  
  // {variable} 또는 {variable.property} 패턴 찾기
  result = result.replace(/\{([^|}]+)\}/g, (match, path) => {
    const value = getNestedProperty(allowed, path.trim());
    return value !== null && value !== undefined ? String(value) : match;
  });
  
  // 그 다음 magic patterns 처리
  return await parseMagicPatterns(result, allowed);
}


/**
 * Builds the contents and system prompt for a content generation request.
 * @param {object} params - The parameters for building the prompt.
 * @param {string} params.userName - The user's name.
 * @param {string} params.userDescription - The user's description.
 * @param {object} params.character - The character object.
 * @param {Array<object>} params.history - The conversation history.
 * @param {boolean} [params.isProactive=false] - Whether the AI is initiating the conversation.
 * @param {boolean} [params.forceSummary=false] - Whether to force a memory summary.
 * @returns {Promise<{contents: Array<object>, systemPrompt: string}>} - The generated contents and system prompt.
 */
export async function buildContentPrompt({
  userName,
  userDescription,
  character,
  history,
  isProactive = false,
  forceSummary = false,
  characterState = null
}) {
  const chatMLTemplate = await getPrompt('mainChat');

  const lastMessageTime = history.length > 0 ? new Date(history[history.length - 1].id) : new Date();
  const currentTime = new Date();
  const timeDiff = Math.round((currentTime - lastMessageTime) / 1000 / 60);

  let timeContext = `(Context: It's currently ${currentTime.toLocaleString("en-US")}.`;
  if (isProactive) {
    const isFirstContactEver = history.length === 0;
    if (character.isRandom && isFirstContactEver) {
      timeContext += ` You are initiating contact for the very first time. You found the user's profile interesting and decided to reach out. Your first message MUST reflect this. Greet them and explain why you're contacting them, referencing their persona. This is a special instruction just for this one time.)`;
    } else if (isFirstContactEver) {
      timeContext += ` You are starting this conversation for the first time. Greet the user and start a friendly conversation.)`;
    } else {
      timeContext += ` It's been ${timeDiff} minutes since the conversation paused. You MUST initiate a new conversation topic. Ask a question or make an observation completely unrelated to the last few messages. Your goal is to re-engage the user with something fresh. Do not continue the previous train of thought.)`;
    }
  } else {
    if (history.length > 0) {
      timeContext += ` The last message was sent ${timeDiff} minutes ago.)`;
    } else {
      timeContext += ` This is the beginning of the conversation.)`;
    }
  }
  if (forceSummary) {
    timeContext += ` (summarize_memory: true)`;
  }

  const availableStickers = character.stickers?.map(sticker => `${sticker.id} (${sticker.name})`).join(', ') || 'none';
  const stickerInfo = character.stickers && character.stickers.length > 0
    ? `The character has access to the following stickers: ${availableStickers}`
    : 'The character has no stickers.';

  // SNS 포스트를 메모리로 변환 (접근 권한 고려)
  const getSNSMemories = (character) => {
    if (!character.snsPosts || character.snsPosts.length === 0) {
      return 'No specific memories recorded yet.';
    }
    
    // 현재는 모든 메모리 타입 포스트를 사용 (나중에 접근 권한 로직 추가)
    const memoryPosts = character.snsPosts
      .filter(post => post.type === 'memory' || post.type === 'post')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10) // 최근 10개만
      .map(post => `- ${post.content}${post.reason ? ` (${post.reason})` : ''}`);
      
    return memoryPosts.length > 0 ? memoryPosts.join('\n') : 'No specific memories recorded yet.';
  };
  
  const memories = getSNSMemories(character);

  const chat = (a, b) => {
    // Create a reversed copy of the history array to make indexing easier.
    const reversedHistory = [...history].reverse();
    const historyLength = history.length;

    // Helper to clamp index to the valid range.
    const clamp = (index, length) => Math.max(0, Math.min(length - 1, index));

    // Adjust for negative indices.
    const resolveIndex = (index, length) => {
      if (index >= 0) {
        return clamp(index, length);
      } else {
        return clamp(length + index, length);
      }
    }

    let start = resolveIndex(a, historyLength);
    let end = resolveIndex(b, historyLength);

    let result = [];
    if (start <= end) {
      for (let i = start; i <= end; i++) {
        result.push(reversedHistory[i]);
      }
    } else {
      for (let i = start; i >= end; i--) {
        result.push(reversedHistory[i]);
      }
    }

    return result;
  };

  // Character에 현재 호감도 상태 추가
  const characterWithState = {
    ...character,
    currentState: characterState || {
      affection: 0.3,
      intimacy: 0.2,
      trust: 0.25,
      romantic_interest: 0.0
    },
    memories: memories  // SNS 포스트를 메모리 형식으로 변환한 것 (프롬프트에서 {character.memories}로 참조됨)
  };

  const data = {
    character: characterWithState,
    persona: { name: userName, description: userDescription },
    time: {
      context: timeContext,
      diff: timeDiff,
    },
    chat: chat,
  };
  data.char = data.character.name;
  data.user = data.persona;  // 호환성을 위해 user를 persona의 별칭으로 유지

  // 디버깅: 실제 데이터 확인
  // console.log('[PromptBuilder] Character name:', data.character.name);
  // console.log('[PromptBuilder] Persona name:', data.persona.name);
  
  const populatedPrompt = await populateTemplate(chatMLTemplate, data);
  
  // 디버깅: 치환된 프롬프트 일부 확인
  if (populatedPrompt.includes('{persona.name}') || populatedPrompt.includes('{character.name}')) {
    // console.warn('[PromptBuilder] Variables not replaced properly!');
    // console.log('[PromptBuilder] Sample:', populatedPrompt.substring(0, 500));
  }
  
  const chatMLMessages = parseChatML(populatedPrompt);
  const { systemPrompt, contents: promptContents } = chatMLToPromptStructure(
    chatMLMessages,
    character,
    userName,
    userDescription,
    false // Don't include user/assistant messages from ChatML prompts
  );

  let conversationContents = [];
  for (const msg of history) {
    const role = msg.isMe ? "user" : "model";
    let parts = [];

    if (msg.isMe && msg.type === "image" && msg.imageId) {
      const imageData = character?.media?.find((m) => m.id === msg.imageId);
      if (imageData) {
        let textContent = msg.content || "(User sent an image with no caption)";
        parts.push({ text: textContent });
        parts.push({
          inlineData: {
            mimeType: imageData.mimeType || "image/jpeg",
            data: imageData.dataUrl.split(",")[1],
          },
        });
      } else {
        parts.push({ text: msg.content || "(User sent an image that is no longer available)" });
      }
    } else if (msg.isMe && msg.type === "sticker" && msg.stickerData) {
      const stickerName = msg.stickerData.stickerName || "Unknown Sticker";
      let stickerText = `[User sent a sticker: "${stickerName}"]`;
      if (msg.content && msg.content.trim()) {
        stickerText += ` with message: ${msg.content}`;
      }
      parts.push({ text: stickerText });
    } else if (msg.content) {
      parts.push({ text: msg.content });
    }

    if (parts.length > 0) {
      conversationContents.push({ role, parts });
    }
  }

  if (isProactive && conversationContents.length > 0) {
    const lastContent = conversationContents[conversationContents.length - 1];
    if (lastContent.role === "model") {
      conversationContents.pop();
    }
  }

  if (isProactive && conversationContents.length === 0) {
    conversationContents.push({
      role: "user",
      parts: [{ text: "(SYSTEM: You are starting this conversation. Please begin.)" }],
    });
  }

  return { contents: [...promptContents, ...conversationContents], systemPrompt };
}

/**
 * Builds the system prompt and contents for a character sheet generation request.
 * @param {object} params - The parameters for building the prompt.
 * @param {string} params.characterName - The character's name.
 * @param {string} params.characterDescription - The character's description.
 * @returns {Promise<{systemPrompt: string, contents: Array<object>}>} - The generated system prompt and contents.
 */
export async function buildCharacterSheetPrompt({ characterName, characterDescription }) {
  const chatMLTemplate = await getPrompt('characterSheet');

  const data = {
    character: {
      name: characterName,
      description: characterDescription || undefined,
    },
    persona: {},
  };
  data.char = data.character.name;
  data.user = data.persona;

  const populatedPrompt = await populateTemplate(chatMLTemplate, data);
  const chatMLMessages = parseChatML(populatedPrompt);
  const { systemPrompt, contents } = chatMLToPromptStructure(
    chatMLMessages,
    null,
    '',
    '',
    true // Allow conversation messages for character sheet generation
  );

  return { systemPrompt, contents };
}

/**
 * Builds the system prompt and contents for a profile generation request.
 * @param {object} params - The parameters for building the prompt.
 * @param {string} params.userName - The user's name.
 * @param {string} params.userDescription - The user's description.
 * @returns {Promise<{systemPrompt: string, contents: Array<object>}>} - The generated system prompt and contents.
 */
export async function buildProfilePrompt({ userName, userDescription }) {
  const chatMLTemplate = await getPrompt('profileCreation');

  const data = {
    character: {},
    persona: {
      name: userName,
      description: userDescription,
    },
  };
  data.char = data.character.name;
  data.user = data.persona;

  const populatedPrompt = await populateTemplate(chatMLTemplate, data);
  const chatMLMessages = parseChatML(populatedPrompt);
  const { systemPrompt, contents } = chatMLToPromptStructure(
    chatMLMessages,
    null,
    '',
    '',
    true // Allow conversation messages for profile generation
  );

  return { systemPrompt, contents };
}
