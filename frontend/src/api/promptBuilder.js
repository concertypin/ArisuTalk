/**
 * This module is responsible for building the prompts for the Gemini API.
 * It separates the logic of prompt construction from the API client,
 * allowing for easier management and testing of the prompt engineering aspects.
 */
import { getSystemPrompt } from './prompts.js';

/**
 * Builds the contents and system prompt for a content generation request.
 * @param {object} params - The parameters for building the prompt.
 * @param {string} params.userName - The user's name.
 * @param {string} params.userDescription - The user's description.
 * @param {import('../types.js').Character} params.character - The character object.
 * @param {import('../types.js').Message[]} params.history - The conversation history.
 * @param {import('../types.js').Prompts} params.prompts - The prompt templates.
 * @param {boolean} [params.isProactive=false] - Whether the AI is initiating the conversation.
 * @param {boolean} [params.forceSummary=false] - Whether to force a memory summary.
 * @returns {{contents: Array<object>, systemPrompt: string}} - The generated contents and system prompt. todo
 */
export function buildContentPrompt({ userName, userDescription, character, history, prompts, isProactive = false, forceSummary = false }) {
    let contents = [];
    for (const msg of history) {
        const role = msg.isMe ? "user" : "model";
        let parts = [];

        if (msg.isMe && msg.type === 'image' && msg.imageId) {
            const imageData = character?.media?.find(m => m.id === msg.imageId);
            if (imageData) {
                let textContent = msg.content || "(User sent an image with no caption)";
                parts.push({ text: textContent });
                parts.push({
                    inlineData: {
                        mimeType: imageData.mimeType || 'image/jpeg',
                        data: imageData.dataUrl.split(',')[1]
                    }
                });
            } else {
                parts.push({ text: msg.content || "(User sent an image that is no longer available)" });
            }
        } else if (msg.isMe && msg.type === 'sticker' && msg.stickerData) {
            // 페르소나 스티커: 스티커 이름만 AI에게 전송 (파일 데이터는 전송하지 않음)
            const stickerName = msg.stickerData.stickerName || 'Unknown Sticker';
            let stickerText = `[사용자가 "${stickerName}" 스티커를 보냄]`
            if (msg.content && msg.content.trim()) {
                stickerText += ` ${msg.content}`;
            }
            parts.push({ text: stickerText });
        } else if (msg.content) {
            parts.push({ text: msg.content });
        }

        if (parts.length > 0) {
            contents.push({ role, parts });
        }
    }

    if (isProactive && contents.length === 0) {
        contents.push({
            role: "user",
            parts: [{ text: "(SYSTEM: You are starting this conversation. Please begin.)" }]
        });
    }

    const lastMessageTime = history.length > 0 ? new Date(history[history.length - 1].id) : new Date();
    const currentTime = new Date();
    const timeDiff = Math.round((currentTime.getMilliseconds() - lastMessageTime.getMilliseconds()) / 1000 / 60);

    let timeContext = `(Context: It's currently ${currentTime.toLocaleString('en-US')}.`;
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

    const mainPrompts = prompts.main;

    // 스티커 정보 준비
    const availableStickers = character.stickers?.map(sticker => `${sticker.id} (${sticker.name})`).join(', ') || 'none';

    const guidelines = [
        mainPrompts.memory_generation,
        mainPrompts.character_acting,
        mainPrompts.message_writing,
        mainPrompts.language,
        mainPrompts.additional_instructions,
        mainPrompts.sticker_usage?.replace('{availableStickers}', availableStickers) || ''
    ].join('\n\n');

    const systemPrompt = getSystemPrompt({
        mainPrompts,
        character,
        userName,
        userDescription,
        guidelines,
        availableStickers,
        timeContext,
        timeDiff,
    });

    return { contents, systemPrompt };
}


/**
 * Builds the system prompt and contents for a profile generation request.
 * @param {object} params - The parameters for building the prompt.
 * @param {string} params.userName - The user's name.
 * @param {string} params.userDescription - The user's description.
 * @param {string} params.profileCreationPrompt - The template for creating the profile.
 * @returns {{systemPrompt: string, contents: Array<object>}} - The generated system prompt and contents.
 */
export function buildProfilePrompt({ userName, userDescription, profileCreationPrompt }) {
    const systemPrompt = profileCreationPrompt
        .replace('{userName}', userName)
        .replace('{userDescription}', userDescription);

    const contents = [{
        role: "user",
        parts: [{ text: "Please generate a character profile based on the instructions." }]
    }];

    return { systemPrompt, contents };
}