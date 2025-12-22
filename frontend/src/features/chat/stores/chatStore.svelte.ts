import type {
    LocalChat,
    IChatStorageAdapter,
    ChatProvider,
    ProviderType,
    ProviderSettings,
    CommonChatSettings,
} from "@/lib/interfaces";
import type { Message } from "@arisutalk/character-spec/v0/Character/Message";
import { StorageResolver } from "@/lib/adapters/storage/storageResolver";
import { MockChatProvider } from "@/lib/providers/chat/MockChatProvider";
import { GeminiChatProvider } from "@/lib/providers/chat/GeminiChatProvider";
import { HumanMessage } from "@langchain/core/messages";
import { OpenRouterChatProvider } from "@/lib/providers/chat/OpenRouterChatProvider";

export class ChatStore {
    chats = $state<LocalChat[]>([]);
    activeChatId = $state<string | null>(null);
    /** Messages for the currently active chat */
    activeMessages = $state<Message[]>([]);
    isGenerating = $state(false);

    private adapter!: IChatStorageAdapter;
    private activeProvider: ChatProvider<ProviderType> | null = null;
    public readonly initPromise: Promise<void>;

    constructor(adapter?: IChatStorageAdapter) {
        this.initPromise = this.initialize(adapter);
    }

    private async initialize(adapter?: IChatStorageAdapter) {
        this.adapter = adapter || (await StorageResolver.getChatAdapter());
        await this.load();

        // Initialize with default provider (MOCK for now, can be configured)
        // In real app, load from persistence
        await this.setProvider("MOCK", {
            mockDelay: 50,
            responses: ["Response 1", "Response 2"],
        });
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
                content: { type: "text", data: content },
                inlays: [],
            };

            await this.addMessage(chatId, userMessage);

            // Prepare LangChain messages
            // TODO: Load history properly
            const messages = [new HumanMessage(content)];

            // Placeholder for assistant message
            const assistantMessageId = crypto.randomUUID();
            const assistantMessage: Message = {
                id: assistantMessageId,
                chatId,
                role: "assistant",
                content: { type: "text", data: "" },
                inlays: [],
            };

            // Optimistically add to UI
            this.activeMessages.push(assistantMessage);

            const stream = this.activeProvider.stream(messages);
            let fullContent = "";

            const msgIndex = this.activeMessages.findIndex((m) => m.id === assistantMessageId);
            const assistantMessageRef = msgIndex !== -1 ? this.activeMessages[msgIndex] : null;
            for await (const chunk of stream) {
                fullContent += chunk;
                if (assistantMessageRef) {
                    assistantMessageRef.content = {
                        type: "text",
                        data: fullContent,
                    };
                }
            }

            // Save final message to storage
            assistantMessage.content = { type: "text", data: fullContent };
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
