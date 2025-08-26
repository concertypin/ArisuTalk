/**
 * This module is responsible for building the prompts for the Gemini API.
 * It separates the logic of prompt construction from the API client,
 * allowing for easier management and testing of the prompt engineering aspects.
 */
import { getSystemPrompt } from "./prompts.js";
import { parseChatML, chatMLToPromptStructure, buildChatMLFromTraditionalPrompts } from "./chatMLParser.js";

/**
 * Builds the contents and system prompt for a content generation request.
 * @param {object} params - The parameters for building the prompt.
 * @param {string} params.userName - The user's name.
 * @param {string} params.userDescription - The user's description.
 * @param {object} params.character - The character object.
 * @param {Array<object>} params.history - The conversation history.
 * @param {object} params.prompts - The prompt templates.
 * @param {boolean} [params.isProactive=false] - Whether the AI is initiating the conversation.
 * @param {boolean} [params.forceSummary=false] - Whether to force a memory summary.
 * @returns {{contents: Array<object>, systemPrompt: string}} - The generated contents and system prompt.
 */
export function buildContentPrompt({
  userName,
  userDescription,
  character,
  history,
  prompts,
  isProactive = false,
  forceSummary = false,
}) {
  // Always use ChatML parsing approach
  let chatMLText = '';
  
  // Check if user has provided explicit ChatML prompt
  if (prompts.chatMLPrompt && prompts.chatMLPrompt.trim()) {
    chatMLText = prompts.chatMLPrompt;
  } else {
    // Build ChatML from traditional complex prompt sections
    const lastMessageTime =
      history.length > 0 ? new Date(history[history.length - 1].id) : new Date();
    const currentTime = new Date();
    const timeDiff = Math.round((currentTime - lastMessageTime) / 1000 / 60);

    let timeContext = `(Context: It's currently ${currentTime.toLocaleString("en-US",)}.`;
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

    // Prepare sticker information
    const availableStickers =
      character.stickers
        ?.map((sticker) => `${sticker.id} (${sticker.name})`)
        .join(", ") || "none";

    // Build ChatML from traditional prompts
    chatMLText = buildChatMLFromTraditionalPrompts(
      prompts, 
      character, 
      userName, 
      userDescription, 
      { 
        timeContext, 
        availableStickers, 
        timeDiff 
      }
    );
  }
  
  // Parse ChatML (handles both explicit ChatML and plain text as system messages)
  const chatMLMessages = parseChatML(chatMLText);
  const { systemPrompt, contents } = chatMLToPromptStructure(
    chatMLMessages,
    character,
    userName,
    userDescription
  );
  
  // Add conversation history to ChatML-parsed contents
  let chatMLContents = [...contents];
  
  // Add history messages
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
      // 페르소나 스티커: 스티커 이름만 AI에게 전송 (파일 데이터는 전송하지 않음)
      const stickerName = msg.stickerData.stickerName || "Unknown Sticker";
      let stickerText = `[사용자가 "${stickerName}" 스티커를 보냄]`;
      if (msg.content && msg.content.trim()) {
        stickerText += ` ${msg.content}`;
      }
      parts.push({ text: stickerText });
    } else if (msg.content) {
      parts.push({ text: msg.content });
    }

    if (parts.length > 0) {
      chatMLContents.push({ role, parts });
    }
  }

  // Handle proactive messages for ChatML
  if (isProactive && chatMLContents.length > 0) {
    const lastContent = chatMLContents[chatMLContents.length - 1];
    if (lastContent.role === "model") {
      chatMLContents.pop();
    }
  }

  if (isProactive && chatMLContents.length === 0) {
    chatMLContents.push({
      role: "user",
      parts: [
        { text: "(SYSTEM: You are starting this conversation. Please begin.)" },
      ],
    });
  }

  return { contents: chatMLContents, systemPrompt };
}

/**
 * Builds the system prompt and contents for a character sheet generation request.
 * @param {object} params - The parameters for building the prompt.
 * @param {string} params.characterName - The character's name.
 * @param {string} params.characterDescription - The character's description.
 * @param {string} params.characterSheetPrompt - The template for creating the character sheet.
 * @returns {{systemPrompt: string, contents: Array<object>}} - The generated system prompt and contents.
 */
export function buildCharacterSheetPrompt({
  characterName,
  characterDescription,
  characterSheetPrompt,
}) {
  // Replace variables in the prompt
  const processedPrompt = characterSheetPrompt
    .replace("{characterName}", characterName)
    .replace("{characterDescription}", characterDescription || "기본적인 정보만 제공됨");

  // Parse as ChatML (handles both ChatML format and plain text as system messages)
  const chatMLMessages = parseChatML(processedPrompt);
  const { systemPrompt, contents } = chatMLToPromptStructure(chatMLMessages);
  
  // Add user instruction if no explicit conversation was provided in ChatML
  if (contents.length === 0) {
    contents.push({
      role: "user",
      parts: [
        {
          text: "Please create a character sheet based on the instructions.",
        },
      ],
    });
  }

  return { systemPrompt, contents };
}
