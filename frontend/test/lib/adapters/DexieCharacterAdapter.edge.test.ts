import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { DexieCharacterAdapter } from "@/lib/adapters/storage/character/DexieCharacterAdapter";
import { DexieStorageAdapter } from "@/features/character/adapters/storage/DexieStorageAdapter";
import { getArisuDB } from "@/lib/adapters/storage/DexieDB";
import { exampleCharacter } from "@/const/example_data";

describe("DexieCharacterAdapter (edge)", () => {
    let adapter: DexieCharacterAdapter;
    const db = getArisuDB();

    beforeEach(async () => {
        await db.delete();
        adapter = new DexieCharacterAdapter();
        await adapter.init();
    });

    it("saves and retrieves a character with very large prompt.description", async () => {
        const big = "x".repeat(100_000);
        const c = structuredClone(exampleCharacter);
        c.prompt = { ...(c.prompt || {}), description: big };
        await adapter.saveCharacter(c);
        const got = await adapter.getCharacter(c.id);
        expect(got).toBeDefined();
        expect(got?.id).toBe(c.id);
        expect(got?.prompt?.description?.length).toBe(big.length);
    });

    it("handles concurrent saveCharacter calls", async () => {
        const tasks: Promise<void>[] = [];
        for (let i = 0; i < 10; i++) {
            const nc = structuredClone(exampleCharacter);
            nc.id = `concurrent-${i}-${Date.now()}-${Math.random()}`;
            nc.name = `C-${i}`;
            tasks.push(adapter.saveCharacter(nc));
        }
        await Promise.all(tasks);
        const all = await adapter.getAllCharacters();
        // Should contain the 10 we just added
        expect(all.length).toBe(10);
    });

    it("importData with corrupted stream throws (legacy combined import)", async () => {
        // Use legacy combined adapter that supports importData for characters/settings
        const legacy = new DexieStorageAdapter();
        await legacy.init();
        // Create a stream of invalid JSON
        const enc = new TextEncoder().encode("{ invalid json\n");
        const stream = new ReadableStream<Uint8Array>({
            start(ctrl) {
                ctrl.enqueue(enc);
                ctrl.close();
            },
        });

        await expect(legacy.importData(stream)).rejects.toBeInstanceOf(Error);
    });
});
