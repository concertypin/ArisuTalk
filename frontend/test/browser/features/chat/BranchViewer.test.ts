import { test, expect, describe, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { apply } from "@arisutalk/character-spec/utils";
import { MessageSchema } from "@arisutalk/character-spec/v0/Character/Message";
import type { ChatMessage } from "@/lib/interfaces";
import BranchViewer from "@/features/chat/components/BranchViewer.svelte";
import { chatStore } from "@/features/chat/stores/chatStore.svelte";
import { characterStore } from "@/features/character/stores/characterStore.svelte";
import { createTestCharacter } from "@test/utils/character";
import {
    initChatEnvironment,
    resetChatEnvironment,
    seedChat,
    seedMessages,
} from "@test/utils/chatEnvironment";

/** Formats a timestamp the way the component does, so the test does not depend on the locale. */
function timeLabel(ts: number): string {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

beforeAll(async () => {
    await initChatEnvironment();
});

beforeEach(async () => {
    await resetChatEnvironment();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("BranchViewer message tree", () => {
    test("shows an empty state when the chat has no messages", async () => {
        const chatId = await seedChat();
        await chatStore.setActiveChat(chatId);

        render(BranchViewer, { props: { chatId, onClose: vi.fn() } });

        screen.getByText("No messages yet.");
        expect(screen.queryByText("Message Tree")).not.toBeInTheDocument();
    });

    test("lists each message with a role badge, its text and its time", async () => {
        const chatId = await seedChat();
        await seedMessages(chatId, [
            { role: "user", text: "오늘 날씨 어때?", timestamp: 1_700_000_000_000 },
            { role: "assistant", text: "하루 종일 맑아요.", timestamp: 1_700_000_060_000 },
        ]);

        render(BranchViewer, { props: { chatId, onClose: vi.fn() } });

        screen.getByText("Message Tree");
        screen.getByText("You");
        screen.getByText("AI");
        screen.getByText("오늘 날씨 어때?");
        screen.getByText("하루 종일 맑아요.");
        screen.getByText(timeLabel(1_700_000_000_000));
        screen.getByText(timeLabel(1_700_000_060_000));
    });

    test("truncates long messages to 60 characters followed by an ellipsis", async () => {
        const chatId = await seedChat();
        const longText = `${"가".repeat(60)}꼬리꼬리`;
        await seedMessages(chatId, [{ role: "user", text: longText }]);

        render(BranchViewer, { props: { chatId, onClose: vi.fn() } });

        screen.getByText(`${"가".repeat(60)}…`);
        expect(screen.queryByText(/꼬리/)).not.toBeInTheDocument();
    });

    test("keeps a message of exactly 60 characters untruncated", async () => {
        const chatId = await seedChat();
        const text = "나".repeat(60);
        await seedMessages(chatId, [{ role: "user", text }]);

        render(BranchViewer, { props: { chatId, onClose: vi.fn() } });

        screen.getByText(text);
        expect(screen.queryByText(/…/)).not.toBeInTheDocument();
    });

    test("adds a message that arrives while the viewer is open", async () => {
        const chatId = await seedChat();
        await seedMessages(chatId, [{ role: "user", text: "첫 번째 메시지" }]);
        render(BranchViewer, { props: { chatId, onClose: vi.fn() } });
        screen.getByText("첫 번째 메시지");

        await chatStore.addMessage(
            chatId,
            apply(MessageSchema, {
                id: "late",
                chatId,
                role: "assistant",
                content: { type: "text", data: "두 번째 메시지" },
            })
        );

        await screen.findByText("두 번째 메시지");
        screen.getByText("첫 번째 메시지");
    });
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
    test("lists the chats branched from this chat, with character names, and not unrelated chats", async () => {
        characterStore.characters.push(
            createTestCharacter({ id: "char-1", name: "앨리스", description: "앨리스 설명" })
        );
        const rootId = await seedChat({ title: "루트 채팅" });
        await chatStore.setActiveChat(rootId);
        await seedChat({ title: "분기 하나", branchRootId: rootId });
        await seedChat({ title: "분기 둘", characterId: "char-gone", branchRootId: rootId });
        await seedChat({ title: "관련 없는 채팅" });
        await seedChat({ title: "다른 트리", branchRootId: "some-other-root" });

        render(BranchViewer, { props: { chatId: rootId, onClose: vi.fn() } });

        screen.getByText("Branches (2)");
        screen.getByRole("button", { name: /분기 하나/ });
        screen.getByRole("button", { name: /분기 둘/ });
        screen.getByText("앨리스");
        screen.getByText("Unknown Character");
        expect(screen.queryByText("관련 없는 채팅")).not.toBeInTheDocument();
        expect(screen.queryByText("다른 트리")).not.toBeInTheDocument();
    });

    test("shows sibling branches when viewing a branch, and marks where the chat is a branch", async () => {
        const rootId = await seedChat({ title: "루트 채팅" });
        const branchA = await seedChat({ title: "분기 A", branchRootId: rootId });
        await seedChat({ title: "분기 B", branchRootId: rootId });
        await chatStore.setActiveChat(branchA);

        render(BranchViewer, { props: { chatId: branchA, onClose: vi.fn() } });

        screen.getByText("Branches (2)");
        screen.getByRole("button", { name: /분기 B/ });
        screen.getByText(`This chat is a branch. Root ID: ${rootId.substring(0, 8)}…`);
    });

    test("does not claim a plain chat is a branch and shows no branch list when there are none", async () => {
        // Two chats that were never branched both have `branchRootId === undefined`, and must not match each other.
        const chatId = await seedChat({ title: "일반 채팅" });
        await seedChat({ title: "다른 일반 채팅" });
        await chatStore.setActiveChat(chatId);

        render(BranchViewer, { props: { chatId, onClose: vi.fn() } });

        screen.getByText("No messages yet.");
        expect(screen.queryByText(/Branches \(/)).not.toBeInTheDocument();
        expect(screen.queryByText(/This chat is a branch/)).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /다른 일반 채팅/ })).not.toBeInTheDocument();
    });

    test("clicking a branch switches the active chat to it and closes the viewer", async () => {
        const user = userEvent.setup();
        const rootId = await seedChat({ title: "루트 채팅" });
        const branchId = await seedChat({ title: "분기 하나", branchRootId: rootId });
        await seedMessages(branchId, [{ role: "user", text: "분기 안의 메시지" }]);
        await chatStore.setActiveChat(rootId);
        const onClose = vi.fn();
        render(BranchViewer, { props: { chatId: rootId, onClose } });

        await user.click(screen.getByRole("button", { name: /분기 하나/ }));

        await vi.waitFor(() => expect(chatStore.activeChatId).toBe(branchId));
        await vi.waitFor(() =>
            expect(chatStore.activeMessages.map((m) => m.content.data)).toEqual([
                "분기 안의 메시지",
            ])
        );
        expect(onClose).toHaveBeenCalledOnce();
    });
});

describe("BranchViewer creating a branch", () => {
    test("branching creates a chat for the same character linked to the root, opens it and closes", async () => {
        const user = userEvent.setup();
        const chatId = await seedChat({ title: "이야기", characterId: "char-7" });
        await seedMessages(chatId, [{ role: "user", text: "옛날 옛적에" }]);
        const onClose = vi.fn();
        render(BranchViewer, { props: { chatId, onClose } });

        await user.click(screen.getByRole("button", { name: "Branch from this message" }));

        await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
        const branch = chatStore.chats.find((c) => c.name === "이야기 (branch)");
        expect(branch).toBeDefined();
        expect(branch).toMatchObject({ characterId: "char-7", branchRootId: chatId });
        expect(chatStore.activeChatId).toBe(branch?.id);
    });

    test("branching from a branch keeps pointing at the original root", async () => {
        const user = userEvent.setup();
        const rootId = await seedChat({ title: "루트" });
        const branchId = await seedChat({ title: "첫 분기", branchRootId: rootId });
        await seedMessages(branchId, [{ role: "user", text: "분기 안에서" }]);
        const onClose = vi.fn();
        render(BranchViewer, { props: { chatId: branchId, onClose } });

        await user.click(screen.getByRole("button", { name: "Branch from this message" }));

        await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
        const nested = chatStore.chats.find((c) => c.name === "첫 분기 (branch)");
        expect(nested?.branchRootId).toBe(rootId);
    });

    test("branching a group chat passes the chat type and participants on", async () => {
        const user = userEvent.setup();
        const chatId = await seedChat({
            title: "파티",
            chatType: "group",
            participantIds: ["char-2", "char-3"],
        });
        await seedMessages(chatId, [{ role: "user", text: "다들 안녕" }]);
        const createChat = vi.spyOn(chatStore, "createChat");
        const onClose = vi.fn();
        render(BranchViewer, { props: { chatId, onClose } });

        await user.click(screen.getByRole("button", { name: "Branch from this message" }));

        await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
        expect(createChat).toHaveBeenCalledWith("char-1", "파티 (branch)", "group", [
            "char-2",
            "char-3",
        ]);
    });

    test("branching does nothing when the viewed chat does not exist in the store", async () => {
        const user = userEvent.setup();
        const chatId = await seedChat({ title: "이야기" });
        await seedMessages(chatId, [{ role: "user", text: "안녕" }]);
        const createChat = vi.spyOn(chatStore, "createChat");
        const onClose = vi.fn();
        render(BranchViewer, { props: { chatId: "missing-chat", onClose } });

        await user.click(screen.getByRole("button", { name: "Branch from this message" }));

        expect(createChat).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
        expect(chatStore.chats).toHaveLength(1);
    });
});
