import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { DexieSettingsAdapter } from "@/lib/adapters/storage/settings/IDBSettingsAdapter";
import { getArisuDB } from "@/lib/adapters/storage/IndexedDBHelper";
import { SettingsSchema } from "@/lib/types/IDataModel";

describe("DexieSettingsAdapter (edge)", () => {
    let adapter: DexieSettingsAdapter;
    const db = getArisuDB();

    beforeEach(async () => {
        await db.delete();
        adapter = new DexieSettingsAdapter();
        await adapter.init();
    });

    it("returns defaults when none stored", async () => {
        const got = await adapter.getSettings();
        expect(got.theme).toBe("system");
        expect(typeof got.userId).toBe("string");
    });

    it("saves and retrieves settings with unusual values", async () => {
        const s = SettingsSchema.parse({});
        s.userId = "u-" + "a".repeat(5000);
        s.theme = "dark";
        await adapter.saveSettings(s);
        const got = await adapter.getSettings();
        expect(got.userId.length).toBe(s.userId.length);
        expect(got.theme).toBe("dark");
    });

    it("returns defaults when stored settings are malformed", async () => {
        // write a malformed record directly into the settings table
        // this simulates a corrupted entry that older importers might have produced
        // the adapter should be resilient and return defaults
        // @ts-expect-error allow malformed test data
        await db.settings.put("not-a-record", "singleton");
        const got = await adapter.getSettings();
        expect(got.theme).toBe("system");
        expect(typeof got.userId).toBe("string");
    });
});
