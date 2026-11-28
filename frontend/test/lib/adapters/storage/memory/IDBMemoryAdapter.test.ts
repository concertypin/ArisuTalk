/**
 * @fileoverview Tests for the IndexedDB memory adapter, running against a real Dexie database
 * backed by fake-indexeddb.
 */
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { IDBMemoryAdapter } from "@/lib/adapters/storage/memory/IDBMemoryAdapter";
import { getArisuDB } from "@/lib/adapters/storage/IndexedDBHelper";
import type { MemoryEntry } from "@/lib/types/memory";

/** Builds a memory with sensible defaults. */
function memory(overrides: Partial<MemoryEntry> & Pick<MemoryEntry, "id">): MemoryEntry {
    return {
        characterId: "char-a",
        content: "default content",
        type: "fact",
        timestamp: "2026-01-01T00:00:00.000Z",
        importance: 0.5,
        lastAccessed: "2026-01-01T00:00:00.000Z",
        ...overrides,
    };
}

describe("IDBMemoryAdapter", () => {
    const db = getArisuDB();
    let adapter: IDBMemoryAdapter;

    beforeEach(async () => {
        adapter = new IDBMemoryAdapter();
        await adapter.init();
        await db.memories.clear();
    });

    describe("saveMemory / getMemory", () => {
        it("stores an entry and reads it back unchanged", async () => {
            const entry = memory({ id: "m1", content: "Likes tea", importance: 0.9 });
            await adapter.saveMemory(entry);
            await expect(adapter.getMemory("m1")).resolves.toEqual(entry);
        });

        it("overwrites an entry that has the same id instead of duplicating it", async () => {
            await adapter.saveMemory(memory({ id: "m1", content: "old" }));
            await adapter.saveMemory(memory({ id: "m1", content: "new", importance: 0.8 }));

            const all = await adapter.getMemories("char-a");
            expect(all).toHaveLength(1);
            expect(all[0]).toMatchObject({ content: "new", importance: 0.8 });
        });

        it("returns undefined for an unknown id", async () => {
            await adapter.saveMemory(memory({ id: "m1" }));
            await expect(adapter.getMemory("missing")).resolves.toBeUndefined();
        });
    });

    describe("getMemories", () => {
        it("returns only the requested character's entries, newest first", async () => {
            await adapter.saveMemory(memory({ id: "old", timestamp: "2026-01-01T00:00:00.000Z" }));
            await adapter.saveMemory(memory({ id: "new", timestamp: "2026-03-01T00:00:00.000Z" }));
            await adapter.saveMemory(memory({ id: "mid", timestamp: "2026-02-01T00:00:00.000Z" }));
            await adapter.saveMemory(
                memory({
                    id: "other",
                    characterId: "char-b",
                    timestamp: "2026-04-01T00:00:00.000Z",
                })
            );

            const result = await adapter.getMemories("char-a");
            expect(result.map((m) => m.id)).toEqual(["new", "mid", "old"]);
        });

        it("returns an empty list for a character without memories", async () => {
            await adapter.saveMemory(memory({ id: "m1" }));
            await expect(adapter.getMemories("nobody")).resolves.toEqual([]);
        });
    });

    describe("deleteMemory", () => {
        it("removes only the given entry", async () => {
            await adapter.saveMemory(memory({ id: "keep" }));
            await adapter.saveMemory(memory({ id: "drop" }));

            await adapter.deleteMemory("drop");

            const remaining = await adapter.getMemories("char-a");
            expect(remaining.map((m) => m.id)).toEqual(["keep"]);
        });

        it("does nothing for an unknown id", async () => {
            await adapter.saveMemory(memory({ id: "keep" }));
            await expect(adapter.deleteMemory("missing")).resolves.toBeUndefined();
            await expect(adapter.getMemory("keep")).resolves.toBeDefined();
        });
    });

    describe("deleteMemoriesForCharacter", () => {
        it("removes every entry of that character and leaves other characters alone", async () => {
            await adapter.saveMemory(memory({ id: "a1" }));
            await adapter.saveMemory(memory({ id: "a2" }));
            await adapter.saveMemory(memory({ id: "b1", characterId: "char-b" }));

            await adapter.deleteMemoriesForCharacter("char-a");

            await expect(adapter.getMemories("char-a")).resolves.toEqual([]);
            const others = await adapter.getMemories("char-b");
            expect(others.map((m) => m.id)).toEqual(["b1"]);
        });
    });

    describe("searchMemories", () => {
        it("matches content case-insensitively and returns newest first", async () => {
            await adapter.saveMemory(
                memory({ id: "old", content: "Loves CATS", timestamp: "2026-01-01T00:00:00.000Z" })
            );
            await adapter.saveMemory(
                memory({
                    id: "new",
                    content: "a cat named Tom",
                    timestamp: "2026-02-01T00:00:00.000Z",
                })
            );
            await adapter.saveMemory(memory({ id: "miss", content: "Prefers dogs" }));

            const result = await adapter.searchMemories("char-a", "cAt");
            expect(result.map((m) => m.id)).toEqual(["new", "old"]);
        });

        it("only searches the given character's memories", async () => {
            await adapter.saveMemory(memory({ id: "mine", content: "secret" }));
            await adapter.saveMemory(
                memory({ id: "theirs", characterId: "char-b", content: "secret" })
            );

            const result = await adapter.searchMemories("char-a", "secret");
            expect(result.map((m) => m.id)).toEqual(["mine"]);
        });

        it("returns nothing when no content matches", async () => {
            await adapter.saveMemory(memory({ id: "m1", content: "hello" }));
            await expect(adapter.searchMemories("char-a", "zzz")).resolves.toEqual([]);
        });

        it("treats regex characters in the query literally", async () => {
            await adapter.saveMemory(memory({ id: "m1", content: "cost is 5.5 (approx)" }));
            await adapter.saveMemory(memory({ id: "m2", content: "cost is 505" }));

            const result = await adapter.searchMemories("char-a", "5.5 (");
            expect(result.map((m) => m.id)).toEqual(["m1"]);
        });
    });
});
