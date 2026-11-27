import { test, expect, describe, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { apply } from "@arisutalk/character-spec/utils";
import { MessageSchema } from "@arisutalk/character-spec/v0/Character/Message";
import type { ChatMessage } from "@/lib/interfaces";
import BranchViewer from "@/features/chat/components/BranchViewer.svelte";
import { chatStore } from "@/features/chat/stores/chatStore.svelte";
import {
    initChatEnvironment,
    resetChatEnvironment,
    seedChat,
    seedMessages,
} from "@test/utils/chatEnvironment";

beforeAll(async () => {
    await initChatEnvironment();
});

beforeEach(async () => {
    await resetChatEnvironment();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("BranchViewer branched messages", () => {
    /** Seeds a chat with m1 and m2 as roots, plus a reply that branches off m1. */
    async function chatWithBranchedMessage(): Promise<string> {
        const chatId = await seedChat();
        await seedMessages(chatId, [
            { role: "user", text: "루트 질문" },
            { role: "assistant", text: "루트 답변" },
        ]);
        const branched: ChatMessage = {
            ...apply(MessageSchema, {
                id: "branched-reply",
                chatId,
                role: "assistant",
                content: { type: "text", data: "다른 답변" },
            }),
            branchFromId: `${chatId}-m1`,
            branchRootId: `${chatId}-m1`,
        };
        chatStore.activeMessages.push(branched);
        return chatId;
    }

    test("nests a message that branches off another under it with a Branch badge", async () => {
        const chatId = await chatWithBranchedMessage();

        render(BranchViewer, { props: { chatId, onClose: vi.fn() } });

        screen.getByText("다른 답변");
        screen.getByText("루트 질문");
        screen.getByText("루트 답변");
        screen.getByText("Branch", { exact: true });
    });

    test("rendering leaves the stored branching fields of messages untouched", async () => {
        const chatId = await chatWithBranchedMessage();

        render(BranchViewer, { props: { chatId, onClose: vi.fn() } });
        screen.getByText("다른 답변");

        const stored: ChatMessage | undefined = chatStore.activeMessages.find(
            (m) => m.id === "branched-reply"
        );
        expect(stored?.branchFromId).toBe(`${chatId}-m1`);
        expect(stored?.branchRootId).toBe(`${chatId}-m1`);
    });
});

describe("BranchViewer branch navigation", () => {
    test("chats without any root do not appear as each other's branches", async () => {
        // Two chats that were never branched both have `branchRootId === undefined`.
        const chatId = await seedChat({ title: "일반 채팅" });
        await seedChat({ title: "다른 일반 채팅" });
        await chatStore.setActiveChat(chatId);

        render(BranchViewer, { props: { chatId, onClose: vi.fn() } });

        expect(screen.queryByRole("button", { name: /다른 일반 채팅/ })).not.toBeInTheDocument();
    });
});
