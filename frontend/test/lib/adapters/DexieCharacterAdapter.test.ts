import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { DexieCharacterAdapter } from "@/lib/adapters/storage/character/DexieCharacterAdapter";
import { getArisuDB } from "@/lib/adapters/storage/DexieDB";
import { exampleCharacter } from "@/const/example_data";

describe("DexieCharacterAdapter", () => {
    let adapter: DexieCharacterAdapter;
    const db = getArisuDB();

    beforeEach(async () => {
        await db.delete();
        adapter = new DexieCharacterAdapter();
        await adapter.init();
    });

    it("should save and retrieve a character", async () => {
        const char = structuredClone(exampleCharacter);
        await adapter.saveCharacter(char);
        const got = await adapter.getCharacter(char.id);
        expect(got).toEqual(char);
    });

    it("should return all characters", async () => {
        const char = structuredClone(exampleCharacter);
        await adapter.saveCharacter(char);
        const list = await adapter.getAllCharacters();
        expect(list.length).toBeGreaterThanOrEqual(1);
    });

    it("should delete a character", async () => {
        const char = structuredClone(exampleCharacter);
        await adapter.saveCharacter(char);
        await adapter.deleteCharacter(char.id);
        const got = await adapter.getCharacter(char.id);
        expect(got).toBeUndefined();
    });
});
