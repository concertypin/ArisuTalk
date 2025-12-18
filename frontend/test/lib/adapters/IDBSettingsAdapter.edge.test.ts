import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { IDBSettingsAdapter } from "@/lib/adapters/storage/settings/IDBSettingsAdapter";
import { getArisuDB } from "@/lib/adapters/storage/IndexedDBHelper";
import { SettingsSchema } from "@/lib/types/IDataModel";

describe("DexieSettingsAdapter (edge)", () => {
    let adapter: IDBSettingsAdapter;
    const db = getArisuDB();

    beforeEach(async () => {
        await db.delete();
        adapter = new IDBSettingsAdapter();
        await adapter.init();
    });

    it("returns defaults when none stored", async () => {
        const got = await adapter.getSettings();
        expect(got.theme).toBe("system");
        expect(got.activePersonaId).toBeNull();
        expect(got.advanced).toEqual({ debug: false, experimental: false });
        expect(got.llmConfigs).toEqual([]);
        expect(got.prompt).toEqual({ generationPrompt: "You are a helpful assistant." });
    });

    it("saves and retrieves settings with unusual values", async () => {
        const setting = SettingsSchema.parse({});
        setting.activePersonaId = "persona-123".repeat(50); // very long string
        setting.theme = "dark";
        await adapter.saveSettings(setting);
        const got = await adapter.getSettings();
        expect(got.theme).toBe("dark");
    });

    it("rejects malformed data at insertion time (data integrity)", async () => {
        // Dexie properly validates data at insertion - malformed data is rejected
        // This is better than silently accepting corrupted data
        // @ts-expect-error allow malformed test data
        await expect(db.settings.put("not-a-record", "singleton")).rejects.toThrow();
    });
});
