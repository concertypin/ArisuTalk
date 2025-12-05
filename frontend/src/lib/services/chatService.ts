import { get } from "svelte/store";
import { tick } from "svelte";
import {
    messages,
    selectedChatId,
    isWaitingForResponse,
    chatRooms,
    groupChats,
    openChats,
    typingCharacterId,
    currentMessage,
    editingMessageId,
    virtualStream,
} from "$stores/chat";
import {
    characters,
    characterStateStore,
    type CharacterState,
} from "$stores/character";
import { settings } from "$stores/settings";
import { APIManager } from "$lib/api/apiManager";
import { getPrompt, getAllPrompts } from "$root/prompts/promptManager";
import { addLog } from "$services/logService";
import { isConfirmationModalVisible, confirmationModalData } from "$stores/ui";
import { t } from "$root/i18n";
import { findMessageGroup } from "../../utils";
import {
    applyInputHooks,
    applyOutputHooks,
    applyRequestHooks,
} from "./replaceHookService";
const { replace } = await import("$lib/utils/worker/replace.js");
import type { Character } from "$types/character";
import type { APIConfig } from "$root/defaults";

const apiManager = new APIManager();

async function handleVirtualStream(chatId: string, character: Character, messageParts: any[]) {
    virtualStream.set({
        isStreaming: true,
        chatId: chatId,
        characterId: character.id as string, // Cast to string if needed
        messages: [],
        isTyping: false,
    });

    const streamedMessages: Message[] = [];

    for (let i = 0; i < messageParts.length; i++) {
        const messagePart = messageParts[i];

        // 1. Show typing indicator
        virtualStream.update((s) => ({ ...s, isTyping: true }));
        await new Promise((resolve) =>
            setTimeout(resolve, messagePart.delay || 1000)
        );

        // 2. Add message and hide typing indicator
        // Apply output hooks to AI message
        const outputHookResult = await applyOutputHooks(messagePart.content);
        const processedContent = outputHookResult.modified;

        const botMessage: Message = {
            id: Date.now() + Math.random(),
            sender: character.name,
            characterId: String(character.id),
            content: processedContent,
            time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
            timestamp: Date.now(),
            isMe: false,
            isError: false,
            type: messagePart.sticker ? "sticker" : "text",
            hasText: !!(processedContent && processedContent.trim()),
        };
        streamedMessages.push(botMessage);

        virtualStream.set({
            isStreaming: true,
            chatId: chatId,
            characterId: String(character.id),
            messages: [...streamedMessages] as any,
            isTyping: false,
        });
        await tick(); // Ensure UI updates
    }

    // 3. Finalize: add all messages to the main store and reset virtual stream
    messages.update((allMessages) => {
        const chatMessages = allMessages[chatId] || [];
        return {
            ...allMessages,
            [chatId]: [...chatMessages, ...streamedMessages],
        };
    });

    virtualStream.set({
        isStreaming: false,
        chatId: null,
        characterId: null,
        messages: [],
        isTyping: false,
    });
}

function isGroupChat(chatId: string | null) {
    return chatId && typeof chatId === "string" && chatId.startsWith("group_");
}

function isOpenChat(chatId: string | null) {
    return chatId && typeof chatId === "string" && chatId.startsWith("open_");
}

function getCurrentChatRoom(chatId: string | null) {
    if (!chatId) return null;

    if (isGroupChat(chatId)) {
        return get(groupChats)[chatId] || null;
    }

    if (isOpenChat(chatId)) {
        return get(openChats)[chatId] || null;
    }

    for (const characterId in get(chatRooms)) {
        const rooms = get(chatRooms)[characterId];
        const chatRoom = rooms.find((room: any) => room.id === chatId);
        if (chatRoom) return chatRoom;
    }
    return null;
}

