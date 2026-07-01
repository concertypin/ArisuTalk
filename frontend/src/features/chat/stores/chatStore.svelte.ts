import type {
    LocalChat,
    IChatStorageAdapter,
    ChatProvider,
    ProviderType,
    ProviderSettings,
    CommonChatSettings,
    ChatType,
    ChatMessage,
} from "@/lib/interfaces";
import { MessageSchema, type Message } from "@arisutalk/character-spec/v0/Character/Message";
import type { LLMConfig } from "@/lib/types/IDataModel";
import { StorageResolver } from "@/lib/adapters/storage/storageResolver";
import { MockChatProvider } from "@/lib/providers/chat/MockChatProvider";
import { GeminiChatProvider } from "@/lib/providers/chat/GeminiChatProvider";
import { OpenAIChatProvider } from "@/lib/providers/chat/OpenAIChatProvider";
import { GrokChatProvider } from "@/lib/providers/chat/GrokChatProvider";
import { AnthropicChatProvider } from "@/lib/providers/chat/AnthropicChatProvider";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { OpenRouterChatProvider } from "@/lib/providers/chat/OpenRouterChatProvider";
import { settings } from "@/lib/stores/settings.svelte";
import { apply } from "@arisutalk/character-spec/utils";
import { hookService } from "@/lib/services/HookService";
import { characterStore } from "@/features/character/stores/characterStore.svelte";
import { personaStore } from "@/features/persona/stores/personaStore.svelte";
import { Logger } from "@common/logger/Logger";
import type { Persona } from "@/features/persona/schema";
import type { Character } from "@arisutalk/character-spec/types/v0/index";

export class ChatStore {
    chats = $state<LocalChat[]>([]);
    activeChatId = $state<string | null>(null);
    /** Messages for the currently active chat */
    activeMessages = $state<Message[]>([]);
    /** Per-character affection values (persisted across sessions). */
    affectionMap = $state<Record<string, number>>({});
    isGenerating = $state(false);

    private adapter!: IChatStorageAdapter;
    private activeProvider: ChatProvider<ProviderType> | null = null;
    public readonly initPromise: Promise<void>;
    /**
     * Gets the context for the active chat including character and persona.
     * For group chats, provides the primary character and all participant characters.
     * Centralizes lookup logic to avoid repetition and potential desync.
     */
    private get activeChatContext(): {
        activeChat: LocalChat | null;
        character: Character | undefined;
        participants: Character[];
        persona: Persona | null;
    } {
        const activeChat = this.activeChatId
            ? this.chats.find((c) => c.id === this.activeChatId)
            : null;
        const character = activeChat
            ? characterStore.characters.find((c) => c.id === activeChat.characterId)
            : undefined;

        // For group/open chats, resolve all participant characters
        const participantIds = activeChat?.participantIds ?? [];
        const participants = participantIds
            .map((pid) => characterStore.characters.find((c) => c.id === pid))
            .filter((c): c is Character => c !== undefined);

        if (activeChat && !character) {
            // This can happen if characters are still loading. Hooks will be skipped.
            Logger.warn(
                `ChatStore: Character with ID ${activeChat.characterId} not found. Hooks will be skipped.`
            );
        }

        const persona = personaStore.activePersona;
        return { activeChat: activeChat ?? null, character, participants, persona };
    }

    constructor(adapter?: IChatStorageAdapter) {
        this.initPromise = this.initialize(adapter);

        // Watch for settings changes and reload provider
        // Use $effect.root() to create effect context in class
        $effect.root(() => {
            $effect(() => {
                // Track dependencies (prefixed with _ to indicate intentional for reactivity)
                const _activeId = settings.value.activeLLMConfigId;
                const _configs = settings.value.llmConfigs;

                // Skip if not initialized yet
                if (!settings.isLoaded) return;

                // Reload provider when active config or configs change
                void this.loadProviderFromSettings();
            });
        });
    }

    private async initialize(adapter?: IChatStorageAdapter) {
        this.adapter = adapter || (await StorageResolver.getChatAdapter());
        await this.load();

        // Wait for settings to load
        await this.waitForSettings();

        // Load provider from settings (first enabled config)
        await this.loadProviderFromSettings();
    }

