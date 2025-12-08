import type { Character } from "$root/types/character";

/**
 * ChatML (Chat Markup Language) Parser for ArisuTalk
 */

export interface ChatMLMessage {
    role: string;
    content: string;
}

export interface InternalContent {
    role: string;
    parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[];
    content?: string;
}

export interface PromptStructure {
    systemPrompt: string;
    contents: InternalContent[];
}

/**
 * Parses ChatML format text or plain text into message objects
 */
export function parseChatML(chatMLText: string): ChatMLMessage[] {
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

    const messages: ChatMLMessage[] = [];
    const lines = chatMLText.split("\n");
    let currentMessage: { role: string } | null = null;
    let contentLines: string[] = [];

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
 */
export function chatMLToPromptStructure(
    messages: ChatMLMessage[],
    character: Character | null,
    userName: string = "",
    userDescription: string = "",
    includeConversation: boolean = false
): PromptStructure {
    let systemPrompt = "";
    const contents: InternalContent[] = [];

    const replacements: Record<string, string> = {
        "character.name": character ? character.name : "",
        "user.name": userName,
        "persona.name": userName,
        "user.description": userDescription,
        "persona.description": userDescription,
    };

    const replacePlaceholders = (text: string) => {
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
 */
export function promptStructureToChatML(systemPrompt: string, contents: InternalContent[]): string {
    let chatML = "";

    // Add system message if present
    if (systemPrompt) {
        chatML += "<|im_start|>system\n" + systemPrompt + "\n<|im_end|>\n";
    }

    // Add conversation contents
    for (const content of contents) {
        const role = content.role === "model" ? "assistant" : content.role;
        const part = content.parts?.[0];
        const text = (part && 'text' in part) ? (part as { text: string }).text : (content.content || "");

        if (text) {
            chatML += "<|im_start|>" + role + "\n" + text + "\n<|im_end|>\n";
        }
    }

    return chatML.trim();
}

/**
 * Validates if a string is valid ChatML format
 */
export function isValidChatML(text: string): boolean {
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
 */
export function getDefaultChatMLTemplate(character: Character | null = null): string {
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
 */
export function buildChatMLFromTraditionalPrompts(
    prompts: any, // defined as object in usage
    character: Character | null,
    userName: string = "",
    userDescription: string = "",
    context: Record<string, string> = {}
): string {
    // Combine all the traditional prompt sections into a comprehensive system message
    const mainPrompts = prompts.main || {};

    // Include ALL sections from mainPrompts, not just hardcoded ones
    const systemSections: string[] = [];

    // Process all sections in the order they appear, with special handling for certain sections
    for (const [key, value] of Object.entries(mainPrompts)) {
        if (!value || !(value as string).trim()) {
            continue; // Skip empty sections
        }

        let processedValue = value as string;

        // Special processing for specific sections
        if (key === "sticker_usage") {
            processedValue = processedValue.replace(
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
