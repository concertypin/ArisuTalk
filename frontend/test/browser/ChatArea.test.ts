import { test, expect, describe, vi, beforeEach } from "vitest";
import { render } from "vitest-browser-svelte";
import ChatArea from "@/components/ChatArea.svelte";
import { chatStore } from "@/features/chat/stores/chatStore.svelte";
import type { LocalChat } from "@/lib/interfaces";
import { MessageSchema, type Message } from "@arisutalk/character-spec/v0/Character/Message";
import { apply } from "@arisutalk/character-spec/utils";

// Mock the chat store module
vi.mock("@/features/chat/stores/chatStore.svelte", () => {
    const mockStore = {
        isGenerating: false,
        chats: [],
        activeChatId: null,
        activeMessages: [],
        sendMessage: vi.fn(),
        createChat: vi.fn().mockResolvedValue("new-chat-id"),
        setActiveChat: vi.fn(),
        updateMessage: vi.fn(),
        deleteMessage: vi.fn(),
        regenerateMessage: vi.fn(),
        initPromise: Promise.resolve(),
    };
    return {
        chatStore: mockStore,
        ChatStore: vi.fn(),
    };
});

describe("ChatArea Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset state
        chatStore.isGenerating = false;
        chatStore.chats = [];
        chatStore.activeChatId = null;
        chatStore.activeMessages = [];
    });

    test("renders select chat prompt when no chat is active", async () => {
        chatStore.activeChatId = null;
        const { getByText } = render(ChatArea);
        await expect
            .element(getByText("Select a chat or create a new one to start messaging."))
            .toBeVisible();
    });

    test("renders empty messages prompt when chat is empty", async () => {
        chatStore.activeChatId = "chat-1";
        chatStore.chats = [
            {
                id: "chat-1",
                name: "Test Chat",
                characterId: "char-1",
                createdAt: 0,
                updatedAt: 0,
                lastMessage: 0,
                title: "Test Chat",
            },
        ] satisfies LocalChat[];
        chatStore.activeMessages = [];

        const { getByText, getByRole } = render(ChatArea);

        await expect.element(getByRole("heading", { name: "Test Chat" })).toBeVisible();
        await expect.element(getByText("No messages yet. Say hello!")).toBeVisible();
    });

    test("renders messages correctly", async () => {
        chatStore.activeChatId = "chat-1";
        chatStore.chats = [
            {
                id: "chat-1",
                name: "Test Chat",
                characterId: "char-1",
                createdAt: 0,
                updatedAt: 0,
                lastMessage: 0,
                title: "Test Chat",
            },
        ] satisfies LocalChat[];
        chatStore.activeMessages = [
            apply(MessageSchema, {
                id: "1",
                role: "user",
                content: { type: "text", data: "Hello" },
                chatId: "chat-1",
            }),
            apply(MessageSchema, {
                id: "2",
                role: "assistant",
                content: { type: "text", data: "Hi there!" },
                chatId: "chat-1",
            }),
        ] satisfies Message[]; // Casting partially correct objects

        const { getByText } = render(ChatArea);

        await expect.element(getByText("Hello")).toBeVisible();
        await expect.element(getByText("Hi there!")).toBeVisible();
    });
    //  something is h
    test("sends message when clicking send button", async () => {
        chatStore.activeChatId = "chat-1";
        chatStore.chats = [
            {
                id: "chat-1",
                name: "Test Chat",
                characterId: "char-1",
                createdAt: 0,
                updatedAt: 0,
                lastMessage: 0,
                title: "Test Chat",
            } satisfies LocalChat,
        ];

        const { getByRole } = render(ChatArea);

        const input = getByRole("textbox");
        await input.fill("Hello World");

        const sendBtn = getByRole("button", { name: "Send" });
        await sendBtn.click();

        expect(chatStore.sendMessage).toHaveBeenCalledWith("Hello World");
    });

    test("shows typing indicator when generating", async () => {
        chatStore.activeChatId = "chat-1";
        chatStore.chats = [
            {
                id: "chat-1",
                name: "Test Chat",
                characterId: "char-1",
                createdAt: 0,
                updatedAt: 0,
                lastMessage: 0,
                title: "Test Chat",
            } satisfies LocalChat,
        ];
        chatStore.isGenerating = true;

        const { getByRole } = render(ChatArea);

        // DaisyUI loading-dots uses generic element, check via status role or structure
        await expect.element(getByRole("status")).toBeVisible();
    });

    test("renders action buttons on messages", async () => {
        chatStore.activeChatId = "chat-1";
        chatStore.chats = [
            {
                id: "chat-1",
                name: "Test Chat",
                characterId: "char-1",
                createdAt: 0,
                updatedAt: 0,
                lastMessage: 0,
                title: "Test Chat",
            } satisfies LocalChat,
        ];
        chatStore.activeMessages = [
            apply(MessageSchema, {
                id: "msg-1",
                role: "user",
                content: { type: "text", data: "Hello" },
                chatId: "chat-1",
            }),
        ] satisfies Message[];

        const { getByTitle } = render(ChatArea);

        // Action buttons should exist (hidden until hover via CSS)
        await expect.element(getByTitle("Edit message")).toBeInTheDocument();
        await expect.element(getByTitle("Delete message")).toBeInTheDocument();
    });

    test("calls deleteMessage when delete button is clicked", async () => {
        chatStore.activeChatId = "chat-1";
        chatStore.chats = [
            {
                id: "chat-1",
                name: "Test Chat",
                characterId: "char-1",
                createdAt: 0,
                updatedAt: 0,
                lastMessage: 0,
                title: "Test Chat",
            } satisfies LocalChat,
        ];
        chatStore.activeMessages = [
            apply(MessageSchema, {
                id: "msg-1",
                role: "user",
                content: { type: "text", data: "Hello" },
                chatId: "chat-1",
            }),
        ] satisfies Message[];

        const { getByTitle } = render(ChatArea);

        const deleteBtn = getByTitle("Delete message");
        await deleteBtn.click();
        // Need second click to confirm due to red confirm button
        await deleteBtn.click();

        expect(chatStore.deleteMessage).toHaveBeenCalledWith("msg-1");
    });

    test("shows regenerate button only on assistant messages", async () => {
        chatStore.activeChatId = "chat-1";
        chatStore.chats = [
            {
                id: "chat-1",
                name: "Test Chat",
                characterId: "char-1",
                createdAt: 0,
                updatedAt: 0,
                lastMessage: 0,
                title: "Test Chat",
            } satisfies LocalChat,
        ];
        chatStore.activeMessages = [
            apply(MessageSchema, {
                id: "msg-1",
                role: "user",
                content: { type: "text", data: "Hello" },
                chatId: "chat-1",
            }),
            apply(MessageSchema, {
                id: "msg-2",
                role: "assistant",
                content: { type: "text", data: "Hi there!" },
                chatId: "chat-1",
            }),
        ] satisfies Message[];

        const { getByTitle } = render(ChatArea);

        // Should have 2 messages, only assistant should have regenerate button
        // getByTitle returns the single element, if multiple exist it would throw
        await expect.element(getByTitle("Regenerate response")).toBeInTheDocument();
    });

    test("calls regenerateMessage when regenerate button is clicked", async () => {
        chatStore.activeChatId = "chat-1";
        chatStore.chats = [
            {
                id: "chat-1",
                name: "Test Chat",
                characterId: "char-1",
                createdAt: 0,
                updatedAt: 0,
                lastMessage: 0,
                title: "Test Chat",
            } satisfies LocalChat,
        ];
        chatStore.activeMessages = [
            apply(MessageSchema, {
                id: "msg-1",
                role: "user",
                content: { type: "text", data: "Hello" },
                chatId: "chat-1",
            }),
            apply(MessageSchema, {
                id: "msg-2",
                role: "assistant",
                content: { type: "text", data: "Hi there!" },
                chatId: "chat-1",
            }),
        ] satisfies Message[];

        const { getByTitle } = render(ChatArea);

        const regenerateBtn = getByTitle("Regenerate response");
        await regenerateBtn.click();

        expect(chatStore.regenerateMessage).toHaveBeenCalledWith("msg-2");
    });
});
