import { describe, it, expect, beforeEach } from "vitest";
import { StorageResolver } from "@/lib/adapters/storage/storageResolver";
import { LocalStorageCharacterAdapter } from "@/lib/adapters/storage/character/LocalStorageCharacterAdapter";
import { LocalStorageChatAdapter } from "@/lib/adapters/storage/chat/LocalStorageChatAdapter";
import { LocalStoragePersonaAdapter } from "@/lib/adapters/storage/persona/LocalStoragePersonaAdapter";
import { LocalStorageSettingsAdapter } from "@/lib/adapters/storage/settings/LocalStorageSettingsAdapter";

describe("StorageResolver", () => {
    beforeEach(() => {
        StorageResolver.reset();
    });

    it("returns singleton character adapter", async () => {
        const adapter1 = await StorageResolver.getCharacterAdapter();
        const adapter2 = await StorageResolver.getCharacterAdapter();
        expect(adapter1).toBeInstanceOf(LocalStorageCharacterAdapter);
        expect(adapter1).toBe(adapter2);
    });

    it("returns singleton chat adapter", async () => {
        const adapter1 = await StorageResolver.getChatAdapter();
        const adapter2 = await StorageResolver.getChatAdapter();
        expect(adapter1).toBeInstanceOf(LocalStorageChatAdapter);
        expect(adapter1).toBe(adapter2);
    });

    it("returns singleton persona adapter", async () => {
        const adapter1 = await StorageResolver.getPersonaAdapter();
        const adapter2 = await StorageResolver.getPersonaAdapter();
        expect(adapter1).toBeInstanceOf(LocalStoragePersonaAdapter);
        expect(adapter1).toBe(adapter2);
    });

    it("returns singleton settings adapter", async () => {
        const adapter1 = await StorageResolver.getSettingsAdapter();
        const adapter2 = await StorageResolver.getSettingsAdapter();
        expect(adapter1).toBeInstanceOf(LocalStorageSettingsAdapter);
        expect(adapter1).toBe(adapter2);
    });

    it("reset clears adapters", async () => {
        const adapter1 = await StorageResolver.getCharacterAdapter();
        StorageResolver.reset();
        const adapter2 = await StorageResolver.getCharacterAdapter();
        expect(adapter1).not.toBe(adapter2);
    });
});
