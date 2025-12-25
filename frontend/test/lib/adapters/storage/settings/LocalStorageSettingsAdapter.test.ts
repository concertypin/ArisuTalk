import { describe, it, expect, beforeEach, vi } from "vitest";
import { LocalStorageSettingsAdapter } from "@/lib/adapters/storage/settings/LocalStorageSettingsAdapter";
import { SettingsSchema } from "@/lib/types/IDataModel";

describe("LocalStorageSettingsAdapter", () => {
    let adapter: LocalStorageSettingsAdapter;

    beforeEach(() => {
        localStorage.clear();
        adapter = new LocalStorageSettingsAdapter();
        vi.clearAllMocks();
    });

    it("should initialize without error", async () => {
        await expect(adapter.init()).resolves.toBeUndefined();
    });

    it("should save and retrieve settings", async () => {
        const settings = SettingsSchema.parse({
            theme: "dark",
            user_name: "Test User",
        });

        await adapter.saveSettings(settings);

        const retrieved = await adapter.getSettings();
        expect(retrieved).toEqual(settings);
    });

    it("should return default settings if storage is empty", async () => {
        const settings = await adapter.getSettings();
        const defaults = SettingsSchema.parse({});
        expect(settings).toEqual(defaults);
    });

    it("should handle corrupted data gracefully (throw or reset)", async () => {
        localStorage.setItem("arisutalk_settings", "{ invalid json");
        // Zod might throw if parsing fails, or adapter might crash.
        // The implementation does JSON.parse(item) which will throw SyntaxError.
        // It's good to know behavior.
        await expect(adapter.getSettings()).rejects.toThrow();
    });
});
