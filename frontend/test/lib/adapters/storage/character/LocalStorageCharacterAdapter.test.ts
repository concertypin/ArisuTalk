import { describe, it, expect, beforeEach } from "vitest";
import { LocalStorageCharacterAdapter } from "@/lib/adapters/storage/character/LocalStorageCharacterAdapter";
import { CharacterSchema, type Character } from "@arisutalk/character-spec/v0/Character";
import { apply } from "@arisutalk/character-spec/utils";

describe("LocalStorageCharacterAdapter", () => {
    let adapter: LocalStorageCharacterAdapter;
    const testChar: Character = apply(CharacterSchema, {
        id: "char-1",
        name: "Test Character",
        metadata: {
            version: "0.0.1",
            license: "UNLICENSED",
        },
        prompt: {
            description: "Be helpful",
        },
        specVersion: 0,
        description: "A test character",
        assets: {
            assets: [],
        },
    });

    beforeEach(() => {
        localStorage.clear();
        adapter = new LocalStorageCharacterAdapter();
    });

    it("should save and retrieve a character", async () => {
        await adapter.saveCharacter(testChar);
        const retrieved = await adapter.getCharacter(testChar.id);
        expect(retrieved).toEqual(testChar);
    });

    it("should return undefined for non-existent character", async () => {
        const retrieved = await adapter.getCharacter("non-existent");
        expect(retrieved).toBeUndefined();
    });

    it("should list all characters", async () => {
        const char2 = { ...testChar, id: "char-2", name: "Second" };
        await adapter.saveCharacter(testChar);
        await adapter.saveCharacter(char2);

        const all = await adapter.getAllCharacters();
        expect(all).toHaveLength(2);
        expect(all).toContainEqual(testChar);
        expect(all).toContainEqual(char2);
    });

    it("should update existing character", async () => {
        await adapter.saveCharacter(testChar);
        const updated = { ...testChar, name: "Updated Name" };
        await adapter.saveCharacter(updated);

        const retrieved = await adapter.getCharacter(testChar.id);
        expect(retrieved?.name).toBe("Updated Name");
    });

    it("should delete character", async () => {
        await adapter.saveCharacter(testChar);
        await adapter.deleteCharacter(testChar.id);
        const retrieved = await adapter.getCharacter(testChar.id);
        expect(retrieved).toBeUndefined();
    });

    it("should return metadata", async () => {
        await adapter.saveCharacter(testChar);
        const meta = await adapter.getCharactersMetadata();
        expect(meta).toHaveLength(1);
        expect(meta[0].id).toBe(testChar.id);
        expect(meta[0].name).toBe(testChar.name);
    });
});
