// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { LocalStorageCharacterAdapter } from "@/lib/adapters/storage/character/LocalStorageCharacterAdapter";
import { createTestCharacter } from "@test/utils/character";

const CHARACTERS_KEY = "arisutalk_characters";

describe("LocalStorageCharacterAdapter with damaged storage", () => {
    let adapter: LocalStorageCharacterAdapter;

    beforeEach(() => {
        localStorage.clear();
        adapter = new LocalStorageCharacterAdapter();
    });

    it("treats unparseable JSON as no characters and recovers on the next save", async () => {
        localStorage.setItem(CHARACTERS_KEY, "{ definitely not json");

        expect(await adapter.getAllCharacters()).toEqual([]);

        const saved = createTestCharacter({ id: "c1", name: "Recovered" });
        await adapter.saveCharacter(saved);
        expect(await adapter.getAllCharacters()).toEqual([saved]);
    });

    it("treats a non-array payload as no characters", async () => {
        localStorage.setItem(CHARACTERS_KEY, JSON.stringify({ id: "c1", name: "Not a list" }));

        expect(await adapter.getAllCharacters()).toEqual([]);
        expect(await adapter.getCharactersMetadata()).toEqual([]);
    });

    it("skips entries without a string id or name and keeps the valid ones", async () => {
        const valid = createTestCharacter({ id: "ok", name: "Valid" });
        localStorage.setItem(
            CHARACTERS_KEY,
            JSON.stringify([null, "text", { id: "no-name" }, { name: "no-id" }, valid])
        );

        expect(await adapter.getAllCharacters()).toEqual([valid]);
        expect(await adapter.getCharacter("no-name")).toBeUndefined();
    });

    it("returns metadata containing only the public summary fields", async () => {
        const character = createTestCharacter({
            id: "c1",
            name: "Summary",
            description: "Summary description",
        });
        await adapter.saveCharacter(character);

        expect(await adapter.getCharactersMetadata()).toEqual([
            {
                id: "c1",
                name: "Summary",
                description: "Summary description",
                avatarUrl: character.avatarUrl,
            },
        ]);
    });
});