    /**
     * Waits for settings to finish loading.
     */
    private async waitForSettings(): Promise<void> {
        // Poll until settings are loaded (max 5 seconds)
        const SETTINGS_POLL_TIMEOUT_MS = 5000;
        const SETTINGS_POLL_INTERVAL_MS = 100;
        for (let i = 0; i < SETTINGS_POLL_TIMEOUT_MS / SETTINGS_POLL_INTERVAL_MS; i++) {
            if (settings.isLoaded) return;
            await new Promise((r) => setTimeout(r, SETTINGS_POLL_INTERVAL_MS));
        }
        Logger.warn("ChatStore: Settings did not load in time, using defaults");
    }

    /**
     * Loads provider from the active LLM config in settings.
     * Falls back to first enabled config if active not found.
     * If no config exists, falls back to Mock provider.
     */
    async loadProviderFromSettings(): Promise<void> {
        const configs = settings.value.llmConfigs;
        const activeId: string | null = settings.value.activeLLMConfigId;

        // Try to find the active config by ID
        let targetConfig = activeId ? configs.find((c) => c.id === activeId && c.enabled) : null;

        // Fall back to first enabled config
        if (!targetConfig) {
            targetConfig = configs.find((c) => c.enabled);
        }

        if (!targetConfig) {
            Logger.info("ChatStore: No LLM config found, using Mock provider");
            await this.setProvider("MOCK", {
                mockDelay: 50,
                responses: ["Please configure an LLM in Settings → LLM Configuration."],
            });
            this.activeConfigId = null;
            return;
        }

        await this.applyConfig(targetConfig);
    }

    /**
     * Applies an LLM config to create the appropriate provider.
     */
    async applyConfig(config: LLMConfig): Promise<void> {
        switch (config.provider) {
            case "Gemini":
                await this.setProvider("GEMINI", config);
                break;
            case "OpenAI":
            case "OpenAI-compatible":
                await this.setProvider("OPENAI", config);
                break;
            case "OpenRouter":
                await this.setProvider("OPENROUTER", config);
                break;
            case "Grok":
                await this.setProvider("GROK", config);
                break;
            case "Mock":
                await this.setProvider("MOCK", config);
                break;
            default: {
                const _exhaustiveCheck: never = config;
                Logger.warn("ChatStore: Provider not supported yet, falling back to Mock");
                await this.setProvider("MOCK", {
                    mockDelay: 50,
                    responses: [`Provider is not implemented yet.`],
                });
            }
        }
        this.activeConfigId = config.id;
    }

    /**
     * Refreshes the provider when settings change.
     * Call this when user modifies LLM configuration.
     */
    async refreshProvider(): Promise<void> {
        await this.loadProviderFromSettings();
    }

    private async load() {
        try {
            await this.adapter.init();
            this.chats = await this.adapter.getAllChats();
        } catch (e) {
            Logger.error("Failed to load chats", e);
            this.chats = [];
        }
    }

    async setProvider<T extends ProviderType>(
        type: T,
        providerSettings: CommonChatSettings & ProviderSettings[T]
    ) {
        if (this.activeProvider) {
            await this.activeProvider.disconnect();
        }

        Logger.structured("llm.request.start", {
            provider: type,
            model: providerSettings.model || "default", // Should check if model is in settings type
        });

        switch (type) {
            case "ANTHROPIC": {
                this.activeProvider = await AnthropicChatProvider.factory.connect(providerSettings);
                break;
            }
            case "GEMINI": {
                this.activeProvider = await GeminiChatProvider.factory.connect(providerSettings);
                break;
            }
            case "MOCK": {
                this.activeProvider = await MockChatProvider.factory.connect(providerSettings);
                break;
            }
            case "OPENAI": {
                this.activeProvider = await OpenAIChatProvider.factory.connect(providerSettings);
                break;
            }
            case "OPENROUTER": {
                this.activeProvider =
                    await OpenRouterChatProvider.factory.connect(providerSettings);
                break;
            }
            case "GROK": {
                this.activeProvider = await GrokChatProvider.factory.connect(providerSettings);
                break;
            }
            default: {
                const _exhaustiveCheck: never = type;
            }
        }
    }

