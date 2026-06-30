import { describe, it, expect, vi, beforeEach } from "vitest";
import { settings } from "@/lib/stores/settings.svelte";
import { StorageResolver } from "@/lib/adapters/storage/storageResolver";
import { SettingsSchema, type Settings } from "@/lib/types/IDataModel";
import type { ISettingsStorageAdapter } from "@/lib/interfaces";

vi.mock("@/lib/adapters/storage/storageResolver");

describe("Settings Store", () => {
    let mockAdapter: ISettingsStorageAdapter;

    beforeEach(() => {
        mockAdapter = {
            init: vi.fn(),
            getSettings: vi.fn().mockResolvedValue({ theme: "dark" } as Settings),
            saveSettings: vi.fn(),
        };

        // Reset the store value (since it's a singleton)
        // We parse a fresh default object to reset
        settings.value = SettingsSchema.parse({});
        settings.isLoaded = false;

        vi.mocked(StorageResolver.getSettingsAdapter).mockResolvedValue(mockAdapter);
    });

    it("initializes with default values", () => {
        expect(settings.value.theme).toBe("system");
        expect(settings.isLoaded).toBe(false);
    });

    it("loads settings from adapter on init", async () => {
        await settings.init();
        expect(mockAdapter.init).toHaveBeenCalled();
        expect(mockAdapter.getSettings).toHaveBeenCalled();
        expect(settings.value.theme).toBe("dark");
        expect(settings.isLoaded).toBe(true);
    });

    it("saves settings to adapter", async () => {
        await settings.init();
        settings.value.theme = "light";
        await settings.save();

        // Check if saveSettings was called.
        // Note: The store might pass a snapshot or proxy.
        // We check if it contains the updated theme.
        expect(mockAdapter.saveSettings).toHaveBeenCalledWith(
            expect.objectContaining({ theme: "light" })
        );
    });

    it("should still mark as loaded even if init fails", async () => {
        vi.mocked(mockAdapter.getSettings).mockRejectedValue(new Error("DB error"));

        await settings.init();
        expect(settings.isLoaded).toBe(true);
        // Should keep default values
        expect(settings.value.theme).toBe("system");
    });

    it("should not throw when save fails", async () => {
        vi.mocked(mockAdapter.saveSettings).mockRejectedValue(new Error("Save failed"));

        await settings.init();
        settings.value.theme = "light";

        // Should not throw
        await expect(settings.save()).resolves.toBeUndefined();
    });
});
