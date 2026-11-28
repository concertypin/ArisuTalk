import { test, expect, describe, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import ChatList from "@/features/chat/components/ChatList.svelte";
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

/** Names of the chats currently in the store for one character, in list order. */
function chatNames(characterId: string): string[] {
    return chatStore.chats.filter((c) => c.characterId === characterId).map((c) => c.name);
}

describe("ChatList sections", () => {
    test("lists the character's direct chats and hides other characters' chats", async () => {
        await seedChat({ title: "알파", characterId: "char-1" });
        await seedChat({ title: "베타", characterId: "char-1" });
        await seedChat({ title: "감마", characterId: "char-2" });

        render(ChatList, { props: { characterId: "char-1" } });

        screen.getByRole("button", { name: /^알파/ });
        screen.getByRole("button", { name: /^베타/ });
        expect(screen.queryByText("감마")).not.toBeInTheDocument();
    });

    test("shows group and open chats in their own section, with a head count for groups only", async () => {
        await seedChat({ title: "혼자", chatType: "direct" });
        await seedChat({ title: "파티", chatType: "group", participantIds: ["char-2", "char-3"] });
        await seedChat({ title: "빈 그룹", chatType: "group", participantIds: [] });
        await seedChat({ title: "로비", chatType: "open", participantIds: ["char-2"] });
        await seedChat({ title: "다른 파티", chatType: "group", characterId: "char-9" });

        render(ChatList, { props: { characterId: "char-1" } });

        screen.getByText("Group / Open");
        // primary character plus the two participants
        within(screen.getByRole("button", { name: /^파티/ })).getByText("3", { exact: true });
        // a group without further participants still counts its primary character
        within(screen.getByRole("button", { name: /^빈 그룹/ })).getByText("1", { exact: true });
        // open chats are not counted
        expect(
            within(screen.getByRole("button", { name: /^로비/ })).queryByText(/^\d+$/)
        ).not.toBeInTheDocument();
        expect(screen.queryByText("다른 파티")).not.toBeInTheDocument();
        screen.getByRole("button", { name: /^혼자/ });
    });

    test("shows an empty direct-chat hint but no empty state when only group chats exist", async () => {
        await seedChat({ title: "파티", chatType: "group", participantIds: ["char-2"] });

        render(ChatList, { props: { characterId: "char-1" } });

        screen.getByText("No direct chats yet.");
        expect(screen.queryByText("No chats yet.")).not.toBeInTheDocument();
        screen.getByRole("button", { name: /^파티/ });
    });

    test("shows the empty state with creation shortcuts when the character has no chats", async () => {
        await seedChat({ title: "남의 채팅", characterId: "char-2" });

        render(ChatList, { props: { characterId: "char-1" } });

        screen.getByText("No chats yet.");
        screen.getByRole("button", { name: "Create a direct chat" });
        screen.getByRole("button", { name: "start a group chat" });
    });
});

describe("ChatList creating chats", () => {
    test("the plus button creates the next numbered direct chat and opens it", async () => {
        const user = userEvent.setup();
        await seedChat({ title: "Chat 1" });
        await seedChat({ title: "Chat 2" });
        render(ChatList, { props: { characterId: "char-1" } });

        await user.click(screen.getByRole("button", { name: "New Direct Chat" }));

        await screen.findByRole("button", { name: /^Chat 3/ });
        const created = chatStore.chats.find((c) => c.name === "Chat 3");
        expect(created).toBeDefined();
        expect(created?.characterId).toBe("char-1");
        await vi.waitFor(() => expect(chatStore.activeChatId).toBe(created?.id));
    });

    test("the empty-state link creates a direct chat for the character", async () => {
        const user = userEvent.setup();
        render(ChatList, { props: { characterId: "char-1" } });

        await user.click(screen.getByRole("button", { name: "Create a direct chat" }));

        await screen.findByRole("button", { name: /^Chat 1/ });
        expect(chatNames("char-1")).toEqual(["Chat 1"]);
        await vi.waitFor(() => expect(chatStore.activeChatId).toBe(chatStore.chats[0].id));
    });

    test("the empty-state group link starts an empty group chat and opens it", async () => {
        const user = userEvent.setup();
        const createChat = vi.spyOn(chatStore, "createChat");
        render(ChatList, { props: { characterId: "char-1" } });

        await user.click(screen.getByRole("button", { name: "start a group chat" }));

        await vi.waitFor(() => expect(createChat).toHaveBeenCalledTimes(1));
        expect(createChat).toHaveBeenCalledWith("char-1", "Group 1", "group", []);
        const created = chatStore.chats.find((chat) => chat.name === "Group 1");
        expect(created).toBeDefined();
        await vi.waitFor(() => expect(chatStore.activeChatId).toBe(created?.id));
    });
});

describe("ChatList selection", () => {
    test("clicking a chat makes it active and loads its messages", async () => {
        const user = userEvent.setup();
        const first = await seedChat({ title: "첫째", lastMessage: 2000 });
        const second = await seedChat({ title: "둘째", lastMessage: 1000 });
        await seedMessages(second, [{ role: "user", text: "둘째 채팅의 메시지" }]);
        await chatStore.setActiveChat(first);
        render(ChatList, { props: { characterId: "char-1" } });

        await user.click(screen.getByRole("button", { name: /^둘째/ }));

        await vi.waitFor(() => expect(chatStore.activeChatId).toBe(second));
        expect(chatStore.activeMessages.map((m) => m.content.data)).toEqual(["둘째 채팅의 메시지"]);
    });

    test("opens the most recent direct chat when nothing is active", async () => {
        await seedChat({ title: "오래됨", lastMessage: 1000 });
        const newest = await seedChat({ title: "최신", lastMessage: 3000 });
        await seedChat({ title: "중간", lastMessage: 2000 });

        render(ChatList, { props: { characterId: "char-1" } });

        await vi.waitFor(() => expect(chatStore.activeChatId).toBe(newest));
    });

    test("opens the most recent group chat when the character has no direct chats", async () => {
        await seedChat({ title: "오래된 그룹", chatType: "group", lastMessage: 1000 });
        const newest = await seedChat({ title: "새 그룹", chatType: "group", lastMessage: 5000 });
        await seedChat({ title: "로비", chatType: "open", lastMessage: 3000 });

        render(ChatList, { props: { characterId: "char-1" } });

        await vi.waitFor(() => expect(chatStore.activeChatId).toBe(newest));
    });

    test("prefers a direct chat over a more recent group chat", async () => {
        const direct = await seedChat({ title: "다이렉트", lastMessage: 1000 });
        await seedChat({ title: "그룹", chatType: "group", lastMessage: 9000 });

        render(ChatList, { props: { characterId: "char-1" } });

        await vi.waitFor(() => expect(chatStore.activeChatId).toBe(direct));
    });

    test("clears the active chat when the character has no chats", async () => {
        const foreign = await seedChat({ title: "남의 채팅", characterId: "char-2" });
        await chatStore.setActiveChat(foreign);

        render(ChatList, { props: { characterId: "char-1" } });

        await vi.waitFor(() => expect(chatStore.activeChatId).toBeNull());
    });

    test("keeps the active chat when it already belongs to the character", async () => {
        await seedChat({ title: "최근", lastMessage: 9000 });
        const chosen = await seedChat({ title: "선택됨", lastMessage: 1000 });
        await chatStore.setActiveChat(chosen);

        render(ChatList, { props: { characterId: "char-1" } });

        await screen.findByRole("button", { name: /^선택됨/ });
        expect(chatStore.activeChatId).toBe(chosen);
    });

    test("switches to the new character's most recent chat when the character changes", async () => {
        const a1 = await seedChat({ title: "A1", characterId: "char-a", lastMessage: 1000 });
        await seedChat({ title: "B1", characterId: "char-b", lastMessage: 1000 });
        const b2 = await seedChat({ title: "B2", characterId: "char-b", lastMessage: 2000 });
        await chatStore.setActiveChat(a1);
        const { rerender } = render(ChatList, { props: { characterId: "char-a" } });
        await screen.findByRole("button", { name: /^A1/ });

        await rerender({ characterId: "char-b" });

        await vi.waitFor(() => expect(chatStore.activeChatId).toBe(b2));
        await screen.findByRole("button", { name: /^B1/ });
        expect(screen.queryByText("A1")).not.toBeInTheDocument();
    });
});

describe("ChatList deleting chats", () => {
    test("deleting asks for confirmation and removes the chat once confirmed", async () => {
        const user = userEvent.setup();
        const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
        const keep = await seedChat({ title: "남김", lastMessage: 2000 });
        await seedChat({ title: "삭제", lastMessage: 1000 });
        await chatStore.setActiveChat(keep);
        render(ChatList, { props: { characterId: "char-1" } });
        const row = screen.getByRole("button", { name: /^삭제/ });

        await user.click(within(row).getByRole("button", { name: "Delete" }));

        expect(confirm).toHaveBeenCalledWith("Delete this chat?");
        await waitFor(() => expect(screen.queryByText("삭제")).not.toBeInTheDocument());
        expect(chatNames("char-1")).toEqual(["남김"]);
        expect(chatStore.activeChatId).toBe(keep);
    });

    test("declining the confirmation keeps the chat", async () => {
        const user = userEvent.setup();
        const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
        await seedChat({ title: "생존자" });
        render(ChatList, { props: { characterId: "char-1" } });
        const row = screen.getByRole("button", { name: /^생존자/ });

        await user.click(within(row).getByRole("button", { name: "Delete" }));

        expect(confirm).toHaveBeenCalledOnce();
        screen.getByRole("button", { name: /^생존자/ });
        expect(chatNames("char-1")).toEqual(["생존자"]);
    });

    test("deleting the active chat opens the next most recent one", async () => {
        const user = userEvent.setup();
        vi.spyOn(window, "confirm").mockReturnValue(true);
        const doomed = await seedChat({ title: "삭제될 채팅", lastMessage: 3000 });
        const fallback = await seedChat({ title: "대체 채팅", lastMessage: 2000 });
        await seedChat({ title: "가장 오래된 채팅", lastMessage: 1000 });
        await chatStore.setActiveChat(doomed);
        render(ChatList, { props: { characterId: "char-1" } });
        const row = screen.getByRole("button", { name: /^삭제될 채팅/ });

        await user.click(within(row).getByRole("button", { name: "Delete" }));

        await vi.waitFor(() => expect(chatStore.activeChatId).toBe(fallback));
        await waitFor(() => expect(screen.queryByText("삭제될 채팅")).not.toBeInTheDocument());
    });

    test("the delete control also works from the keyboard", async () => {
        const user = userEvent.setup();
        vi.spyOn(window, "confirm").mockReturnValue(true);
        await seedChat({ title: "키보드 채팅" });
        render(ChatList, { props: { characterId: "char-1" } });
        const row = screen.getByRole("button", { name: /^키보드 채팅/ });

        within(row).getByRole("button", { name: "Delete" }).focus();
        await user.keyboard("{Enter}");

        await waitFor(() => expect(screen.queryByText("키보드 채팅")).not.toBeInTheDocument());
        expect(chatNames("char-1")).toEqual([]);
    });

    test("deleting a group chat removes it from the group section", async () => {
        const user = userEvent.setup();
        vi.spyOn(window, "confirm").mockReturnValue(true);
        await seedChat({ title: "다이렉트" });
        await seedChat({ title: "삭제될 그룹", chatType: "group", participantIds: ["char-2"] });
        render(ChatList, { props: { characterId: "char-1" } });
        const row = screen.getByRole("button", { name: /^삭제될 그룹/ });

        await user.click(within(row).getByRole("button", { name: "Delete" }));

        await waitFor(() => expect(screen.queryByText("삭제될 그룹")).not.toBeInTheDocument());
        expect(screen.queryByText("Group / Open")).not.toBeInTheDocument();
    });
});

describe("ChatList branch viewer", () => {
    // The modal is a `<dialog>` that a CSS class (not the `open` attribute) shows, which jsdom does not
    // apply, so its contents are looked up as `hidden`.
    const inDialog = { hidden: true } as const;

    /** Opens the branch viewer of the chat row whose name matches `name`. */
    async function openBranchViewer(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
        const row = screen.getByRole("button", { name });
        await user.click(within(row).getByRole("button", { name: "Branch Viewer" }));
        return screen.findByRole("heading", { name: "Branch Viewer", ...inDialog });
    }

    test("opens the branch viewer for a chat and closes it with the close button", async () => {
        const user = userEvent.setup();
        const chatId = await seedChat({ title: "이야기" });
        await seedMessages(chatId, [{ role: "user", text: "옛날 옛적에" }]);
        render(ChatList, { props: { characterId: "char-1" } });

        await openBranchViewer(user, /^이야기/);
        screen.getByText("옛날 옛적에");

        await user.click(screen.getByRole("button", { name: "✕", ...inDialog }));

        expect(
            screen.queryByRole("heading", { name: "Branch Viewer", ...inDialog })
        ).not.toBeInTheDocument();
    });

    test("closes the branch viewer through the backdrop", async () => {
        const user = userEvent.setup();
        await seedChat({ title: "이야기" });
        render(ChatList, { props: { characterId: "char-1" } });
        await openBranchViewer(user, /^이야기/);

        await user.click(screen.getByRole("button", { name: "close", ...inDialog }));

        expect(
            screen.queryByRole("heading", { name: "Branch Viewer", ...inDialog })
        ).not.toBeInTheDocument();
    });

    test("clicks inside the viewer do not close it", async () => {
        const user = userEvent.setup();
        await seedChat({ title: "이야기" });
        render(ChatList, { props: { characterId: "char-1" } });
        const heading = await openBranchViewer(user, /^이야기/);

        await user.click(heading);

        expect(heading).toBeInTheDocument();
    });

    test("opens the viewer of a group chat", async () => {
        const user = userEvent.setup();
        await seedChat({ title: "다이렉트" });
        const group = await seedChat({
            title: "파티",
            chatType: "group",
            participantIds: ["char-2"],
        });
        await seedMessages(group, [{ role: "assistant", text: "파티에 오신 것을 환영합니다" }]);
        render(ChatList, { props: { characterId: "char-1" } });

        await openBranchViewer(user, /^파티/);

        screen.getByText("파티에 오신 것을 환영합니다");
    });

    test("navigating to a branch from the viewer closes the viewer", async () => {
        const user = userEvent.setup();
        const rootId = await seedChat({ title: "루트", lastMessage: 3000 });
        const branchId = await seedChat({
            title: "가지",
            lastMessage: 1000,
            branchRootId: rootId,
        });
        await chatStore.setActiveChat(rootId);
        render(ChatList, { props: { characterId: "char-1" } });
        const viewer = await openBranchViewer(user, /^루트/);

        // The list row and the viewer's branch entry share the name; the viewer comes last in the DOM.
        const entries = screen.getAllByRole("button", { name: /가지/, ...inDialog });
        await user.click(entries[entries.length - 1]);

        await vi.waitFor(() => expect(chatStore.activeChatId).toBe(branchId));
        expect(viewer).not.toBeInTheDocument();
    });
});