    async createChat(
        characterId: string,
        title: string = "New Chat",
        chatType: ChatType = "direct",
        participantIds?: string[]
    ) {
        const chatId = await this.adapter.createChat(characterId, title, chatType, participantIds);
        const newChat = await this.adapter.getChat(chatId);

        if (newChat) {
            this.chats.push(newChat);
        }

        Logger.structured("chat.session.start", {
            chatId,
            characterId,
            chatType,
            participantCount: participantIds?.length ?? 0,
        });

        return chatId;
    }

    /**
     * Retrieves chats that include a specific character as a participant (group/open chats).
     * @param characterId - The ID of the character.
     * @returns Promise resolving to an array of chats.
     */
    async getChatsByParticipant(characterId: string): Promise<LocalChat[]> {
        return await this.adapter.getChatsByParticipant(characterId);
    }

    /**
     * Retrieves chats for a specific character (direct chats).
     * @param characterId - The ID of the character.
     * @returns Promise resolving to an array of chats.
     */
    async getChats(characterId: string) {
        return await this.adapter.getChatsByCharacter(characterId);
    }

    /**
     * Updates a chat's metadata fields.
     * @param chatId - The ID of the chat to update.
     * @param updates - Partial chat fields to apply.
     */
    async updateChat(chatId: string, updates: Partial<LocalChat>) {
        await this.adapter.updateChat(chatId, updates);
        const index = this.chats.findIndex((c) => c.id === chatId);
        if (index !== -1) {
            Object.assign(this.chats[index], updates);
        }
    }

    /**
     * Creates a group chat with multiple characters.
     * The first character in the array is the primary character; the rest become participants.
     * @param characterIds - Array of character IDs to include in the group chat.
     * @param name - Optional name for the group chat.
     * @returns Promise resolving to the ID of the created chat.
     */
    async createGroupChat(characterIds: string[], name?: string): Promise<string> {
        const [primaryId, ...restIds] = characterIds;
        const title = name ?? `Group Chat (${characterIds.length} participants)`;
        const chatId = await this.adapter.createChat(primaryId, title, "group", restIds);
        const newChat = await this.adapter.getChat(chatId);

        if (newChat) {
            this.chats.push(newChat);
        }

        Logger.structured("chat.session.start", {
            chatId,
            characterId: primaryId,
            chatType: "group",
            participantCount: restIds.length,
        });

        return chatId;
    }

    /**
     * Creates an open chat with a character.
     * Open chats allow other participants to join later.
     * @param characterId - The ID of the primary character.
     * @param title - Optional title for the open chat.
     * @returns Promise resolving to the ID of the created chat.
     */
    async createOpenChat(characterId: string, title?: string): Promise<string> {
        const chatId = await this.adapter.createChat(characterId, title, "open");
        const newChat = await this.adapter.getChat(chatId);

        if (newChat) {
            this.chats.push(newChat);
        }

        Logger.structured("chat.session.start", {
            chatId,
            characterId,
            chatType: "open",
        });

        return chatId;
    }

    /**
     * Adds a character as a participant to an existing group or open chat.
     * @param chatId - The ID of the chat.
     * @param characterId - The ID of the character to add.
     */
    async addParticipant(chatId: string, characterId: string): Promise<void> {
        const chat = await this.adapter.getChat(chatId);
        if (!chat) throw new Error(`Chat ${chatId} not found`);

        const participants = chat.participantIds ?? [];
        if (participants.includes(characterId)) return; // Already a participant

        const updatedParticipants = [...participants, characterId];
        await this.adapter.updateChat(chatId, { participantIds: updatedParticipants });

        // Update local state
        const localChat = this.chats.find((c) => c.id === chatId);
        if (localChat) {
            localChat.participantIds = updatedParticipants;
        }
    }

    /**
     * Removes a character from a group or open chat.
     * @param chatId - The ID of the chat.
     * @param characterId - The ID of the character to remove.
     */
    async removeParticipant(chatId: string, characterId: string): Promise<void> {
        const chat = await this.adapter.getChat(chatId);
        if (!chat) throw new Error(`Chat ${chatId} not found`);

        const participants = chat.participantIds ?? [];
        if (!participants.includes(characterId)) return; // Not a participant

        const updatedParticipants = participants.filter((id) => id !== characterId);
        await this.adapter.updateChat(chatId, { participantIds: updatedParticipants });

        // Update local state
        const localChat = this.chats.find((c) => c.id === chatId);
        if (localChat) {
            localChat.participantIds = updatedParticipants;
        }
    }

