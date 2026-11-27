import { describe, it, expect, afterEach, vi } from "vitest";
import { localeStore, t, translations } from "@/lib/i18n/index.svelte";
import { Logger } from "@common/logger/Logger";

// The locale is read once, when the store module is created, so the initial state has to be in
// place before the imports above run. test/setup.ts swaps in its own mock unless the fake has a
// clear() method, so the fakes provide one. localStorage is replaced with an in-memory fake (visible only
// to this test file), so the real origin storage that parallel test files share is never touched.
const fakeStorage = vi.hoisted(() => {
    const data = new Map<string, string>([["arisutalk:locale", "ko"]]);
    vi.stubGlobal("localStorage", {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => void data.set(key, value),
        removeItem: (key: string) => void data.delete(key),
        clear: () => data.clear(),
    });
    // Whatever the machine's language is, the stored preference must be what wins.
    Object.defineProperty(navigator, "language", { value: "en-US", configurable: true });
    return data;
});

// Captured at import time, before any test can change the shared store.
const localeAtImport = localeStore.current;

describe("i18n with a stored locale preference", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        localeStore.current = "ko";
        fakeStorage.set("arisutalk:locale", "ko");
    });

    it("starts with the stored locale even though the browser language is not Korean", () => {
        expect(navigator.language.startsWith("ko")).toBe(false);
        expect(localeAtImport).toBe("ko");
    });

    it("translates keys with the stored locale", () => {
        expect(t("settings.title")).toBe(translations.ko["settings.title"]);
        expect(t("settings.title")).not.toBe(translations.en["settings.title"]);
    });

    it("persists a newly chosen locale and switches the translations", () => {
        vi.spyOn(Logger, "info").mockImplementation(() => {});

        localeStore.set("en");

        expect(fakeStorage.get("arisutalk:locale")).toBe("en");
        expect(localeStore.current).toBe("en");
        expect(t("settings.title")).toBe(translations.en["settings.title"]);
    });

    it("logs the locale change", () => {
        const info = vi.spyOn(Logger, "info").mockImplementation(() => {});

        localeStore.set("en");

        expect(info).toHaveBeenCalledWith("Locale changed", { locale: "en" });
    });

    it("returns the key itself when the translation is missing", () => {
        expect(t("does.not.exist")).toBe("does.not.exist");
    });
});
