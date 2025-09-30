/**
 * This module is responsible for building the prompts for the various API clients.
 * It uses the new promptManager to fetch ChatML prompts and then populates them with dynamic data.
 */
import { getPrompt } from "../promptManager.ts";
import {
  parseChatML,
  chatMLToPromptStructure,
} from "../../lib/api/chatMLParser.js";
import { parseMagicPatterns } from "./magicPatternParser.ts";

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
  };
  const allowed = { ...defaultContext };
  for (const key in context) {
    try {
      // Merge primpitive context property with default context
      if (
        context[key] === null ||
        (typeof context[key] !== "object" && typeof context[key] !== "function")
      ) {
        allowed[key] = context[key];
      }
      //Functions can't be deepcopied, so we merge them directly
      if (typeof context[key] === "function") {
        allowed[key] = context[key];
      }
      // Object values are deepcopied in the magic pattern parser
      if (typeof context[key] === "object" && context[key] !== null) {
        allowed[key] = structuredClone(context[key]);
      }
    } catch (e) {
      //fallback to JSON-copy value if deep copy fails
      allowed[key] = JSON.parse(JSON.stringify(context[key]));
    }
  }

  // 먼저 간단한 변수 치환을 처리
  let result = template;

  // {character.memories}, {character.name} 등의 중첩된 속성 치환
  result = result.replace(/\{([^{}|]+)\}/g, (match, path) => {
    try {
      const value = path.split(".").reduce((obj, key) => obj?.[key], allowed);
      return value !== undefined ? String(value) : match;
    } catch (e) {
      console.warn(`[populateTemplate] 변수 치환 실패: ${path}`, e);
      return match;
    }
  });

  // 그 다음 magic patterns 처리
  return await parseMagicPatterns(result, allowed);
}

/**
 * Formats group chat messages with sender names and timestamps
 * @param {Array<object>} messages - The conversation history
 * @returns {string} - Formatted messages with sender info and timestamps
 */
