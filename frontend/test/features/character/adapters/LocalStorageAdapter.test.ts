import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Character, Chat } from "@arisutalk/character-spec/v0/Character";
import { SettingsSchema, type Settings } from "@/lib/types/IDataModel";
import { exampleCharacter, exampleChatData } from "@/const/example_data";
import { LocalStorageAdapter } from "@/features/character/adapters/storage/LocalStorageAdapter";
import { apply } from "@arisutalk/character-spec/utils";

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
        const chat: Chat = structuredClone(exampleChatData);
        await adapter.saveChat(chat);
        const retrieved = await adapter.getChat(chat.id);
        expect(retrieved).toEqual(chat);
    });

    it("should save and retrieve a character", async () => {
        const character: Character = structuredClone(exampleCharacter);
        await adapter.saveCharacter(character);

        const retrieved = await adapter.getCharacter(character.id);
        expect(retrieved).toEqual(character);
    });

    it("should update existing character", async () => {
        const character: Character = structuredClone(exampleCharacter);
        await adapter.saveCharacter(character);

        const updated: Character = { ...character, description: "Maid" };
        await adapter.saveCharacter(updated);

        const retrieved = await adapter.getCharacter(character.id);
        expect(retrieved?.description).toBe(updated.description);
    });

    it("should delete a character", async () => {
        const character: Character = structuredClone(exampleCharacter);
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
});
