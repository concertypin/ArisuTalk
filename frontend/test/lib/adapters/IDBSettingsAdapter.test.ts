import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { IDBSettingsAdapter } from "@/lib/adapters/storage/settings/IDBSettingsAdapter";
import { getArisuDB } from "@/lib/adapters/storage/IndexedDBHelper";
import { SettingsSchema } from "@/lib/types/IDataModel";

describe("DexieSettingsAdapter", () => {
    let adapter: IDBSettingsAdapter;
    const db = getArisuDB();

    beforeEach(async () => {
        await db.delete();
        adapter = new IDBSettingsAdapter();
        await adapter.init();
    });
    it("initializes adapter without throwing", () => {
        // adapter.init() is completed in beforeEach; ensure adapter instance exists
        expect(adapter).toBeDefined();
    });
    it("should save and retrieve settings", async () => {
        const settings = SettingsSchema.parse({});
        settings.theme = "dark";
        settings.activePersonaId = "test-persona-id";
        settings.advanced = { debug: false, experimental: false };
        settings.llmConfigs = [];
        settings.prompt = { generationPrompt: "You are a helpful assistant." };
        await adapter.saveSettings(settings);
        const got = await adapter.getSettings();
        expect(got.theme).toBe("dark");
        expect(got.activePersonaId).toBe("test-persona-id");
        expect(got.advanced).toEqual({ debug: false, experimental: false });
        expect(got.llmConfigs).toEqual([]);
        expect(got.prompt).toEqual({ generationPrompt: "You are a helpful assistant." });
    });

    it("should return default settings if none", async () => {
        const got = await adapter.getSettings();
        expect(got.theme).toBe("system");
        expect(got.activePersonaId).toBeNull();
        expect(got.advanced).toEqual({ debug: false, experimental: false });
        expect(got.llmConfigs).toEqual([]);
        expect(got.prompt).toEqual({ generationPrompt: "You are a helpful assistant." });
    });
});
