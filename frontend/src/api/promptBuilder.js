/**
 * This module is responsible for building the prompts for the various API clients.
 * It uses the new promptManager to fetch ChatML prompts and then populates them with dynamic data.
 */
import { getPrompt } from '../prompts/promptManager.ts';
import { parseChatML, chatMLToPromptStructure } from './chatMLParser.js';

/**
 * Replaces placeholders in a string with values from a given data object.
 * @param {string} template - The string template with placeholders like {key.name}.
 * @param {object} data - The object containing the data to fill in.
 * @returns {string} The populated string.
 */
function populateTemplate(template, data) {
  if (!template) return '';
  return template.replace(/\{(\w+(?:\.\w+)*)\}/g, (match, key) => {
    const keys = key.split('.');
    let value = data;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return match; // Keep placeholder if key not found
      }
    }
    return value;
  });
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
  forceSummary = false
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

  const memories = character.memories && character.memories.length > 0
    ? character.memories.map(mem => `- ${mem}`).join('\n')
    : 'No specific memories recorded yet.';

  const data = {
    user: {
      name: userName || 'Not specified',
      description: userDescription || 'Not specified',
    },
    character: {
      ...character,
      stickers: stickerInfo,
      memories: memories,
    },
    time: {
      context: timeContext,
      diff: timeDiff,
    },
  };

  const populatedPrompt = populateTemplate(chatMLTemplate, data);
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
      description: characterDescription || 'No description provided.',
    },
  };

  const populatedPrompt = populateTemplate(chatMLTemplate, data);
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
    user: {
      name: userName,
      description: userDescription,
    },
  };

  const populatedPrompt = populateTemplate(chatMLTemplate, data);
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