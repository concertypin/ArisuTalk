import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { DexieSettingsAdapter } from "@/lib/adapters/storage/settings/DexieSettingsAdapter";
import { DexieStorageAdapter } from "@/features/character/adapters/storage/DexieStorageAdapter";
import { getArisuDB } from "@/lib/adapters/storage/DexieDB";
import { Settings } from "@/lib/types/IDataModel";

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
        const s = new Settings();
        s.userId = "u-" + "a".repeat(5000);
        s.theme = "dark";
        await adapter.saveSettings(s);
        const got = await adapter.getSettings();
        expect(got.userId.length).toBe(s.userId.length);
        expect(got.theme).toBe("dark");
    });

    it("corrupted import stream throws (legacy combined import)", async () => {
        const legacy = new DexieStorageAdapter();
        await legacy.init();
        const enc = new TextEncoder().encode("not-json");
        const stream = new ReadableStream<Uint8Array>({
            start(ctrl) {
                ctrl.enqueue(enc);
                ctrl.close();
            },
        });

        await expect(legacy.importData(stream as any)).rejects.toBeInstanceOf(Error);
    });
});
