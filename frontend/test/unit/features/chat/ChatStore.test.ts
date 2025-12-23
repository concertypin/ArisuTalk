import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { ChatStore } from "@/features/chat/stores/chatStore.svelte";
import type { IChatStorageAdapter, LocalChat } from "@/lib/interfaces";
import { MockChatProvider } from "@/lib/providers/chat/MockChatProvider";

// Mock Providers
vi.mock("@/lib/providers/chat/MockChatProvider", () => {
    return {
        MockChatProvider: {
            factory: {
                connect: vi.fn(),
            },
        },
    };
});

vi.mock("@/lib/providers/chat/GeminiChatProvider", () => {
    return {
        GeminiChatProvider: {
            factory: {
                connect: vi.fn(),
            },
        },
    };
});

vi.mock("@/lib/providers/chat/OpenRouterChatProvider", () => {
    return {
        OpenRouterChatProvider: {
            factory: {
                connect: vi.fn(),
            },
        },
    };
});

describe("ChatStore", () => {
    let store: ChatStore;
    let mockAdapter: IChatStorageAdapter;

    beforeEach(async () => {
        vi.clearAllMocks();

        // Create a mock adapter
        mockAdapter = {
            init: vi.fn().mockResolvedValue(undefined),
            getChat: vi.fn(),
            getAllChats: vi.fn().mockResolvedValue([]),
            getChatsByCharacter: vi.fn().mockResolvedValue([]),
            createChat: vi.fn(),
            deleteChat: vi.fn(),
            addMessage: vi.fn(),
            getMessages: vi.fn().mockResolvedValue([]),
        };

        // Mock default provider connection
        (MockChatProvider.factory.connect as Mock).mockResolvedValue({
            disconnect: vi.fn(),
            stream: vi.fn(),
            abort: vi.fn(),
        });

        store = new ChatStore(mockAdapter);
        await store.initPromise;
    });

    it("should initialize with adapter", () => {
        expect(mockAdapter.init).toHaveBeenCalled();
        expect(mockAdapter.getAllChats).toHaveBeenCalled();
    });

    it("should create a chat", async () => {
        const newChatId = "new-chat-id";
        const newChat: LocalChat = {
            id: newChatId,
            characterId: "char-1",
            name: "New Chat",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastMessage: Date.now(),
            title: "New Chat",
        };

        (mockAdapter.createChat as Mock).mockResolvedValue(newChatId);
        (mockAdapter.getChat as Mock).mockResolvedValue(newChat);

        const resultId = await store.createChat("char-1", "New Chat");

        expect(mockAdapter.createChat).toHaveBeenCalledWith("char-1", "New Chat");
        expect(resultId).toBe(newChatId);
        expect(store.chats).toContainEqual(newChat);
    });

    it("should set active chat", async () => {
        const chatId = "chat-1";
        const messages = [
            {
                id: "m1",
                chatId: "chat-1",
                role: "user",
                content: { type: "text", data: "hi" },
                timestamp: Date.now(),
                inlays: [],
            },
        ];

        (mockAdapter.getMessages as Mock).mockResolvedValue(messages);

        await store.setActiveChat(chatId);

        expect(store.activeChatId).toBe(chatId);
        expect(mockAdapter.getMessages).toHaveBeenCalledWith(chatId);
        expect(store.activeMessages).toEqual(messages);
    });

    it("should send message", async () => {
        // Setup active chat
        store.activeChatId = "chat-1";

        // Configure provider via setProvider (type-safe)
        const streamMock = vi.fn().mockImplementation(async function* () {
            yield "Response";
        });
        (MockChatProvider.factory.connect as Mock).mockResolvedValue({
            disconnect: vi.fn(),
            stream: streamMock,
            abort: vi.fn(),
        });
        await store.setProvider("MOCK", { responses: [] });

        await store.sendMessage("Hello");

        expect(mockAdapter.addMessage).toHaveBeenCalledTimes(2); // User + Assistant
        expect(store.activeMessages).toHaveLength(2);
        expect(store.activeMessages[0].content.data).toBe("Hello");
        expect(store.activeMessages[1].content.data).toBe("Response");
    });

    it("should handle provider switch", async () => {
        // First provider setup
        const disconnectSpy = vi.fn();
        (MockChatProvider.factory.connect as Mock).mockResolvedValue({
            disconnect: disconnectSpy,
            stream: vi.fn(),
            abort: vi.fn(),
        });
        await store.setProvider("MOCK", { responses: [] });

        // Switch to new provider
        const newDisconnectSpy = vi.fn();
        (MockChatProvider.factory.connect as Mock).mockResolvedValue({
            disconnect: newDisconnectSpy,
            stream: vi.fn(),
            abort: vi.fn(),
        });
        await store.setProvider("MOCK", { responses: ["new"] });

        // Verify old provider was disconnected
        expect(disconnectSpy).toHaveBeenCalled();
        // Verify new provider was connected
        expect(MockChatProvider.factory.connect).toHaveBeenCalledTimes(3); // init + 2 switches
    });

    it("should delete chat", async () => {
        const chat: LocalChat = {
            id: "chat-1",
            name: "Delete Me",
            characterId: "char-1",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastMessage: Date.now(),
            title: "Delete Me",
        };
        store.chats.push(chat);
        store.activeChatId = "chat-1";

        await store.deleteChat("chat-1");

        expect(mockAdapter.deleteChat).toHaveBeenCalledWith("chat-1");
        expect(store.chats).not.toContain(chat);
        expect(store.activeChatId).toBeNull();
    });
});
