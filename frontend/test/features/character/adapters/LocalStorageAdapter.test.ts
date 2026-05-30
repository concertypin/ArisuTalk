// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Character, Chat } from "@arisutalk/character-spec/v0/Character";
import { SettingsSchema, type Settings } from "@/lib/types/IDataModel";
import { exampleCharacter, exampleChatData } from "@/const/example_data";
import { LocalStorageAdapter } from "@/features/character/adapters/storage/LocalStorageAdapter";
import { apply } from "@arisutalk/character-spec/utils";
import { cloneDeep } from "lodash-es";

describe("LocalStorageAdapter", () => {
    let adapter: LocalStorageAdapter;

    beforeEach(() => {
        adapter = new LocalStorageAdapter();
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it("should initialize correctly", async () => {
        await expect(adapter.init()).resolves.toBeUndefined();
    });

    it("should save and retrieve a chat", async () => {
        const chat: Chat = cloneDeep(exampleChatData);
        await adapter.saveChat(chat);
        const retrieved = await adapter.getChat(chat.id);
        expect(retrieved).toEqual(chat);
    });

    it("should save and retrieve a character", async () => {
        const character: Character = cloneDeep(exampleCharacter);
        await adapter.saveCharacter(character);

        const retrieved = await adapter.getCharacter(character.id);
        expect(retrieved).toEqual(character);
    });

    it("should update existing character", async () => {
        const character: Character = cloneDeep(exampleCharacter);
        await adapter.saveCharacter(character);

        const updated: Character = { ...character, description: "Maid" };
        await adapter.saveCharacter(updated);

        const retrieved = await adapter.getCharacter(character.id);
        expect(retrieved?.description).toBe(updated.description);
    });

    it("should delete a character", async () => {
        const character: Character = cloneDeep(exampleCharacter);
        await adapter.saveCharacter(character);
        await adapter.deleteCharacter(character.id);

        const retrieved = await adapter.getCharacter(character.id);
        expect(retrieved).toBeUndefined();
    });

    it("should save and get settings", async () => {
        const settings: Settings = apply(SettingsSchema, {
            theme: "dark",
            advanced: { debug: false, experimental: false },
            llmConfigs: [],
            prompt: { generationPrompt: "You are a helpful assistant." },
            activePersonaId: null,
        });
        await adapter.saveSettings(settings);
        const retrieved = await adapter.getSettings();
        // Settings schema has defaults, so we check that our values were saved correctly
        expect(retrieved).toEqual(
            expect.objectContaining({
                theme: "dark",
                advanced: { debug: false, experimental: false },
                llmConfigs: [],
                prompt: { generationPrompt: "You are a helpful assistant." },
                activePersonaId: null,
            })
        );
    });

    it("should return default settings if none stored", async () => {
        const settings = await adapter.getSettings();
        expect(settings.theme).toBe("system");
    });

    it("should get all characters", async () => {
        const char1: Character = cloneDeep(exampleCharacter);
        const char2: Character = cloneDeep(exampleCharacter);
        char2.id = "char-2";
        char2.name = "Second Character";
        await adapter.saveCharacter(char1);
        await adapter.saveCharacter(char2);

        const all = await adapter.getAllCharacters();
        expect(all).toHaveLength(2);
        expect(all.map((c) => c.id)).toContain(char1.id);
        expect(all.map((c) => c.id)).toContain("char-2");
    });

    it("should get all chats", async () => {
        const chat1: Chat = cloneDeep(exampleChatData);
        const chat2: Chat = cloneDeep(exampleChatData);
        chat2.id = "chat-2";
        chat2.name = "Second Chat";
        await adapter.saveChat(chat1);
        await adapter.saveChat(chat2);

        const all = await adapter.getAllChats();
        expect(all).toHaveLength(2);
    });

    it("should delete a chat", async () => {
        const chat: Chat = cloneDeep(exampleChatData);
        await adapter.saveChat(chat);
        await adapter.deleteChat(chat.id);

        const retrieved = await adapter.getChat(chat.id);
        expect(retrieved).toBeUndefined();
    });

    it("should export data as ReadableStream", async () => {
        const character: Character = cloneDeep(exampleCharacter);
        await adapter.saveCharacter(character);

        const stream = await adapter.exportData();
        expect(stream).toBeInstanceOf(ReadableStream);

        const reader = stream.getReader();
        const chunks: Uint8Array[] = [];
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }
        const json = new TextDecoder().decode(
            chunks.reduce((acc, c) => {
                const tmp = new Uint8Array(acc.length + c.length);
                tmp.set(acc, 0);
                tmp.set(c, acc.length);
                return tmp;
            }, new Uint8Array())
        );
        const parsed = JSON.parse(json);
        expect(parsed.characters).toBeInstanceOf(Array);
        expect(parsed.characters.length).toBeGreaterThan(0);
    });

    it("should import valid data", async () => {
        // First export to get valid data format
        const char: Character = cloneDeep(exampleCharacter);
        await adapter.saveCharacter(char);
        const stream = await adapter.exportData();

        // Clear and verify empty
        localStorage.clear();
        const empty = await adapter.getAllCharacters();
        expect(empty).toHaveLength(0);

        // Import
        await adapter.importData(stream);
        const chars = await adapter.getAllCharacters();
        expect(chars.length).toBeGreaterThan(0);
    });

    it("should handle import of invalid data", async () => {
        const encoder = new TextEncoder();
        const invalidJson = encoder.encode("{ not valid json }");
        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(invalidJson);
                controller.close();
            },
        });

        await expect(adapter.importData(stream)).rejects.toThrow("Invalid data format");
    });

    it("should handle import of non-object data", async () => {
        const encoder = new TextEncoder();
        const jsonString = encoder.encode("42");
        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(jsonString);
                controller.close();
            },
        });

        await expect(adapter.importData(stream)).rejects.toThrow("Invalid data format");
    });
});
