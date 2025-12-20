import type {
    LocalChat,
    IChatStorageAdapter,
    ChatProvider,
    ProviderType,
    ProviderSettings,
    CommonChatSettings,
} from "@/lib/interfaces";
import type { Message } from "@arisutalk/character-spec/v0/Character/Message";
import type { LLMConfig, LLMProvider } from "@/lib/types/IDataModel";
import { StorageResolver } from "@/lib/adapters/storage/storageResolver";
import { MockChatProvider } from "@/lib/providers/chat/MockChatProvider";
import { GeminiChatProvider } from "@/lib/providers/chat/GeminiChatProvider";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { OpenRouterChatProvider } from "@/lib/providers/chat/OpenRouterChatProvider";
import { settings } from "@/lib/stores/settings.svelte";

/**
 * Maps LLMProvider from settings to ProviderType used by chatStore.
 * Returns null if provider is not supported.
 */
function mapProviderType(provider: LLMProvider): ProviderType | null {
    const mapping: Partial<Record<LLMProvider, ProviderType>> = {
        Gemini: "GEMINI",
        OpenRouter: "OPENROUTER",
        Mock: "MOCK",
        // Anthropic not yet implemented
        // OpenAI and OpenAI-compatible not yet implemented
    };
    return mapping[provider] ?? null;
}

export class ChatStore {
    chats = $state<LocalChat[]>([]);
    activeChatId = $state<string | null>(null);
    /** Messages for the currently active chat */
    activeMessages = $state<Message[]>([]);
    isGenerating = $state(false);

    private adapter!: IChatStorageAdapter;
    private activeProvider: ChatProvider<ProviderType> | null = null;
    public readonly initPromise: Promise<void>;

    /** Currently active LLM config ID from settings */
    private activeConfigId: string | null = null;

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
        console.warn("ChatStore: Settings did not load in time, using defaults");
    }

    /**
     * Loads provider from the active LLM config in settings.
     * Falls back to first enabled config if active not found.
     * If no config exists, falls back to Mock provider.
     */
    async loadProviderFromSettings(): Promise<void> {
        const configs = settings.value.llmConfigs;
        const activeId = settings.value.activeLLMConfigId;

        // Try to find the active config by ID
        let targetConfig = activeId ? configs.find((c) => c.id === activeId && c.enabled) : null;

        // Fall back to first enabled config
        if (!targetConfig) {
            targetConfig = configs.find((c) => c.enabled);
        }

        if (!targetConfig) {
            console.info("ChatStore: No LLM config found, using Mock provider");
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
        const providerType = mapProviderType(config.provider);

        if (!providerType) {
            console.warn(
                `ChatStore: Provider "${config.provider}" not supported yet, falling back to Mock`
            );
            await this.setProvider("MOCK", {
                mockDelay: 50,
                responses: [`Provider "${config.provider}" is not implemented yet.`],
            });
            return;
        }

        const commonSettings: CommonChatSettings = {
            apiKey: config.apiKey,
            baseURL: config.baseURL,
            model: config.model,
            generationParameters: config.generationParameters,
        };

        await this.setProvider(
            providerType,
            commonSettings as Parameters<typeof this.setProvider>[1]
        );
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
            console.error("Failed to load chats", e);
            this.chats = [];
        }
    }

    async setProvider<T extends ProviderType>(
        type: T,
        settings: CommonChatSettings & ProviderSettings[T]
    ) {
        if (this.activeProvider) {
            await this.activeProvider.disconnect();
        }
        switch (type) {
            case "ANTHROPIC": {
                throw new Error("Not implemented yet");
            }
            case "GEMINI": {
                this.activeProvider = await GeminiChatProvider.factory.connect(settings);
                break;
            }
            case "MOCK": {
                this.activeProvider = await MockChatProvider.factory.connect(settings);
                break;
            }
            case "OPENROUTER": {
                this.activeProvider = await OpenRouterChatProvider.factory.connect(settings);
                break;
            }
            default: {
                const _exhaustiveCheck: never = type;
            }
        }
    }

    async createChat(characterId: string, title: string = "New Chat") {
        const chatId = await this.adapter.createChat(characterId, title);
        const newChat = await this.adapter.getChat(chatId);

        if (newChat) {
            this.chats.push(newChat);
        }

        return chatId;
    }

    async getChats(characterId: string) {
        return await this.adapter.getChatsByCharacter(characterId);
    }

    async getChat(chatId: string) {
        return await this.adapter.getChat(chatId);
    }

    async addMessage(chatId: string, message: Message) {
        await this.adapter.addMessage(chatId, message);
        const chat = this.chats.find((c) => c.id === chatId);

        if (chat) {
            chat.lastMessage = Date.now();
            chat.updatedAt = Date.now();
        }

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

    async sendMessage(content: string) {
        if (!this.activeChatId || !this.activeProvider) return;

        this.isGenerating = true;
        const chatId = this.activeChatId;

        try {
            const userMessage: Message = {
                id: crypto.randomUUID(),
                chatId,
                role: "user",
                content: { type: "string", data: content },
                inlays: [],
            };

            await this.addMessage(chatId, userMessage);

            // Prepare LangChain messages from history
            const langChainMessages = this.activeMessages.map((m) => {
                const text = typeof m.content.data === "string" ? m.content.data : "";
                return m.role === "user" ? new HumanMessage(text) : new AIMessage(text);
            });

            // Placeholder for assistant message
            const assistantMessageId = crypto.randomUUID();
            const assistantMessage: Message = {
                id: assistantMessageId,
                chatId,
                role: "assistant",
                content: { type: "string", data: "" },
                inlays: [],
            };

            // Optimistically add to UI
            this.activeMessages.push(assistantMessage);

            const stream = this.activeProvider.stream(langChainMessages);
            let fullContent = "";

            const msgIndex = this.activeMessages.findIndex((m) => m.id === assistantMessageId);
            const assistantMessageRef = msgIndex !== -1 ? this.activeMessages[msgIndex] : null;
            for await (const chunk of stream) {
                fullContent += chunk;
                if (assistantMessageRef) {
                    assistantMessageRef.content = {
                        type: "string",
                        data: fullContent,
                    };
                }
            }

            // Save final message to storage
            assistantMessage.content = { type: "string", data: fullContent };
            await this.adapter.addMessage(chatId, assistantMessage);
            const chat = this.chats.find((c) => c.id === chatId);
            if (chat) {
                chat.lastMessage = Date.now();
                chat.updatedAt = Date.now();
            }
        } catch (error) {
            console.error("Generation failed", error);
            // Handle error state in message
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

    async setActiveChat(chatId: string | null) {
        this.activeChatId = chatId;
        if (chatId) {
            this.activeMessages = await this.adapter.getMessages(chatId);
        } else {
            this.activeMessages = [];
        }
    }
}

export const chatStore = new ChatStore();
