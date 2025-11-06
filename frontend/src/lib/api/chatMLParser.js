/**
 * ChatML (Chat Markup Language) Parser for ArisuTalk
 *
 * This module parses ChatML format prompts and converts them to the internal prompt structure
 * used by different API providers.
 *
 * ChatML Format:
 * <|im_start|>system
 * You are a helpful assistant.
 * <|im_end|>
 * <|im_start|>user
 * Hello!
 * <|im_end|>
 * <|im_start|>assistant
 * Hello! How can I help you today?
 * <|im_end|>
 */

/**
 * Parses ChatML format text or plain text into message objects
 * @param {string} chatMLText - The ChatML formatted text or plain text
 * @returns {Array<{role: string, content: string}>} Array of parsed messages
 */
export function parseChatML(chatMLText) {
    if (!chatMLText || typeof chatMLText !== "string") {
        return [];
    }

    // Check if text contains ChatML tags
    if (!chatMLText.includes("<|im_start|>")) {
        // Treat plain text as a system message
        return [
            {
                role: "system",
                content: chatMLText.trim(),
            },
        ];
    }

    const messages = [];
    const lines = chatMLText.split("\n");
    let currentMessage = null;
    let contentLines = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith("<|im_start|>")) {
            // Start of a new message
            if (currentMessage) {
                // Save previous message
                messages.push({
                    role: currentMessage.role,
                    content: contentLines.join("\n").trim(),
                });
                contentLines = [];
            }

            const role = line.replace("<|im_start|>", "").trim();
            currentMessage = { role };
        } else if (line === "<|im_end|>") {
            // End of current message
            if (currentMessage) {
                messages.push({
                    role: currentMessage.role,
                    content: contentLines.join("\n").trim(),
                });
                currentMessage = null;
                contentLines = [];
            }
        } else if (currentMessage) {
            // Content line
            contentLines.push(lines[i]); // Don't trim to preserve formatting
        }
    }

    // Handle case where last message doesn't have <|im_end|>
    if (currentMessage && contentLines.length > 0) {
        messages.push({
            role: currentMessage.role,
            content: contentLines.join("\n").trim(),
        });
    }

    return messages;
}

/**
 * Converts ChatML messages to the internal prompt structure
 * @param {Array<{role: string, content: string}>} messages - Parsed ChatML messages
 * @param {Object} character - Character object
 * @param {string} userName - User name
 * @param {string} userDescription - User description
 * @param {boolean} includeConversation - Whether to include user/assistant messages from ChatML (default: false)
 * @returns {{systemPrompt: string, contents: Array<Object>}} Internal prompt structure
 */
export function chatMLToPromptStructure(
    messages,
    character,
    userName = "",
    userDescription = "",
    includeConversation = false
) {
    let systemPrompt = "";
    const contents = [];

    const replacements = {
        "character.name": character ? character.name : "",
        "user.name": userName,
        "persona.name": userName,
        "user.description": userDescription,
        "persona.description": userDescription,
    };

    const replacePlaceholders = (text) => {
        if (!text) return "";
        let result = text;
        for (const key in replacements) {
            result = result.replace(
                new RegExp(`{${key}}`, "g"),
                replacements[key]
            );
        }
        return result;
    };

    for (const message of messages) {
        const { role, content } = message;
        const processedContent = replacePlaceholders(content); // Process content here

        if (role === "system") {
            if (systemPrompt) {
                systemPrompt += "\n\n" + processedContent;
            } else {
                systemPrompt = processedContent;
            }
        } else if (
            includeConversation &&
            (role === "user" || role === "assistant")
        ) {
            const internalRole = role === "assistant" ? "model" : "user";
            contents.push({
                role: internalRole,
                parts: [{ text: processedContent }],
            });
        }
    }

    if (!systemPrompt && character) {
        systemPrompt = `You are ${character.name}. Act according to your character description:\n\n${character.prompt || ""}`;
    }

    systemPrompt = replacePlaceholders(systemPrompt); // Also process the final system prompt

    return { systemPrompt, contents };
}

