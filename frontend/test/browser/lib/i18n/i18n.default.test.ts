import { describe, it, expect, afterEach, vi } from "vitest";
import { localeStore, t, translations } from "@/lib/i18n/index.svelte";
import { Logger } from "@common/logger/Logger";

// The locale is read once, when the store module is created, so the initial state has to be in
// place before the imports above run. test/setup.ts swaps in its own mock unless the fake has a
// clear() method, so the fakes provide one. localStorage and navigator.language are replaced for this
// test file only, so the real origin storage that parallel test files share is never touched.
const fakeStorage = vi.hoisted(() => {
    const data = new Map<string, string>();
    vi.stubGlobal("localStorage", {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => void data.set(key, value),
        removeItem: (key: string) => void data.delete(key),
        clear: () => data.clear(),
    });
    Object.defineProperty(navigator, "language", { value: "en-US", configurable: true });
    return data;
});

// Captured at import time, before any test can change the shared store.
const localeAtImport = localeStore.current;

describe("i18n with no stored preference and an English browser", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        localeStore.current = "en";
        fakeStorage.clear();
    });

    it("starts in English", () => {
        expect(localeAtImport).toBe("en");
    });

    it("stores nothing until the user picks a locale", () => {
        expect(fakeStorage.size).toBe(0);
    });

    it("persists the chosen locale and translates to it", () => {
        vi.spyOn(Logger, "info").mockImplementation(() => {});

        localeStore.set("ko");

        expect(fakeStorage.get("arisutalk:locale")).toBe("ko");
        expect(t("common.close")).toBe(translations.ko["common.close"]);
    });
});
