// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { LocalStorageCharacterAdapter } from "@/lib/adapters/storage/character/LocalStorageCharacterAdapter";
import { LocalStorageAdapter } from "@/features/character/adapters/storage/LocalStorageAdapter";
import { exampleChatData } from "@/const/example_data";
import { createTestCharacter } from "@test/utils/character";
import { cloneDeep } from "lodash-es";

const CHARACTERS_KEY = "arisutalk_characters";
const CHATS_KEY = "arisutalk_chats";

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

describe("features LocalStorageAdapter with damaged storage", () => {
    let adapter: LocalStorageAdapter;

    beforeEach(() => {
        localStorage.clear();
        adapter = new LocalStorageAdapter();
    });

    it("treats unparseable chat JSON as no chats", async () => {
        localStorage.setItem(CHATS_KEY, "[{ broken");

        expect(await adapter.getAllChats()).toEqual([]);
    });

    it("treats a non-array chat payload as no chats", async () => {
        localStorage.setItem(CHATS_KEY, JSON.stringify({ id: "x" }));

        expect(await adapter.getAllChats()).toEqual([]);
    });

    it("drops entries without a string id", async () => {
        const chat = cloneDeep(exampleChatData);
        localStorage.setItem(CHATS_KEY, JSON.stringify([chat, { title: "no id" }, 7, null]));

        expect(await adapter.getAllChats()).toEqual([chat]);
    });

    it("saving a chat with an existing id replaces it instead of duplicating it", async () => {
        const original = cloneDeep(exampleChatData);
        const other = { ...cloneDeep(exampleChatData), id: "other-chat" };
        await adapter.saveChat(original);
        await adapter.saveChat(other);

        await adapter.saveChat({ ...original, title: "Renamed" });

        const all = await adapter.getAllChats();
        expect(all).toHaveLength(2);
        expect(await adapter.getChat(original.id)).toMatchObject({ title: "Renamed" });
        expect(await adapter.getChat("other-chat")).toEqual(other);
    });
});