function formatGroupChatMessages(messages) {
  if (!messages || messages.length === 0) {
    return "No recent messages.";
  }

  return messages
    .map((msg) => {
      const timestamp = new Date(msg.timestamp).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const sender = msg.isMe ? "User" : msg.sender;
      return `[${timestamp}] ${sender}: ${msg.content || "(No content)"}`;
    })
    .join("\n");
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
 * @param {boolean} [params.isGroupChat=false] - Whether this is a group chat context.
 * @param {boolean} [params.isOpenChat=false] - Whether this is an open chat context.
 * @returns {Promise<{contents: Array<object>, systemPrompt: string}>} - The generated contents and system prompt.
 */
export async function buildContentPrompt({
  userName,
  userDescription,
  character,
  history,
  isProactive = false,
  forceSummary = false,
  isGroupChat = false,
  isOpenChat = false,
}) {
  const chatMLTemplate = await getPrompt("mainChat");

  const lastMessageTime =
    history.length > 0 ? new Date(history[history.length - 1].id) : new Date();
  const currentTime = new Date();
  const timeDiff = Math.round((currentTime - lastMessageTime) / 1000 / 60);

  let timeContext = `(Context: It's currently ${currentTime.toLocaleString("en-US")}.`;
  if (isProactive) {
    const isFirstContactEver = history.length === 0;
    if (character.isRandom && isFirstContactEver) {
      timeContext += ` You are initiating contact for the very first time. You found the user\'s profile interesting and decided to reach out. Your first message MUST reflect this. Greet them and explain why you\'re contacting them, referencing their persona. This is a special instruction just for this one time.)`;
    } else if (isFirstContactEver) {
      timeContext += ` You are starting this conversation for the first time. Greet the user and start a friendly conversation.)`;
    } else {
      timeContext += ` It\'s been ${timeDiff} minutes since the conversation paused. You MUST initiate a new conversation topic. Ask a question or make an observation completely unrelated to the last few messages. Your goal is to re-engage the user with something fresh. Do not continue the previous train of thought.)`;
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

  const availableStickers =
    character.stickers
      ?.map((sticker) => `${sticker.id} (${sticker.name})`)
      .join(", ") || "none";
  const stickerInfo =
    character.stickers && character.stickers.length > 0
      ? `The character has access to the following stickers: ${availableStickers}`
      : "The character has no stickers.";

  // SNS 포스트를 메모리로 변환 (SNS 기반 메모리 시스템)
  const memories = (() => {
    // 1. SNS 포스트가 있으면 SNS 포스트를 메모리로 사용
    if (character.snsPosts && character.snsPosts.length > 0) {
      return character.snsPosts
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // 최신순 정렬
        .slice(0, 15) // 최근 15개만 사용 (컨텍스트 제한)
        .map((post) => {
          const tags =
            post.tags && post.tags.length > 0
              ? ` [${post.tags.join(", ")}]`
              : "";
          const date = new Date(post.timestamp).toLocaleDateString("ko-KR");
          return `- ${post.content}${tags} (${date})`;
        })
        .join("\n");
    }

    // 2. 기존 텍스트 메모리가 있으면 그것을 사용 (하위 호환성)
    if (character.memories && character.memories.length > 0) {
      return character.memories.map((mem) => `- ${mem}`).join("\n");
    }

    // 3. 둘 다 없으면 기본 메시지
    return "No specific memories recorded yet.";
  })();

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
    };

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

  const data = {
    character: { ...character, memories: memories },
    persona: { name: userName, description: userDescription },
    time: {
      context: timeContext,
      diff: timeDiff,
    },
    chat: chat,
  };
  data.char = data.character.name;
  data.user = data.persona.name;

  // Add formatted recent messages for group/open chat contexts
  if (isGroupChat || isOpenChat) {
    data.formatted_recent_messages = formatGroupChatMessages(history);
  }

  const populatedPrompt = await populateTemplate(chatMLTemplate, data);
  const chatMLMessages = parseChatML(populatedPrompt);
  const { systemPrompt, contents: promptContents } = chatMLToPromptStructure(
    chatMLMessages,
    character,
    userName,
    userDescription,
    false, // Don't include user/assistant messages from ChatML prompts
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
        parts.push({
          text:
            msg.content || "(User sent an image that is no longer available)",
        });
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
      parts: [
        { text: "(SYSTEM: You are starting this conversation. Please begin.)" },
      ],
    });
  }

  return {
    contents: [...promptContents, ...conversationContents],
    systemPrompt,
  };
}

/**
 * Builds the system prompt and contents for a character sheet generation request.
 * @param {object} params - The parameters for building the prompt.
 * @param {string} params.characterName - The character's name.
 * @param {string} params.characterDescription - The character's description.
 * @returns {Promise<{systemPrompt: string, contents: Array<object>}>} - The generated system prompt and contents.
 */
export async function buildCharacterSheetPrompt({
  characterName,
  characterDescription,
}) {
  const chatMLTemplate = await getPrompt("characterSheet");

  const data = {
    character: {
      name: characterName,
      description: characterDescription || undefined,
    },
    persona: {},
  };
  data.char = data.character.name;
  data.user = data.persona.name;

  const populatedPrompt = await populateTemplate(chatMLTemplate, data);
  const chatMLMessages = parseChatML(populatedPrompt);
  const { systemPrompt, contents } = chatMLToPromptStructure(
    chatMLMessages,
    null,
    "",
    "",
    true, // Allow conversation messages for character sheet generation
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
  const chatMLTemplate = await getPrompt("profileCreation");

  const data = {
    character: {},
    persona: {
      name: userName,
      description: userDescription,
    },
  };
  data.char = data.character.name;
  data.user = data.persona.name;

  const populatedPrompt = await populateTemplate(chatMLTemplate, data);
  const chatMLMessages = parseChatML(populatedPrompt);
  const { systemPrompt, contents } = chatMLToPromptStructure(
    chatMLMessages,
    null,
    "",
    "",
    true, // Allow conversation messages for profile generation
  );

  return { systemPrompt, contents };
}
