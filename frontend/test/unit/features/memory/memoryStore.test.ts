/**
 * @fileoverview Tests for the memory store against the real IndexedDB adapter (fake-indexeddb).
 * The real clock is used: `SvelteDate` extends the `Date` that exists at import time, so faking
 * `Date` would split the store's notion of "now" in two. Ages are therefore built relative to the
 * current time with margins of hours or days.
 */
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryStore } from "@/features/memory/stores/memoryStore.svelte";
import { IDBMemoryAdapter } from "@/lib/adapters/storage/memory/IDBMemoryAdapter";
import { getArisuDB } from "@/lib/adapters/storage/IndexedDBHelper";
import type { MemoryEntry } from "@/lib/types/memory";
import { Logger } from "@common/logger/Logger";

const DAY_MS = 864e5;
const HOUR_MS = 36e5;

/** ISO timestamp `ms` milliseconds before the current time. */
function ago(ms: number): string {
    return new Date(Date.now() - ms).toISOString();
}

/** Asserts that an ISO timestamp lies between two instants, inclusive. */
function expectBetween(iso: string | undefined, from: number, to: number) {
    const time = new Date(iso ?? "").getTime();
    expect(time).toBeGreaterThanOrEqual(from);
    expect(time).toBeLessThanOrEqual(to);
}

/** Builds a memory for `char-1`, created and accessed just now unless overridden. */
function memory(overrides: Partial<MemoryEntry> & Pick<MemoryEntry, "id">): MemoryEntry {
    return {
        characterId: "char-1",
        content: `content of ${overrides.id}`,
        type: "fact",
        timestamp: ago(0),
        importance: 0.5,
        lastAccessed: ago(0),
        ...overrides,
    };
}

