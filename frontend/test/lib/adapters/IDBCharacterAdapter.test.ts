import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { IDBCharacterAdapter } from "@/lib/adapters/storage/character/IDBCharacterAdapter";
import { getArisuDB } from "@/lib/adapters/storage/IndexedDBHelper";
import { exampleCharacter } from "@/const/example_data";
import { cloneDeep } from "lodash-es";

describe("DexieCharacterAdapter", () => {
    let adapter: IDBCharacterAdapter;
    const db = getArisuDB();

    beforeEach(async () => {
        await db.delete();
        adapter = new IDBCharacterAdapter();
        await adapter.init();
    });

    it("should save and retrieve a character", async () => {
        const char = cloneDeep(exampleCharacter);
        await adapter.saveCharacter(char);
        const got = await adapter.getCharacter(char.id);
        expect(got).toEqual(char);
    });

    it("should return all characters", async () => {
        const char = cloneDeep(exampleCharacter);
        await adapter.saveCharacter(char);
        const list = await adapter.getAllCharacters();
        expect(list.length).toBeGreaterThanOrEqual(1);
    });

    it("should delete a character", async () => {
        const char = cloneDeep(exampleCharacter);
        await adapter.saveCharacter(char);
        await adapter.deleteCharacter(char.id);
        const got = await adapter.getCharacter(char.id);
        expect(got).toBeUndefined();
    });

    it("should return metadata for all characters", async () => {
        const char = cloneDeep(exampleCharacter);
        await adapter.saveCharacter(char);

        const metadata = await adapter.getCharactersMetadata();
        expect(metadata).toHaveLength(1);
        expect(metadata[0].id).toBe(char.id);
        expect(metadata[0].name).toBe(char.name);
        expect(metadata[0].description).toBe(char.description);
        expect(metadata[0].avatarUrl).toBe(char.avatarUrl);
    });
});