function processAutoPost(character: Character, autoPost: any) {
    if (!autoPost || !autoPost.content?.trim()) return character;

    const allCharacterStates = get(characterStateStore);
    const currentState: CharacterState = allCharacterStates[character.id] || {
        mood: 0.8,
        socialBattery: 1.0,
        energy: 1.0,
        personality: { extroversion: 0.5 },
        currentRooms: [],
        lastActivity: Date.now(),
        affection: 0.3,
        intimacy: 0.2,
        trust: 0.25,
        romantic_interest: 0.0,
        messageCount: 0,
    };
    const timestamp = new Date().toISOString();

    const formattedTags = Array.isArray(autoPost.tags)
        ? autoPost.tags.map((tag: string) => (tag.startsWith("#") ? tag : `#${tag}`))
        : [];

    const newPost = {
        id: `autopost_${character.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: autoPost.type || "memory",
        content: autoPost.content.trim(),
        timestamp: timestamp,
        likes: autoPost.likes || Math.floor(Math.random() * 100),
        comments: autoPost.comments || Math.floor(Math.random() * 20),
        affection_state: {
            affection: currentState?.affection || 0.3,
            intimacy: currentState?.intimacy || 0.2,
            trust: currentState?.trust || 0.25,
            romantic_interest: currentState?.romantic_interest || 0.0,
        },
        access_level: autoPost.access_level || "main-public",
        importance: autoPost.importance || 5.0,
        tags: formattedTags,
        reason: autoPost.reason || "AI 자동 포스팅",
    };

    return {
        ...character,
        snsPosts: [...(character.snsPosts || []), newPost],
    };
}

async function callApiAndHandleResponse(
    chatId: string,
    character: Character,
    history: Message[],
    isProactive = false,
    forceSummary = false
) {
    const currentSettings = get(settings);
    const apiProvider = currentSettings.apiProvider || "gemini";
    const apiConfigs = currentSettings.apiConfigs || {};
    let currentConfig: APIConfig = apiConfigs[apiProvider];
    if (!currentConfig && apiProvider === "gemini") {
        currentConfig = {
            apiKey: currentSettings.apiKey,
            model: currentSettings.model,
            customModels: [],
        };
    }

    if (!currentConfig || !currentConfig.apiKey) {
        isWaitingForResponse.set(false);
        throw new Error("API configuration not found or API key missing");
    }

    const options = {
        maxTokens: currentConfig.maxTokens,
        temperature: currentConfig.temperature,
    };

    try {
        // Apply request hooks to message history
        // This modifies the content sent to the API without changing storage
        const historyWithRequestHooks = await Promise.all(
            history.map(async (msg) => {
                if (msg.type === "text" && msg.content) {
                    const hookResult = await applyRequestHooks(msg.content);
                    return { ...msg, content: hookResult.modified };
                }
                return msg;
            })
        );

        const response = await apiManager.generateContent(
            apiProvider,
            currentConfig.apiKey,
            currentConfig.model || "",
            {
                userName: currentSettings.userName,
                userDescription: currentSettings.userDescription,
                character: character,
                history: historyWithRequestHooks,
                prompts: await getAllPrompts(),
                isProactive,
                forceSummary,
                chatId, // Add chatId to pass to buildContentPrompt
            },
            currentConfig.baseUrl,
            options
        );

        const chatType = isGroupChat(chatId)
            ? "group"
            : isOpenChat(chatId)
              ? "open"
              : "general";
        addLog({
            type: "structured",
            characterName: character.name,
            chatId: chatId,
            chatType: chatType,
            data: {
                personaInput: {
                    characterName: character.name,
                    characterPrompt: character.prompt,
                    characterMemories: character.memories,
                    characterId: character.id,
                },
                outputResponse: {
                    messages: response.messages,
                    newMemory: response.newMemory,
                    characterState: response.characterState,
                    reactionDelay: response.reactionDelay,
                },
                parameters: {
                    model: currentConfig.model,
                    isProactive: isProactive,
                    forceSummary: forceSummary,
                    messageCount: history.length,
                },
                metadata: {
                    chatId,
                    chatType: chatType,
                    timestamp: new Date().toISOString(),
                    apiProvider,
                    model: currentConfig.model,
                },
            },
        });

        if (response.characterState) {
            characterStateStore.update((states) => ({
                ...states,
                [character.id]: {
                    ...(states[character.id] || {}),
                    ...response.characterState,
                },
            }));
        }

        if (response.newMemory && response.newMemory.trim() !== "") {
            const legacyMemoryPost = {
                type: "memory",
                content: response.newMemory.trim(),
                access_level: "main-public",
                importance: 5.0,
                tags: ["추억", "일상"],
                reason: "개별 대화 기반 기억",
            };
            characters.update((chars) => {
                const charIndex = chars.findIndex((c) => c.id === character.id);
                if (charIndex !== -1) {
                    const newChars = [...chars];
                    newChars[charIndex] = processAutoPost(
                        newChars[charIndex] as Character,
                        legacyMemoryPost
                    );
                    return newChars;
                }
                return chars;
            });
        }

        if (response.autoPost) {
            characters.update((chars) => {
                const charIndex = chars.findIndex((c) => c.id === character.id);
                if (charIndex !== -1) {
                    const newChars = [...chars];
                    newChars[charIndex] = processAutoPost(
                        newChars[charIndex] as Character,
                        response.autoPost
                    );
                    return newChars;
                }
                return chars;
            });
        }

        if (
            response.messages &&
            Array.isArray(response.messages) &&
            response.messages.length > 0
        ) {
            handleVirtualStream(chatId, character, response.messages);
        } else if (response.error) {
            throw new Error(response.error);
        }
    } catch (error) {
        console.error("Error sending message:", error);
        const errorMessage: Message = {
            id: Date.now() + 1,
            sender: "System",
            content: (error as Error).message || "Error sending message",
            time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
            timestamp: Date.now(),
            isMe: false,
            isError: true,
            type: "text",
        };
        messages.update((allMessages) => {
            const chatMessages = allMessages[chatId] || [];
            return {
                ...allMessages,
                [chatId]: [...chatMessages, errorMessage],
            };
        });
    }
}

export async function sendMessage(content: string, type: string = "text", payload: object = {}) {
    console.log(
        `sendMessage called with chatId: ${get(selectedChatId)}, isGroupChat: ${isGroupChat(get(selectedChatId))}`
    );
    const chatId = get(selectedChatId);
    if (!chatId) return;

    isWaitingForResponse.set(true);

    // Apply input hooks to user message
    const inputHookResult = await applyInputHooks(content);
    const processedContent = inputHookResult.modified;

    const userMessage: Message = {
        id: Date.now(),
        sender: "user",
        isMe: true,
        content: processedContent,
        type: type,
        time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        }),
        timestamp: Date.now(),
        ...payload,
    };

    messages.update((allMessages) => {
        const chatMessages = allMessages[chatId] || [];
        return { ...allMessages, [chatId]: [...chatMessages, userMessage] };
    });

    currentMessage.set("");

    const chatRoom = getCurrentChatRoom(chatId);
    const history = get(messages)[chatId] || [];

    if (isGroupChat(chatId)) {
        const participants = chatRoom.participantIds || [];
        if (participants.length === 0) {
            isWaitingForResponse.set(false);
            return;
        }

        // Get group chat settings
        const groupSettings = chatRoom.settings || {
            responseFrequency: 0.5,
            maxRespondingCharacters: 1,
            responseDelay: 3000,
            participantSettings: {},
        };

        // Check overall response frequency
        if (Math.random() > groupSettings.responseFrequency) {
            isWaitingForResponse.set(false);
            return;
        }

        // Filter active participants based on individual settings
        const activeParticipants = participants.filter((participantId: string) => {
            const settings = groupSettings.participantSettings[
                participantId
            ] || {
                isActive: true,
                responseProbability: 0.9,
            };
            return (
                settings.isActive &&
                Math.random() < settings.responseProbability
            );
        });

        if (activeParticipants.length === 0) {
            isWaitingForResponse.set(false);
            return;
        }

        // Limit number of responding characters
        const maxResponders = Math.min(
            groupSettings.maxRespondingCharacters,
            activeParticipants.length
        );
        const shuffledParticipants = [...activeParticipants].sort(
            () => Math.random() - 0.5
        );
        const respondingCharacterIds = shuffledParticipants.slice(
            0,
            maxResponders
        );

        // Process responses for each character with delay
        for (let i = 0; i < respondingCharacterIds.length; i++) {
            const characterId = respondingCharacterIds[i];
            const character = get(characters).find((c) => c.id === characterId);

            if (!character) continue;

            // Add delay between responses if not the first one
            if (i > 0) {
                await new Promise((resolve) =>
                    setTimeout(resolve, groupSettings.responseDelay)
                );
            }

            try {
                await callApiAndHandleResponse(chatId, character as Character, history);
            } catch (error) {
                console.error(
                    `Error in group chat response for ${character.name}:`,
                    error
                );
            }
        }

        isWaitingForResponse.set(false);
        typingCharacterId.set(null);
    } else if (isOpenChat(chatId)) {
        const participants = chatRoom.currentParticipants || [];
        if (participants.length === 0) {
            isWaitingForResponse.set(false);
            return;
        }

        const responseChance = 0.7; // 70% chance someone will respond
        if (Math.random() > responseChance) {
            isWaitingForResponse.set(false);
            return;
        }

        const respondingCharacterId =
            participants[Math.floor(Math.random() * participants.length)];
        const character = get(characters).find(
            (c) => c.id === respondingCharacterId
        );

        if (!character) {
            isWaitingForResponse.set(false);
            return;
        }

        try {
            await callApiAndHandleResponse(chatId, character as Character, history);
        } finally {
            isWaitingForResponse.set(false);
            typingCharacterId.set(null);
        }
    } else {
        const character = chatRoom
            ? get(characters).find((c) => c.id === chatRoom.characterId)
            : null;

        if (!character) {
            isWaitingForResponse.set(false);
            return;
        }

        try {
            await callApiAndHandleResponse(chatId, character as Character, history);
        } finally {
            isWaitingForResponse.set(false);
            typingCharacterId.set(null);
        }
    }
}

export function deleteMessageGroup(messageId: number | string) {
    confirmationModalData.set({
        title: t("modal.messageGroupDeleteConfirm.title"),
        message: t("modal.messageGroupDeleteConfirm.message"),
        onConfirm: () => {
            const chatId = get(selectedChatId);
            if (!chatId) return;

            const allMessages = get(messages);
            const currentMessages = allMessages[chatId] || [];

            const messageIndex = currentMessages.findIndex(
                (msg) => msg.id === messageId
            );
            const messageAtTarget = currentMessages[messageIndex];
            const characterName = messageAtTarget?.sender || "";

            const groupInfo = findMessageGroup(
                currentMessages,
                messageIndex,
                characterName
            );

            if (!groupInfo) return;

            const updatedMessages = [
                ...currentMessages.slice(0, groupInfo.startIndex),
                ...currentMessages.slice(groupInfo.endIndex + 1),
            ];

            messages.update((msgs) => ({
                ...msgs,
                [chatId]: updatedMessages,
            }));
        },
    });
    isConfirmationModalVisible.set(true);
}

export function editMessage(messageId: number | string) {
    editingMessageId.set(messageId);
}

export async function saveEditedMessage(messageId: number | string, newContent: string) {
    const chatId = get(selectedChatId);
    if (!chatId) return;

    const allMessages = get(messages);
    const currentMessages = allMessages[chatId] || [];

    const messageIndex = currentMessages.findIndex(
        (msg) => msg.id === messageId
    );
    const messageAtTarget = currentMessages[messageIndex];
    const characterName = messageAtTarget?.sender || "";

    const groupInfo = findMessageGroup(
        currentMessages,
        messageIndex,
        characterName
    );

    if (!groupInfo) return;

    const originalMessage = currentMessages[groupInfo.startIndex];

    const editedMessage: Message = {
        ...originalMessage,
        id: Date.now(),
        content: newContent,
        time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        }),
        timestamp: Date.now(),
    };

    const messagesBefore = currentMessages.slice(0, groupInfo.startIndex);
    const updatedMessages = [...messagesBefore, editedMessage];

    messages.update((msgs) => ({
        ...msgs,
        [chatId]: updatedMessages,
    }));

    editingMessageId.set(null);
    isWaitingForResponse.set(true);

    const character = get(characters).find(
        (c) => c.id === getCurrentChatRoom(chatId)?.characterId
    );
    if (!character) {
        isWaitingForResponse.set(false);
        return;
    }

    try {
        await callApiAndHandleResponse(
            chatId,
            character as Character,
            updatedMessages,
            false,
            true
        );
    } finally {
        isWaitingForResponse.set(false);
        typingCharacterId.set(null);
    }
}

export async function rerollMessage(messageId: number | string) {
    const chatId = get(selectedChatId);
    if (!chatId) return;

    const allMessages = get(messages);
    const currentMessages = allMessages[chatId] || [];

    const messageIndex = currentMessages.findIndex(
        (msg) => msg.id === messageId
    );
    const messageAtTarget = currentMessages[messageIndex];
    const characterName = messageAtTarget?.sender || "";

    const groupInfo = findMessageGroup(
        currentMessages,
        messageIndex,
        characterName
    );

    if (!groupInfo) return;

    const truncatedMessages = currentMessages.slice(0, groupInfo.startIndex);

    messages.update((msgs) => ({
        ...msgs,
        [chatId]: truncatedMessages,
    }));

    isWaitingForResponse.set(true);

    // Find the target message to get character information
    const targetMessage = currentMessages.find((msg) => msg.id === messageId);
    if (!targetMessage) {
        isWaitingForResponse.set(false);
        return;
    }

    let character;

    // For group chats, use the characterId from the message
    if (isGroupChat(chatId) && targetMessage.characterId) {
        character = get(characters).find(
            (c) => c.id === targetMessage.characterId
        );
    }
    // For open chats, use the characterId from the message or find by name
    else if (isOpenChat(chatId) && targetMessage.characterId) {
        character = get(characters).find(
            (c) => c.id === targetMessage.characterId
        );
    }
    // For regular chats, use the chat room's characterId
    else {
        character = get(characters).find(
            (c) => c.id === getCurrentChatRoom(chatId)?.characterId
        );
    }

    // Fallback: if character not found by ID, try to find by name
    if (
        !character &&
        targetMessage.sender &&
        targetMessage.sender !== "user" &&
        targetMessage.sender !== "System"
    ) {
        character = get(characters).find(
            (c) => c.name === targetMessage.sender
        );
    }

    if (!character) {
        isWaitingForResponse.set(false);
        return;
    }

    try {
        await callApiAndHandleResponse(
            chatId,
            character as Character,
            truncatedMessages,
            false,
            true
        );
    } finally {
        isWaitingForResponse.set(false);
        typingCharacterId.set(null);
    }
}

export async function generateSnsPost(messageId: number | string) {
    const chatId = get(selectedChatId);
    if (!chatId) return;

    const allMessages = get(messages);
    const currentMessages = allMessages[chatId] || [];
    const targetMessage = currentMessages.find((msg) => msg.id === messageId);

    if (!targetMessage || targetMessage.isMe) return;

    let character = get(characters).find(
        (c) => c.id === getCurrentChatRoom(chatId)?.characterId
    );
    if (!character && targetMessage) {
        character = get(characters).find(
            (c) => c.name === targetMessage.sender
        );
    }

    if (!character) return;

    try {
        const currentSettings = get(settings);
        const recentConversation = currentMessages
            .slice(-3)
            .map((msg) => `${msg.sender}: ${msg.content}`)
            .join("\n");
        const snsPromptTemplate = await getPrompt("snsForce");

        const snsPrompt = await replace(
            snsPromptTemplate,
            {
                pattern: "{character.name}",
                replace: character.name,
            },
            {
                pattern: "{persona.name}",
                replace: currentSettings.userName || "User",
            },
            {
                pattern: "{persona.description}",
                replace: currentSettings.userDescription || "",
            },
            {
                pattern: "{character.prompt}",
                replace: character.prompt || "",
            },
            {
                pattern: "{recentContext}",
                replace: recentConversation,
            }
        );

        const apiProvider = currentSettings.apiProvider || "gemini";
        const apiConfigs = currentSettings.apiConfigs || {};
        let currentConfig: APIConfig = apiConfigs[apiProvider];
        if (!currentConfig && apiProvider === "gemini") {
            currentConfig = {
                apiKey: currentSettings.apiKey,
                model: currentSettings.model,
                customModels: [],
            };
        }

        if (!currentConfig?.apiKey) throw new Error("API key not set");

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${currentConfig.model}:generateContent?key=${currentConfig.apiKey}`;
        const payload = {
            contents: [{ parts: [{ text: snsPrompt }] }],
            generationConfig: {
                temperature: currentConfig.temperature || 1.25,
                maxOutputTokens: currentConfig.maxTokens || 4096,
            },
        };

        const apiResponse = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!apiResponse.ok)
            throw new Error(`Gemini API call failed: ${apiResponse.status}`);

        const apiData = await apiResponse.json();
        const responseText: string | null =
            apiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!responseText) throw new Error("No text response from Gemini API");

        let parsedResponse = JSON.parse(
            responseText
                .trim()
                .replace(/^```json/, "")
                .replace(/```$/, "")
        );

        if (parsedResponse && parsedResponse.autoPost) {
            characters.update((chars) => {
                const charIndex = chars.findIndex((c) => c.id === character.id);
                if (charIndex !== -1) {
                    const newChars = [...chars];
                    newChars[charIndex] = processAutoPost(
                        newChars[charIndex] as Character,
                        parsedResponse.autoPost
                    );
                    return newChars;
                }
                return chars;
            });

            addLog({
                type: "structured",
                characterName: character.name,
                chatId: chatId,
                chatType: "sns_generation",
                data: {
                    personaInput: {
                        characterName: character.name,
                        characterPrompt: character.prompt,
                        characterMemories: character.memories,
                        characterId: character.id,
                    },
                    systemPrompt: snsPrompt,
                    outputResponse: parsedResponse,
                    parameters: {
                        model: currentConfig.model,
                    },
                    metadata: {
                        chatId,
                        chatType: "sns_generation",
                        timestamp: new Date().toISOString(),
                        apiProvider: "novelai",
                        model: currentConfig.model,
                    },
                },
            });

            confirmationModalData.set({
                title: "SNS Post Created",
                message: `SNS post for ${character.name} created: "${parsedResponse.autoPost.content}"`,
                onConfirm: null,
            });
            isConfirmationModalVisible.set(true);
        } else {
            throw new Error("Failed to generate SNS post from response.");
        }
    } catch (error: any) {
        console.error("Error generating SNS post:", error);
        addLog({
            type: "structured",
            characterName: character?.name || "Unknown",
            chatId: chatId,
            chatType: "sns_generation",
            data: { error: { message: error.message, stack: error.stack } },
        });
        confirmationModalData.set({
            title: "Error",
            message: `Failed to generate SNS post: ${error.message}`,
            onConfirm: null,
        });
        isConfirmationModalVisible.set(true);
    }
}

export function addSystemMessage(chatId: string, content: string) {
    const systemMessage: Message = {
        id: Date.now() + Math.random(),
        sender: "System",
        content: content,
        time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        }),
        timestamp: Date.now(),
        isMe: false,
        isError: false,
        type: "system",
    };

    messages.update((allMessages) => {
        const chatMessages = allMessages[chatId] || [];
        return { ...allMessages, [chatId]: [...chatMessages, systemMessage] };
    });
}
