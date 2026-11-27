import { test, expect, describe, vi } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import MessageContainer from "@/components/chat/MessageContainer.svelte";
import type { LocalChat } from "@/lib/interfaces";
import { MessageSchema } from "@arisutalk/character-spec/v0/Character/Message";
import { apply } from "@arisutalk/character-spec/utils";

vi.mock("@/features/chat/stores/chatStore.svelte", () => ({
    chatStore: {
        isGenerating: false,
        updateMessage: vi.fn(),
        deleteMessage: vi.fn(),
        regenerateMessage: vi.fn(),
    },
}));

/** A chat with one user message, so each chat has exactly one "Edit message" button. */
function chatWithMessage(id: string) {
    const chat = {
        id,
        name: id,
        title: id,
        characterId: "char-1",
        createdAt: 0,
        updatedAt: 0,
        lastMessage: 0,
    } satisfies LocalChat;
    const messages = [
        apply(MessageSchema, {
            id: `${id}-msg`,
            role: "user",
            content: { type: "text", data: `Hello from ${id}` },
            chatId: id,
        }),
    ];
    return { activeChat: chat, messages };
}

describe("MessageContainer", () => {
    test("leaving a chat ends its edit, so coming back shows the message instead of an empty editor", async () => {
        const user = userEvent.setup();
        const chatA = chatWithMessage("chat-a");
        const chatB = chatWithMessage("chat-b");
        const { rerender } = render(MessageContainer, chatA);

        await user.click(screen.getByRole("button", { name: "Edit message" }));
        expect(screen.getByRole("textbox")).toBeInTheDocument();

        await rerender(chatB);
        await rerender(chatA);

        expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
        expect(screen.getByText("Hello from chat-a")).toBeInTheDocument();
    });
});
