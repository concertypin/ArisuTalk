import { test, expect, describe, vi, beforeEach } from "vitest";
import { render } from "vitest-browser-svelte";
import ChatArea from "@/components/ChatArea.svelte";
import { chatStore } from "@/features/chat/stores/chatStore.svelte";
import type { LocalChat } from "@/lib/interfaces";
import type { Message } from "@arisutalk/character-spec/v0/Character/Message";

// Mock the chat store module
vi.mock("@/features/chat/stores/chatStore.svelte", () => {
    const mockStore = {
        isGenerating: false,
        chats: [],
        activeChatId: null,
        activeMessages: [],
        sendMessage: vi.fn(),
    };
    return {
        chatStore: mockStore,
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
            {
                id: "1",
                role: "user",
                content: { type: "string", data: "Hello" },
                chatId: "chat-1",
                inlays: [],
            },
            {
                id: "2",
                role: "assistant",
                content: { type: "string", data: "Hi there!" },
                chatId: "chat-1",
                inlays: [],
            },
        ] satisfies Message[]; // Casting partially correct objects

        const { getByText } = render(ChatArea);

        await expect.element(getByText("Hello")).toBeVisible();
        await expect.element(getByText("Hi there!")).toBeVisible();
    });

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

        const { container } = render(ChatArea);

        // DaisyUI loading-dots class
        const loader = container.querySelector(".loading-dots");
        expect(loader).not.toBeNull();
    });
});
