import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { localeStore, t, translations } from "@/lib/i18n/index.svelte";
import { Logger } from "@common/logger/Logger";

// Captured at import time, before any test or hook can change the shared store.
const localeAtImport = localeStore.current;

// This project runs this file in Node, where `window` does not exist (like during server-side
// rendering). The locale store has to work without touching browser-only globals.
describe("i18n without a browser environment", () => {
    beforeEach(() => {
        vi.spyOn(Logger, "info").mockImplementation(() => {});
        localeStore.current = "en";
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localeStore.current = "en";
    });

    it("defaults to English when there is no window to read a preference from", () => {
        expect(typeof window).toBe("undefined");
        expect(localeAtImport).toBe("en");
    });

    it("switches the locale in memory and skips persisting it when there is no window", () => {
        localeStore.set("ko");

        expect(localeStore.current).toBe("ko");
        expect(t("settings.title")).toBe(translations.ko["settings.title"]);
        expect(localStorage.getItem("arisutalk:locale")).toBeNull();
    });

    it("logs the locale change", () => {
        localeStore.set("ko");

        expect(Logger.info).toHaveBeenCalledWith("Locale changed", { locale: "ko" });
    });

    it("falls back to the key itself for an unknown translation key", () => {
        expect(t("no.such.key")).toBe("no.such.key");
    });

    it("has the same translation keys in every locale", () => {
        expect(Object.keys(translations.ko).sort()).toEqual(Object.keys(translations.en).sort());
    });
});