    async getChat(chatId: string) {
        return await this.adapter.getChat(chatId);
    }

    async addMessage(chatId: string, message: Message) {
        await this.adapter.addMessage(chatId, message);
        this.updateChatTimestamps(chatId);

        // Update activeMessages if this is the active chat
        if (chatId === this.activeChatId) {
            const messageWithChatId: Message = {
                ...message,
                chatId,
                inlays: message.inlays || [],
            };
            this.activeMessages.push(messageWithChatId);
        }
    }

    /**
     * Updates chat timestamps in the reactive state.
     */
    private updateChatTimestamps(chatId: string) {
        const chat = this.chats.find((c) => c.id === chatId);
        if (chat) {
            chat.lastMessage = Date.now();
            chat.updatedAt = Date.now();
        }
    }

    /**
     * Helper to process an LLM stream and update a message ref.
     */
    private async processStream(
        langChainMessages: (HumanMessage | AIMessage)[],
        assistantMessageId: string
    ) {
        const stream = this.activeProvider!.stream(langChainMessages);
        let fullContent = "";

        for await (const chunk of stream) {
            fullContent += chunk;
            // Re-find to ensure we are updating the current reactive state
            const msgIndex = this.activeMessages.findIndex((m) => m.id === assistantMessageId);
            if (msgIndex !== -1) {
                this.activeMessages[msgIndex].content = {
                    type: "text",
                    data: fullContent,
                };
            }
        }
        return fullContent;
    }

    /**
     * Finalizes a message by saving it to storage and updating timestamps.
     * @param chatId The chat ID to save to.
     * @param message The message object to finalize.
     * @param content The processed content to save.
     */
    private async finalizeMessage(chatId: string, message: Message, content: string) {
        message.content = { type: "text", data: content };
        await this.adapter.addMessage(chatId, message);
        this.updateChatTimestamps(chatId);
    }

    /**
     * Helper to stream and save a response from the LLM.
     */
    private async _streamAndSaveResponse(
        chatId: string,
        langChainMessages: (HumanMessage | AIMessage)[]
    ) {
        const startTime = Date.now();
        const assistantMessageId = crypto.randomUUID();
        const assistantMessage: Message = apply(MessageSchema, {
            id: assistantMessageId,
            chatId,
            role: "assistant",
            timestamp: this.getNextTimestamp(),
            content: { type: "text", data: "" },
        });

        // Optimistically add to UI
        this.activeMessages.push(assistantMessage);

        const fullContent = await this.processStream(langChainMessages, assistantMessageId);

        // Apply output hooks using centralized context getter
        const { character, persona } = this.activeChatContext;

        let processedContent = fullContent;
        if (character) {
            processedContent = await hookService.process(
                fullContent,
                character,
                "output",
                persona ?? undefined
            );
        }

        await this.finalizeMessage(chatId, assistantMessage, processedContent);

        Logger.structured("chat.message.receive", {
            chatId,
            provider: this.activeProvider?.constructor.name || "unknown",
            latencyMs: Date.now() - startTime,
        });
    }

    /**
     * Generates a monotonic timestamp.
     * Ensures that new messages always have a timestamp > the last message effectively.
     */
    private getNextTimestamp(): number {
        const now = Date.now();
        const lastMsg = this.activeMessages[this.activeMessages.length - 1];

        if (!lastMsg?.timestamp) {
            return now;
        }

        // Ensure the new timestamp is strictly greater than the last one.
        return Math.max(now, lastMsg.timestamp + 1);
    }

