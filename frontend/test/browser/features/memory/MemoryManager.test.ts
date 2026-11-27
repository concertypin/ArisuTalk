/**
 * @fileoverview Component tests for the memory manager. The real memory store runs against a
 * fake IndexedDB, so each test checks both what the user sees and what ends up persisted.
 */
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import MemoryManager from "@/features/memory/components/MemoryManager.svelte";
import { memoryStore } from "@/features/memory/stores/memoryStore.svelte";
import { getArisuDB } from "@/lib/adapters/storage/IndexedDBHelper";
import type { MemoryEntry } from "@/lib/types/memory";
import { fillText } from "@test/utils/user";

const DAY_MS = 864e5;

/** ISO timestamp `ms` milliseconds before now. */
function ago(ms: number): string {
    return new Date(Date.now() - ms).toISOString();
}

function memory(overrides: Partial<MemoryEntry> & Pick<MemoryEntry, "id">): MemoryEntry {
    return {
        characterId: "char-1",
        content: `content of ${overrides.id}`,
        type: "fact",
        timestamp: ago(60_000),
        importance: 0.5,
        lastAccessed: ago(60_000),
        ...overrides,
    };
}

describe("MemoryManager", () => {
    const db = getArisuDB();

    /** Seeds the database before the component mounts and loads it. */
    async function seed(...entries: MemoryEntry[]) {
        await db.memories.bulkPut(entries);
    }

    beforeEach(async () => {
        await memoryStore.initPromise;
        await db.memories.clear();
        memoryStore.memories = [];
        memoryStore.activeCharacterId = null;
    });

    afterEach(async () => {
        await db.memories.clear();
    });

    describe("listing", () => {
        test("shows the empty state when the character has no memories", async () => {
            render(MemoryManager, { props: { characterId: "char-1" } });

            await screen.findByText("No memories yet.");
            screen.getByRole("button", { name: "All (0)" });
        });

        test("lists the loaded memories with their type and the total count", async () => {
            await seed(
                memory({ id: "f", type: "fact", content: "차를 좋아함" }),
                memory({ id: "c", type: "conversation", content: "날씨를 물어봄" }),
                memory({ id: "s", type: "summary", content: "이전 대화 요약" })
            );
            render(MemoryManager, { props: { characterId: "char-1" } });

            await screen.findByText("차를 좋아함");
            screen.getByText("날씨를 물어봄");
            screen.getByText("이전 대화 요약");
            screen.getByRole("button", { name: "All (3)" });
            screen.getByText("Fact", { exact: true });
            screen.getByText("Summary", { exact: true });
        });

        test("only shows memories that belong to the given character", async () => {
            await seed(
                memory({ id: "mine", content: "내 기억" }),
                memory({ id: "theirs", characterId: "char-2", content: "남의 기억" })
            );
            render(MemoryManager, { props: { characterId: "char-1" } });

            await screen.findByText("내 기억");
            expect(screen.queryByText("남의 기억")).not.toBeInTheDocument();
        });

        test("reloads the list when the character changes", async () => {
            await seed(
                memory({ id: "a", content: "알파 기억" }),
                memory({ id: "b", characterId: "char-2", content: "베타 기억" })
            );
            const { rerender } = render(MemoryManager, { props: { characterId: "char-1" } });
            await screen.findByText("알파 기억");

            await rerender({ characterId: "char-2" });

            await screen.findByText("베타 기억");
            expect(screen.queryByText("알파 기억")).not.toBeInTheDocument();
        });

        test("shows the newest memory first", async () => {
            await seed(
                memory({ id: "old", content: "오래된 기억", timestamp: ago(3 * DAY_MS) }),
                memory({ id: "new", content: "최근 기억", timestamp: ago(1 * DAY_MS) })
            );
            render(MemoryManager, { props: { characterId: "char-1" } });
            await screen.findByText("오래된 기억");

            const rows = screen.getAllByRole("button", { name: /기억/ });
            expect(rows[0]).toHaveTextContent("최근 기억");
            expect(rows[1]).toHaveTextContent("오래된 기억");
        });
    });

    describe("tabs", () => {
        test("filters the list by type and shows the empty message for a type without entries", async () => {
            const user = userEvent.setup();
            await seed(
                memory({ id: "f", type: "fact", content: "사실 하나" }),
                memory({ id: "c", type: "conversation", content: "대화 하나" })
            );
            render(MemoryManager, { props: { characterId: "char-1" } });
            await screen.findByText("사실 하나");

            await user.click(screen.getByRole("button", { name: "Facts" }));
            screen.getByText("사실 하나");
            expect(screen.queryByText("대화 하나")).not.toBeInTheDocument();

            await user.click(screen.getByRole("button", { name: "Conversation" }));
            screen.getByText("대화 하나");
            expect(screen.queryByText("사실 하나")).not.toBeInTheDocument();

            await user.click(screen.getByRole("button", { name: "Summaries" }));
            screen.getByText("No memories yet.");

            await user.click(screen.getByRole("button", { name: /^All/ }));
            screen.getByText("사실 하나");
            screen.getByText("대화 하나");
        });
    });

    describe("adding a fact", () => {
        test("keeps Save disabled for empty or whitespace-only text", async () => {
            const user = userEvent.setup();
            render(MemoryManager, { props: { characterId: "char-1" } });
            const save = screen.getByRole("button", { name: "Save" });
            expect(save).toBeDisabled();

            await fillText(user, screen.getByRole("textbox"), "   ");
            expect(save).toBeDisabled();

            await fillText(user, screen.getByRole("textbox"), "진짜 사실");
            expect(save).toBeEnabled();
        });

        test("saves a trimmed fact with the default importance, shows it and clears the form", async () => {
            const user = userEvent.setup();
            render(MemoryManager, { props: { characterId: "char-1" } });
            await screen.findByText("No memories yet.");

            await fillText(user, screen.getByRole("textbox"), "  아침을 싫어함  ");
            await user.click(screen.getByRole("button", { name: "Save" }));

            await screen.findByText("아침을 싫어함");
            expect(screen.getByRole("textbox")).toHaveValue("");
            expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
            const rows = await db.memories.toArray();
            expect(rows).toHaveLength(1);
            expect(rows[0]).toMatchObject({
                characterId: "char-1",
                content: "아침을 싫어함",
                type: "fact",
                importance: 0.5,
            });
        });

        test("stores the importance chosen on the slider and resets it after saving", async () => {
            const user = userEvent.setup();
            render(MemoryManager, { props: { characterId: "char-1" } });

            // user-event cannot drive a range input.
            await fireEvent.input(screen.getByRole("slider"), { target: { value: "0.4" } });
            screen.getByText("0.4", { exact: true });
            await fillText(user, screen.getByRole("textbox"), "조금 중요함");
            await user.click(screen.getByRole("button", { name: "Save" }));

            await screen.findByText("조금 중요함");
            const [row] = await db.memories.toArray();
            expect(row?.importance).toBeCloseTo(0.4, 5);
            screen.getByText("0.5", { exact: true });
        });
    });

    describe("details and deletion", () => {
        test("expands an entry on click and collapses it on a second click", async () => {
            const user = userEvent.setup();
            await seed(
                memory({ id: "m", content: "펼쳐 보세요", importance: 0.9, type: "conversation" })
            );
            render(MemoryManager, { props: { characterId: "char-1" } });
            const header = await screen.findByText("펼쳐 보세요");
            expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();

            await user.click(header);
            screen.getByText("Importance: 0.90", { exact: true });
            screen.getByText("Type: Conversation");
            screen.getByRole("button", { name: "Delete" });

            await user.click(header);
            expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
        });

        test("expands the focused entry with the Enter key", async () => {
            const user = userEvent.setup();
            await seed(memory({ id: "m", content: "키보드 항목" }));
            render(MemoryManager, { props: { characterId: "char-1" } });

            const row = await screen.findByRole("button", { name: /키보드 항목/ });
            expect(row).toHaveAttribute("tabindex", "0");
            row.focus();
            await user.keyboard("{Enter}");

            screen.getByRole("button", { name: "Delete" });
        });

        test("deletes the entry from the list and from storage", async () => {
            const user = userEvent.setup();
            await seed(
                memory({ id: "keep", content: "남길 기억" }),
                memory({ id: "drop", content: "버릴 기억", timestamp: ago(2 * DAY_MS) })
            );
            render(MemoryManager, { props: { characterId: "char-1" } });
            await user.click(await screen.findByText("버릴 기억"));

            await user.click(screen.getByRole("button", { name: "Delete" }));

            await waitFor(() => expect(screen.queryByText("버릴 기억")).not.toBeInTheDocument());
            screen.getByText("남길 기억");
            screen.getByRole("button", { name: "All (1)" });
            expect((await db.memories.toArray()).map((m) => m.id)).toEqual(["keep"]);
        });
    });

    describe("summarize old", () => {
        test("replaces old low-importance conversations with one summary entry", async () => {
            const user = userEvent.setup();
            await seed(
                memory({
                    id: "o1",
                    type: "conversation",
                    importance: 0.1,
                    content: "인사를 나눔",
                    timestamp: ago(10 * DAY_MS),
                }),
                memory({
                    id: "o2",
                    type: "conversation",
                    importance: 0.2,
                    content: "날씨 이야기",
                    timestamp: ago(12 * DAY_MS),
                }),
                memory({
                    id: "fresh",
                    type: "conversation",
                    importance: 0.1,
                    content: "방금 전",
                })
            );
            render(MemoryManager, { props: { characterId: "char-1" } });
            await screen.findByRole("button", { name: "All (3)" });

            await user.click(screen.getByRole("button", { name: "Summarize Old" }));

            await screen.findByRole("button", { name: "All (2)" });
            expect(screen.queryByText("인사를 나눔")).not.toBeInTheDocument();
            await user.click(screen.getByRole("button", { name: "Summaries" }));
            screen.getByText(/Conversation summary \(2 entries\)/);
            const rows = await db.memories.toArray();
            expect(rows.map((m) => m.type).sort()).toEqual(["conversation", "summary"]);
            expect(rows.find((m) => m.type === "conversation")?.id).toBe("fresh");
        });

        test("leaves the list unchanged when nothing is old enough", async () => {
            const user = userEvent.setup();
            await seed(
                memory({ id: "m", type: "conversation", importance: 0.1, content: "최근 기억" })
            );
            render(MemoryManager, { props: { characterId: "char-1" } });
            await screen.findByText("최근 기억");

            await user.click(screen.getByRole("button", { name: "Summarize Old" }));

            screen.getByRole("button", { name: "All (1)" });
            expect(await db.memories.count()).toBe(1);
        });
    });
});