/**
 * Converts internal prompt structure back to ChatML format
 * @param {string} systemPrompt - System prompt
 * @param {Array<Object>} contents - Internal contents array
 * @returns {string} ChatML formatted text
 */
export function promptStructureToChatML(systemPrompt, contents) {
    let chatML = "";

    // Add system message if present
    if (systemPrompt) {
        chatML += "<|im_start|>system\n" + systemPrompt + "\n<|im_end|>\n";
    }

    // Add conversation contents
    for (const content of contents) {
        const role = content.role === "model" ? "assistant" : content.role;
        const text = content.parts?.[0]?.text || content.content || "";

        if (text) {
            chatML += "<|im_start|>" + role + "\n" + text + "\n<|im_end|>\n";
        }
    }

    return chatML.trim();
}

/**
 * Validates if a string is valid ChatML format
 * @param {string} text - Text to validate
 * @returns {boolean} True if valid ChatML format
 */
export function isValidChatML(text) {
    if (!text || typeof text !== "string") {
        return false;
    }

    // Basic validation: must contain at least one im_start and im_end pair
    const hasStart = text.includes("<|im_start|>");
    const hasEnd = text.includes("<|im_end|>");

    if (!hasStart || !hasEnd) {
        return false;
    }

    // Count start and end tags - they should match
    const startCount = (text.match(/<\|im_start\|>/g) || []).length;
    const endCount = (text.match(/<\|im_end\|>/g) || []).length;

    return startCount === endCount && startCount > 0;
}

/**
 * Creates a default ChatML template for users to start with
 * @param {Object} character - Character object (optional)
 * @returns {string} Default ChatML template
 */
export function getDefaultChatMLTemplate(character = null) {
    const characterName = character?.name || "Assistant";
    const characterPrompt =
        character?.prompt || "You are a helpful AI assistant.";

    return `<|im_start|>system
${characterPrompt}

You should respond naturally and stay in character. All responses should be in Korean unless specifically requested otherwise.
<|im_end|>
<|im_start|>user
안녕하세요!
<|im_end|>
<|im_start|>assistant
안녕하세요! 만나서 반갑습니다. 어떤 도움이 필요하신가요?
<|im_end|>`;
}

/**
 * Builds ChatML from traditional complex prompt sections
 * @param {Object} prompts - Traditional prompt sections
 * @param {Object} character - Character object
 * @param {string} userName - User name
 * @param {string} userDescription - User description
 * @param {Object} context - Additional context (timeContext, availableStickers, etc.)
 * @returns {string} ChatML formatted text
 */
export function buildChatMLFromTraditionalPrompts(
    prompts,
    character,
    userName = "",
    userDescription = "",
    context = {}
) {
    // Combine all the traditional prompt sections into a comprehensive system message
    const mainPrompts = prompts.main || {};

    // Include ALL sections from mainPrompts, not just hardcoded ones
    const systemSections = [];

    // Process all sections in the order they appear, with special handling for certain sections
    for (const [key, value] of Object.entries(mainPrompts)) {
        if (!value || !value.trim()) {
            continue; // Skip empty sections
        }

        let processedValue = value;

        // Special processing for specific sections
        if (key === "sticker_usage") {
            processedValue = value.replace(
                "{availableStickers}",
                context.availableStickers || "none"
            );
        }

        systemSections.push(processedValue);
    }

    // Build comprehensive system message
    let systemMessage = systemSections.join("\n\n");

    // Add character-specific context
    if (character) {
        systemMessage = systemMessage
            .replace(/{character\.name}/g, character.name)
            .replace(/{userName}/g, userName)
            .replace(/{userDescription}/g, userDescription);
    }

    // Add contextual information
    if (context.timeContext) {
        systemMessage += "\n\n" + context.timeContext;
    }

    // Return as ChatML format
    return `<|im_start|>system
${systemMessage}
<|im_end|>`;
}
