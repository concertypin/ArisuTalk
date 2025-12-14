import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { DexieSettingsAdapter } from "@/lib/adapters/storage/settings/DexieSettingsAdapter";
import { getArisuDB } from "@/lib/adapters/storage/DexieDB";
import { Settings } from "@/lib/types/IDataModel";

describe("DexieSettingsAdapter", () => {
    let adapter: DexieSettingsAdapter;
    const db = getArisuDB();

    beforeEach(async () => {
        await db.delete();
        adapter = new DexieSettingsAdapter();
        await adapter.init();
    });
    it("initializes adapter without throwing", () => {
        // adapter.init() is completed in beforeEach; ensure adapter instance exists
        expect(adapter).toBeDefined();
    });
    it("should save and retrieve settings", async () => {
        const settings = new Settings();
        settings.theme = "dark";
        settings.userId = "test-uid";
        await adapter.saveSettings(settings);
        const got = await adapter.getSettings();
        expect(got.theme).toBe("dark");
        expect(got.userId).toBe("test-uid");
    });

    it("should return default settings if none", async () => {
        const got = await adapter.getSettings();
        expect(got.theme).toBe("system");
        expect(typeof got.userId).toBe("string");
    });
});