    async sendMessage(content: string) {
        if (!this.activeChatId || !this.activeProvider) return;

        this.isGenerating = true;
        const chatId = this.activeChatId;

        try {
            // Use centralized context getter for character/persona lookup
            const { activeChat, character, participants, persona } = this.activeChatContext;

            let processedContent = content;
            if (character) {
                processedContent = await hookService.process(
                    content,
                    character,
                    "input",
                    persona ?? undefined
                );
            }

            const userMessage: Message = apply(MessageSchema, {
                id: crypto.randomUUID(),
                chatId,
                role: "user",
                timestamp: this.getNextTimestamp(),
                content: { type: "text", data: processedContent },
            });

            await this.addMessage(chatId, userMessage);

            Logger.structured("chat.message.send", {
                chatId,
                chatType: activeChat?.chatType ?? "direct",
                messageLength: content.length,
            });

            // Build LangChain messages from history
            const baseMessages = this.activeMessages.map((m) => {
                const text = typeof m.content.data === "string" ? m.content.data : "";
                return m.role === "user" ? new HumanMessage(text) : new AIMessage(text);
            });

            // For group/open chats, prepend participant context so the LLM knows who is present
            const isGroupChat = activeChat?.chatType === "group" || activeChat?.chatType === "open";
            const langChainMessages =
                isGroupChat && participants.length > 0
                    ? [
                          new HumanMessage(
                              `[Context: This is a ${activeChat?.chatType} chat. ` +
                                  `Primary character: ${character?.name ?? activeChat?.characterId}. ` +
                                  `Other participants: ${participants.map((p) => p.name ?? p.id).join(", ")}. ` +
                                  `The primary character should respond.]`
                          ),
                          ...baseMessages,
                      ]
                    : baseMessages;

            await this._streamAndSaveResponse(chatId, langChainMessages);
        } catch (error) {
            Logger.error("Generation failed", error);
            Logger.structured("llm.request.error", {
                provider: this.activeProvider?.constructor.name || "unknown",
                errorMessage: String(error),
            });
            throw error;
        } finally {
            this.isGenerating = false;
        }
    }

    abortGeneration() {
        if (this.activeProvider && this.isGenerating) {
            this.activeProvider.abort();
            this.isGenerating = false;
        }
    }

    async deleteChat(chatId: string) {
        await this.adapter.deleteChat(chatId);
        const index = this.chats.findIndex((c) => c.id === chatId);

        if (index !== -1) {
            this.chats.splice(index, 1);
            if (this.activeChatId === chatId) {
                this.activeChatId = null;
                this.activeMessages = [];
            }
        }
    }

    /**
     * Creates a new chat branched from a specific message in the active chat.
     * Copies all messages up to and including the branch point into the new chat.
     * @param fromMessageId - The ID of the message to branch from.
     * @returns Promise resolving to the ID of the new branched chat.
     */
    async branchChat(fromMessageId: string): Promise<string> {
        if (!this.activeChatId) throw new Error("No active chat to branch from");

        const sourceChat = await this.adapter.getChat(this.activeChatId);
        if (!sourceChat) throw new Error("Source chat not found");

        // Create a new chat based on the source chat's properties
        const branchName = `${sourceChat.name || sourceChat.title || "Chat"} (branch)`;
        const chatId = await this.adapter.createChat(
            sourceChat.characterId,
            branchName,
            sourceChat.chatType,
            sourceChat.participantIds
        );
        const branchRoot = sourceChat.branchRootId ?? fromMessageId;

        // Store branching metadata on the new chat
        await this.adapter.updateChat(chatId, {
            parentChatId: this.activeChatId,
            branchRootId: branchRoot,
        });
        // Copy all messages from the source chat up to and including the branch message
        const messages = await this.adapter.getMessages(this.activeChatId);
        const branchIndex = messages.findIndex((m) => m.id === fromMessageId);
        const messagesToCopy = branchIndex >= 0 ? messages.slice(0, branchIndex + 1) : messages;

        for (const msg of messagesToCopy) {
            const branchedMsg: ChatMessage = {
                ...msg,
                chatId,
                branchFromId: fromMessageId,
                branchRootId: branchRoot,
            };
            await this.adapter.addMessage(chatId, branchedMsg);
        }

        // Add to local state
        const newChat = await this.adapter.getChat(chatId);
        if (newChat) {
            this.chats.push(newChat);
        }

        return chatId;
    }

    /**
     * Gets all chats that were branched from the specified chat.
     * @param chatId - The ID of the parent chat.
     * @returns Promise resolving to an array of branched chats.
     */
    async getBranches(chatId: string): Promise<LocalChat[]> {
        const allChats = await this.adapter.getAllChats();
        return allChats.filter((c) => c.parentChatId === chatId);
    }

