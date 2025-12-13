import { describe, it, expect, beforeEach, vi } from "vitest";
import { LocalStorageAdapter } from "@/features/character/adapters/LocalStorageAdapter";
import type { Character, Chat } from "@arisutalk/character-spec/v0/Character";
import type { Settings } from "@/lib/types/IDataModel";

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
        const chat: Chat = { id: "chat1", messages: [] };
        await adapter.saveChat(chat);
        const retrieved = await adapter.getChat("chat1");
        expect(retrieved).toEqual(chat);
    });

    it("should save and retrieve a character", async () => {
        const character: Character = { name: "Arisu", description: "Hero" };
        await adapter.saveCharacter(character);

        const retrieved = await adapter.getCharacter("Arisu");
        expect(retrieved).toEqual(character);
    });

    it("should update existing character", async () => {
        const character: Character = { name: "Arisu", description: "Hero" };
        await adapter.saveCharacter(character);

        const updated: Character = { name: "Arisu", description: "Maid" };
        await adapter.saveCharacter(updated);

        const retrieved = await adapter.getCharacter("Arisu");
        expect(retrieved?.description).toBe("Maid");
    });

    it("should delete a character", async () => {
        const character: Character = { name: "Arisu" };
        await adapter.saveCharacter(character);
        await adapter.deleteCharacter("Arisu");

        const retrieved = await adapter.getCharacter("Arisu");
        expect(retrieved).toBeUndefined();
    });

    it("should save and get settings", async () => {
        const settings: Settings = { theme: "dark" };
        await adapter.saveSettings(settings);
        const retrieved = await adapter.getSettings();
        expect(retrieved).toEqual(settings);
    });

    it("should return default settings if none stored", async () => {
        const settings = await adapter.getSettings();
        expect(settings.theme).toBe("system");
    });
});
