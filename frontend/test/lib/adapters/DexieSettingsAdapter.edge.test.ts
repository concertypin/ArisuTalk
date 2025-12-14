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

    it("rejects malformed data at insertion time (data integrity)", async () => {
        // Dexie properly validates data at insertion - malformed data is rejected
        // This is better than silently accepting corrupted data
        // @ts-expect-error allow malformed test data
        await expect(db.settings.put("not-a-record", "singleton")).rejects.toThrow();
    });
});
