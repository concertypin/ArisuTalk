import { test, expect, describe, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { fillText } from "@test/utils/user";
import { renderWithAppContext } from "@test/utils/appContext.svelte";
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

    test("renders select chat prompt when no chat is active", () => {
        chatStore.activeChatId = null;
        renderWithAppContext(ChatArea, {});
        expect(
            screen.getByText("Select a chat or create a new one to start messaging.")
        ).toBeInTheDocument();
    });

    test("renders empty messages prompt when chat is empty", () => {
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

        renderWithAppContext(ChatArea, {});

        expect(screen.getByRole("heading", { name: "Test Chat" })).toBeInTheDocument();
        expect(screen.getByText("No messages yet. Say hello!")).toBeInTheDocument();
    });

    test("renders messages correctly", () => {
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

        renderWithAppContext(ChatArea, {});

        expect(screen.getByText("Hello")).toBeInTheDocument();
        expect(screen.getByText("Hi there!")).toBeInTheDocument();
    });
    test("sends message when clicking send button", async () => {
        const user = userEvent.setup();
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

        renderWithAppContext(ChatArea, {});

        const input = screen.getByRole("textbox");
        await fillText(user, input, "Hello World");

        const sendBtn = screen.getByRole("button", { name: "Send" });
        await user.click(sendBtn);

        expect(chatStore.sendMessage).toHaveBeenCalledWith("Hello World");
    });

    test("shows typing indicator when generating", () => {
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

        const { container } = renderWithAppContext(ChatArea, {});

        // DaisyUI loading-dots class on span element
        const loader = container.querySelector(".loading-dots");
        expect(loader).not.toBeNull();
    });

    test("renders action buttons on messages", () => {
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

        renderWithAppContext(ChatArea, {});

        // Action buttons should exist (hidden until hover via CSS)
        expect(screen.getByTitle("Edit message")).toBeInTheDocument();
        expect(screen.getByTitle("Delete message")).toBeInTheDocument();
    });

    test("calls deleteMessage when delete button is clicked", async () => {
        const user = userEvent.setup();
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

        renderWithAppContext(ChatArea, {});

        // First click shows confirm button
        const deleteBtn = screen.getByTitle("Delete message");
        await user.click(deleteBtn);

        // After first click, button changes to confirm state with different title
        const confirmBtn = screen.getByTitle("Click again to confirm delete");
        await user.click(confirmBtn);

        expect(chatStore.deleteMessage).toHaveBeenCalledWith("msg-1");
    });

    test("shows regenerate button only on assistant messages", () => {
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

        renderWithAppContext(ChatArea, {});

        // Should have 2 messages, only assistant should have regenerate button
        // getByTitle returns the single element, if multiple exist it would throw
        expect(screen.getByTitle("Regenerate response")).toBeInTheDocument();
    });

    test("calls regenerateMessage when regenerate button is clicked", async () => {
        const user = userEvent.setup();
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

        renderWithAppContext(ChatArea, {});

        const regenerateBtn = screen.getByTitle("Regenerate response");
        await user.click(regenerateBtn);

        expect(chatStore.regenerateMessage).toHaveBeenCalledWith("msg-2");
    });
});