describe("MemoryStore", () => {
    const db = getArisuDB();
    let store: MemoryStore;

    /** Writes entries straight into the database, as if saved in an earlier session. */
    async function seed(...entries: MemoryEntry[]) {
        await db.memories.bulkPut(entries);
    }

    /** Reads the persisted ids of a character, newest first. */
    async function storedIds(characterId = "char-1") {
        const rows = await new IDBMemoryAdapter().getMemories(characterId);
        return rows.map((m) => m.id);
    }

    beforeEach(async () => {
        vi.spyOn(Logger, "warn").mockImplementation(() => {});
        store = new MemoryStore();
        await store.initPromise;
        await db.memories.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("loadMemories", () => {
        it("sets the active character and loads its memories newest first", async () => {
            await seed(
                memory({ id: "old", timestamp: ago(3 * DAY_MS) }),
                memory({ id: "new", timestamp: ago(1 * DAY_MS) }),
                memory({ id: "other", characterId: "char-2" })
            );

            await store.loadMemories("char-1");

            expect(store.activeCharacterId).toBe("char-1");
            expect(store.memories.map((m) => m.id)).toEqual(["new", "old"]);
            expect(store.memoryCount).toBe(2);
        });

        it("replaces the previous character's memories when another character is loaded", async () => {
            await seed(memory({ id: "a" }), memory({ id: "b", characterId: "char-2" }));

            await store.loadMemories("char-1");
            await store.loadMemories("char-2");

            expect(store.activeCharacterId).toBe("char-2");
            expect(store.memories.map((m) => m.id)).toEqual(["b"]);
        });

        it("yields an empty list for a character without memories", async () => {
            await seed(memory({ id: "a" }));
            await store.loadMemories("nobody");
            expect(store.memories).toEqual([]);
            expect(store.memoryCount).toBe(0);
        });
    });

    describe("addMemory", () => {
        it("refuses to add without an active character and warns", async () => {
            const result = await store.addMemory("lost", "fact");

            expect(result).toBeNull();
            expect(Logger.warn).toHaveBeenCalled();
            expect(store.memories).toEqual([]);
            await expect(db.memories.count()).resolves.toBe(0);
        });

        it("persists a new entry with timestamps, default importance and the active character", async () => {
            await store.loadMemories("char-1");

            const before = Date.now();
            const entry = await store.addMemory("Likes tea", "fact");
            const after = Date.now();

            expect(entry).toMatchObject({
                characterId: "char-1",
                content: "Likes tea",
                type: "fact",
                importance: 0.5,
            });
            expectBetween(entry?.timestamp, before, after);
            expect(entry?.lastAccessed).toBe(entry?.timestamp);
            expect(entry?.id).toBeTruthy();
            expect(entry && (await db.memories.get(entry.id))).toEqual(entry);
        });

        it("keeps the given type and importance and puts the newest entry first", async () => {
            await store.loadMemories("char-1");

            const first = await store.addMemory("first", "fact", 0.2);
            const second = await store.addMemory("second", "conversation", 0.9);

            expect(second).toMatchObject({ type: "conversation", importance: 0.9 });
            expect(store.memories.map((m) => m.id)).toEqual([second?.id, first?.id]);
            expect(first?.id).not.toBe(second?.id);
        });

        it("keeps the state unchanged when saving fails", async () => {
            await store.loadMemories("char-1");
            vi.spyOn(db.memories, "put").mockRejectedValueOnce(new Error("quota exceeded"));

            await expect(store.addMemory("x", "fact")).rejects.toThrow("quota exceeded");
            expect(store.memories).toEqual([]);
        });
    });

    describe("updateMemory", () => {
        it("merges the changes into the entry in state and storage", async () => {
            await seed(memory({ id: "m1", content: "old", importance: 0.2 }), memory({ id: "m2" }));
            await store.loadMemories("char-1");

            await store.updateMemory("m1", { content: "new", importance: 0.9, type: "summary" });

            const updated = store.memories.find((m) => m.id === "m1");
            expect(updated).toMatchObject({ content: "new", importance: 0.9, type: "summary" });
            await expect(db.memories.get("m1")).resolves.toMatchObject({
                content: "new",
                importance: 0.9,
                type: "summary",
                characterId: "char-1",
            });
            // The other entry is untouched.
            expect(store.memories.find((m) => m.id === "m2")?.content).toBe("content of m2");
        });

        it("ignores an id that is not loaded and writes nothing", async () => {
            await seed(memory({ id: "m1", content: "keep" }));
            await store.loadMemories("char-1");
            const putSpy = vi.spyOn(db.memories, "put");

            await store.updateMemory("ghost", { content: "x" });

            expect(putSpy).not.toHaveBeenCalled();
            expect(store.memories.map((m) => m.content)).toEqual(["keep"]);
        });
    });

    describe("deleteMemory", () => {
        it("removes the entry from state and storage", async () => {
            await seed(memory({ id: "m1" }), memory({ id: "m2" }));
            await store.loadMemories("char-1");

            await store.deleteMemory("m1");

            expect(store.memories.map((m) => m.id)).toEqual(["m2"]);
            await expect(storedIds()).resolves.toEqual(["m2"]);
        });
    });

    describe("recallMemories", () => {
        it("returns nothing without an active character", async () => {
            await seed(memory({ id: "m1" }));
            await expect(store.recallMemories()).resolves.toEqual([]);
        });

        it("ranks by importance when the entries are equally recent", async () => {
            await seed(
                memory({ id: "low", importance: 0.1 }),
                memory({ id: "high", importance: 0.9 }),
                memory({ id: "mid", importance: 0.5 })
            );
            await store.loadMemories("char-1");

            const recalled = await store.recallMemories();

            expect(recalled.map((m) => m.id)).toEqual(["high", "mid", "low"]);
        });

        it("prefers a recent entry over an older one of the same importance", async () => {
            await seed(
                memory({
                    id: "stale",
                    timestamp: ago(100 * HOUR_MS),
                    lastAccessed: ago(300 * HOUR_MS),
                }),
                memory({ id: "fresh", timestamp: ago(1 * HOUR_MS) })
            );
            await store.loadMemories("char-1");

            const recalled = await store.recallMemories();

            expect(recalled.map((m) => m.id)).toEqual(["fresh", "stale"]);
        });

        it("lets a much higher importance outweigh recency", async () => {
            await seed(
                memory({
                    id: "important-but-old",
                    importance: 1,
                    timestamp: ago(100 * HOUR_MS),
                    lastAccessed: ago(300 * HOUR_MS),
                }),
                memory({ id: "new-but-trivial", importance: 0.1 })
            );
            await store.loadMemories("char-1");

            const recalled = await store.recallMemories();

            expect(recalled.map((m) => m.id)).toEqual(["important-but-old", "new-but-trivial"]);
        });

        it("returns at most `limit` entries, keeping the best ones", async () => {
            await seed(
                memory({ id: "a", importance: 0.1 }),
                memory({ id: "b", importance: 0.9 }),
                memory({ id: "c", importance: 0.5 })
            );
            await store.loadMemories("char-1");

            const recalled = await store.recallMemories(undefined, 2);

            expect(recalled.map((m) => m.id)).toEqual(["b", "c"]);
        });

        it("marks recalled entries as accessed now, in the result and in storage", async () => {
            const longAgo = ago(10 * DAY_MS);
            await seed(
                memory({ id: "hit", importance: 0.9, lastAccessed: longAgo }),
                memory({ id: "cut", importance: 0.1, lastAccessed: longAgo })
            );
            await store.loadMemories("char-1");

            const before = Date.now();
            const recalled = await store.recallMemories(undefined, 1);
            const after = Date.now();

            expect(recalled.map((m) => m.id)).toEqual(["hit"]);
            expectBetween(recalled[0]?.lastAccessed, before, after);
            const stored = await db.memories.get("hit");
            expect(stored?.lastAccessed).toBe(recalled[0]?.lastAccessed);
            // Entries that were not recalled keep their old access time.
            await expect(db.memories.get("cut")).resolves.toMatchObject({ lastAccessed: longAgo });
        });

        it("filters by the query text before ranking", async () => {
            await seed(
                memory({ id: "match-low", content: "Loves cats", importance: 0.2 }),
                memory({ id: "match-high", content: "A CAT named Tom", importance: 0.8 }),
                memory({ id: "no-match", content: "Likes dogs", importance: 1 })
            );
            await store.loadMemories("char-1");

            const recalled = await store.recallMemories("cat");

            expect(recalled.map((m) => m.id)).toEqual(["match-high", "match-low"]);
        });

        it("returns an empty list when the query matches nothing", async () => {
            await seed(memory({ id: "m1", content: "hello" }));
            await store.loadMemories("char-1");
            await expect(store.recallMemories("zzz")).resolves.toEqual([]);
        });
    });

    describe("summarizeOldMemories", () => {
        const old = (id: string, overrides: Partial<MemoryEntry> = {}) =>
            memory({
                id,
                type: "conversation",
                importance: 0.1,
                timestamp: ago(10 * DAY_MS),
                ...overrides,
            });

        it("does nothing without an active character", async () => {
            await seed(old("o1"));
            await expect(store.summarizeOldMemories()).resolves.toBeNull();
            await expect(storedIds()).resolves.toEqual(["o1"]);
        });

        it("returns null and keeps everything when no entry qualifies", async () => {
            await seed(
                old("recent", { timestamp: ago(2 * DAY_MS) }),
                old("important", { importance: 0.8 }),
                old("fact", { type: "fact" }),
                old("already-summary", { type: "summary" })
            );
            await store.loadMemories("char-1");

            await expect(store.summarizeOldMemories()).resolves.toBeNull();
            expect(store.memoryCount).toBe(4);
        });

        it("replaces old, low-importance conversation entries with one summary entry", async () => {
            await seed(
                old("o1", { content: "said hi" }),
                old("o2", { content: "talked weather" }),
                old("keep-recent", { timestamp: ago(1 * DAY_MS) }),
                old("keep-important", { importance: 0.9 }),
                old("keep-fact", { type: "fact" })
            );
            await store.loadMemories("char-1");

            const summary = await store.summarizeOldMemories();

            expect(summary).toMatchObject({ type: "summary", importance: 0.4 });
            expect(summary?.content).toContain("Conversation summary (2 entries)");
            expect(summary?.content).toContain("said hi");
            expect(summary?.content).toContain("talked weather");

            const remaining = store.memories.map((m) => m.id);
            expect(remaining).toHaveLength(4);
            expect(remaining).toEqual(
                expect.arrayContaining(["keep-recent", "keep-important", "keep-fact", summary?.id])
            );
            expect(remaining).not.toContain("o1");
            expect(remaining).not.toContain("o2");
            // Storage mirrors the state.
            expect([...(await storedIds())].sort()).toEqual([...remaining].sort());
        });

        it("does not summarize an entry whose importance equals the threshold", async () => {
            await seed(old("edge", { importance: 0.3 }));
            await store.loadMemories("char-1");
            await expect(store.summarizeOldMemories()).resolves.toBeNull();
        });

        it("honors a custom age and importance threshold", async () => {
            await seed(
                old("two-days", { timestamp: ago(2 * DAY_MS), importance: 0.5 }),
                old("fresh", { timestamp: ago(0.5 * DAY_MS), importance: 0.5 })
            );
            await store.loadMemories("char-1");

            const summary = await store.summarizeOldMemories(1, 0.6);

            expect(summary?.content).toContain("(1 entries)");
            expect(store.memories.map((m) => m.id)).not.toContain("two-days");
            expect(store.memories.map((m) => m.id)).toContain("fresh");
        });
    });
});
