import { test, expect, describe, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import ChatList from "@/features/chat/components/ChatList.svelte";
import { chatStore } from "@/features/chat/stores/chatStore.svelte";
import type { LocalChat } from "@/lib/interfaces";

// Mock the chat store
vi.mock("@/features/chat/stores/chatStore.svelte", () => {
    const mockStore = {
        chats: [],
        activeChatId: null,
        createChat: vi.fn().mockResolvedValue("new-chat-id"),
        setActiveChat: vi.fn(),
        deleteChat: vi.fn().mockResolvedValue(undefined),
        isGenerating: false,
        activeMessages: [],
        sendMessage: vi.fn(),
    };
    return {
        chatStore: mockStore,
        ChatStore: vi.fn(),
    };
});

describe("ChatList Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        chatStore.chats = [];
        chatStore.activeChatId = null;
    });

    test("renders header with chat title and new chat button", () => {
        render(ChatList, {
            props: {
                characterId: "char-1",
            },
        });

        const heading = screen.getByRole("heading", { name: /Chats/, level: 3 });
        expect(heading).toBeInTheDocument();

        const newChatButton = screen.getByLabelText("New Direct Chat");
        expect(newChatButton).toBeInTheDocument();
    });

    test("renders empty state when no chats exist", () => {
        render(ChatList, {
            props: {
                characterId: "char-1",
            },
        });

        const emptyMessage = screen.getByText("No chats yet.");
        expect(emptyMessage).toBeInTheDocument();
    });

    test("displays chats filtered by characterId", () => {
        chatStore.chats = [
            {
                id: "chat-1",
                name: "Chat 1",
                characterId: "char-1",
                createdAt: 0,
                updatedAt: 0,
                lastMessage: 0,
                title: "Chat 1",
            } satisfies LocalChat,
            {
                id: "chat-2",
                name: "Chat 2",
                characterId: "char-2",
                createdAt: 0,
                updatedAt: 0,
                lastMessage: 0,
                title: "Chat 2",
            } satisfies LocalChat,
        ];

        render(ChatList, {
            props: {
                characterId: "char-1",
            },
        });

        expect(screen.getByText("Chat 1")).toBeInTheDocument();
        expect(screen.queryByText("Chat 2")).not.toBeInTheDocument();
    });

    test("highlights active chat", () => {
        chatStore.chats = [
            {
                id: "chat-1",
                name: "Chat 1",
                characterId: "char-1",
                createdAt: 0,
                updatedAt: 0,
                lastMessage: 0,
                title: "Chat 1",
            } satisfies LocalChat,
        ];
        chatStore.activeChatId = "chat-1";

        render(ChatList, {
            props: {
                characterId: "char-1",
            },
        });

        const chatButton = screen.getByRole("button", { name: /Chat 1/ });
        expect(chatButton).toBeInTheDocument();
        // The active chat should have the 'menu-active' class
        expect(chatButton).toHaveClass("menu-active");
    });

    test("creates new chat when new chat button is clicked", async () => {
        const user = userEvent.setup();
        render(ChatList, {
            props: {
                characterId: "char-1",
            },
        });

        const newChatButton = screen.getByLabelText("New Direct Chat");
        await user.click(newChatButton);

        expect(chatStore.createChat).toHaveBeenCalledWith("char-1", "Chat 1");
    });

    test("selects chat when chat item is clicked", async () => {
        const user = userEvent.setup();
        chatStore.chats = [
            {
                id: "chat-1",
                name: "Chat 1",
                characterId: "char-1",
                createdAt: 0,
                updatedAt: 0,
                lastMessage: 0,
                title: "Chat 1",
            } satisfies LocalChat,
        ];

        render(ChatList, {
            props: {
                characterId: "char-1",
            },
        });

        const chatButton = screen.getByRole("button", { name: /Chat 1/ });
        await user.click(chatButton);

        expect(chatStore.setActiveChat).toHaveBeenCalledWith("chat-1");
    });

    test("deletes chat when delete button is clicked", async () => {
        const user = userEvent.setup();
        // Mock window.confirm
        const originalConfirm = window.confirm;
        window.confirm = vi.fn(() => true);

        chatStore.chats = [
            {
                id: "chat-1",
                name: "Chat 1",
                characterId: "char-1",
                createdAt: 0,
                updatedAt: 0,
                lastMessage: 0,
                title: "Chat 1",
            } satisfies LocalChat,
        ];

        render(ChatList, {
            props: {
                characterId: "char-1",
            },
        });

        // Hover over the chat item to reveal the delete button
        const chatButton = screen.getByRole("button", { name: /Chat 1/ });
        await user.hover(chatButton);

        // Click the delete button
        const deleteButton = screen.getByLabelText("Delete");
        await user.click(deleteButton);

        expect(window.confirm).toHaveBeenCalled();
        expect(chatStore.deleteChat).toHaveBeenCalledWith("chat-1");

        window.confirm = originalConfirm;
    });

    test("generates sequential chat names", async () => {
        const user = userEvent.setup();
        chatStore.chats = [
            {
                id: "chat-1",
                name: "Chat 1",
                characterId: "char-1",
                createdAt: 0,
                updatedAt: 0,
                lastMessage: 0,
                title: "Chat 1",
            } satisfies LocalChat,
        ];

        render(ChatList, {
            props: {
                characterId: "char-1",
            },
        });

        const newChatButton = screen.getByLabelText("New Direct Chat");
        await user.click(newChatButton);

        expect(chatStore.createChat).toHaveBeenCalledWith("char-1", "Chat 2");
    });
});