    /**
     * Updates the affection value for a character.
     * Values are clamped between -100 and 100.
     * @param characterId - The ID of the character.
     * @param value - The new affection value.
     */
    async updateAffection(characterId: string, value: number): Promise<void> {
        const clamped = Math.max(-100, Math.min(100, value));
        this.affectionMap[characterId] = clamped;

        // Persist affection to the active chat if there is one
        if (this.activeChatId) {
            const chat = this.chats.find((c) => c.id === this.activeChatId);
            if (chat) {
                const existingAffection = chat.affection ?? [];
                const existingIndex = existingAffection.findIndex(
                    (a) => a.characterId === characterId
                );
                const updated = {
                    characterId,
                    value: clamped,
                    lastUpdated: Date.now(),
                };

                if (existingIndex >= 0) {
                    existingAffection[existingIndex] = updated;
                } else {
                    existingAffection.push(updated);
                }

                await this.adapter.updateChat(this.activeChatId, {
                    affection: existingAffection,
                });
            }
        }

        Logger.structured("chat.affection.update", {
            characterId,
            value: clamped,
        });
    }

    /**
     * Gets the current affection value for a character.
     * Returns 0 if no affection value has been set.
     * @param characterId - The ID of the character.
     * @returns The current affection value (clamped between -100 and 100).
     */
    getAffection(characterId: string): number {
        // Check active chat's affection states first
        if (this.activeChatId) {
            const chat = this.chats.find((c) => c.id === this.activeChatId);
            if (chat?.affection) {
                const state = chat.affection.find((a) => a.characterId === characterId);
                if (state) return state.value;
            }
        }

        // Fall back to global affection map
        return this.affectionMap[characterId] ?? 0;
    }

    async setActiveChat(chatId: string | null) {
        this.activeChatId = chatId;
        if (chatId) {
            this.activeMessages = await this.adapter.getMessages(chatId);
            const chat = this.chats.find((c) => c.id === chatId);
            Logger.structured("chat.session.start", {
                chatId,
                characterId: chat?.characterId,
            });
        } else {
            this.activeMessages = [];
        }
    }

    /**
     * Updates a message's content.
     * @param messageId - The ID of the message to update.
     * @param newContent - The new text content for the message.
     */
    async updateMessage(messageId: string, newContent: string) {
        if (!this.activeChatId) return;

        const content: Message["content"] = { type: "text", data: newContent };
        await this.adapter.updateMessage(this.activeChatId, messageId, content);

        // Update in reactive state
        const index = this.activeMessages.findIndex((m) => m.id === messageId);
        if (index !== -1) {
            this.activeMessages[index].content = content;
            this.activeMessages[index].timestamp = Date.now();
        }
    }

    /**
     * Deletes a message by ID.
     * @param messageId - The ID of the message to delete.
     */
    async deleteMessage(messageId: string) {
        if (!this.activeChatId) return;

        await this.adapter.deleteMessage(this.activeChatId, messageId);

        // Remove from reactive state
        const index = this.activeMessages.findIndex((m) => m.id === messageId);
        if (index !== -1) {
            this.activeMessages.splice(index, 1);
        }
    }

    /**
     * Regenerates a message and all subsequent messages.
     * Works on any assistant message, not just the latest.
     * @param messageId - The ID of the assistant message to regenerate from.
     */
    async regenerateMessage(messageId: string) {
        if (!this.activeChatId || !this.activeProvider) return;

        const messageIndex = this.activeMessages.findIndex((m) => m.id === messageId);
        if (messageIndex === -1) return;

        const targetMessage = this.activeMessages[messageIndex];
        if (targetMessage.role !== "assistant") return;

        const messagesToDelete = this.activeMessages.slice(messageIndex);

        // Remove from reactive state immediately for better responsiveness
        this.activeMessages.splice(messageIndex);

        this.isGenerating = true;
        const chatId = this.activeChatId;

        try {
            // Delete from storage (can happen in background or parallel)
            await Promise.all(
                messagesToDelete.map((msg) => this.adapter.deleteMessage(chatId, msg.id))
            );

            // Prepare LangChain messages from remaining history
            const langChainMessages = this.activeMessages.map((m) => {
                const text = typeof m.content.data === "string" ? m.content.data : "";
                return m.role === "user" ? new HumanMessage(text) : new AIMessage(text);
            });

            await this._streamAndSaveResponse(chatId, langChainMessages);
        } catch (error) {
            Logger.error("Regeneration failed", error);
            Logger.structured("llm.request.error", {
                provider: this.activeProvider?.constructor.name || "unknown",
                errorMessage: String(error),
            });
            throw error;
        } finally {
            this.isGenerating = false;
        }
    }
}

export const chatStore = new ChatStore();
