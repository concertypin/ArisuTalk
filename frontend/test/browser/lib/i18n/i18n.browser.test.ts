/**
 * @fileoverview Initial locale and persistence of the i18n store in a browser. The locale is read once,
 * when the store module is created, so every test resets the module registry, installs its own
 * `localStorage` and `navigator.language`, and imports the store afresh. test/setup.ts swaps in its
 * own mock unless the fake has a `clear()` method, so the fake provides one.
 */
import { describe, it, expect, onTestFinished, vi } from "vitest";

/** In-memory `localStorage` visible only to the current test, so the real origin storage is never touched. */
function installBrowser(storedLocale: string | null, language: string): Map<string, string> {
    const data = new Map<string, string>();
    if (storedLocale !== null) data.set("arisutalk:locale", storedLocale);
    vi.stubGlobal("localStorage", {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => void data.set(key, value),
        removeItem: (key: string) => void data.delete(key),
        clear: () => data.clear(),
    });
    Object.defineProperty(navigator, "language", { value: language, configurable: true });
    onTestFinished(() => {
        vi.unstubAllGlobals();
        Reflect.deleteProperty(navigator, "language");
    });
    return data;
}

/** A fresh copy of the i18n module, evaluated against the browser installed by the test. */
async function loadI18n() {
    vi.resetModules();
    return await import("@/lib/i18n/index.svelte");
}

describe("i18n initial locale", () => {
    it.each([
        ["a stored locale beats a non-Korean browser", "ko", "en-US", "ko"],
        ["a stored locale beats a Korean browser", "en", "ko-KR", "en"],
        ["an unsupported stored value falls back to the browser language", "fr", "ko-KR", "ko"],
        ["a Korean browser without a stored locale starts in Korean", null, "ko-KR", "ko"],
        ["a non-Korean browser without a stored locale starts in English", null, "en-US", "en"],
    ] as const)("%s", async (_name, stored, language, expected) => {
        installBrowser(stored, language);

        const { localeStore, t, translations } = await loadI18n();

        expect(localeStore.current).toBe(expected);
        expect(t("settings.tab.general")).toBe(translations[expected]["settings.tab.general"]);
    });
});

describe("i18n locale persistence", () => {
    it("stores nothing until the user picks a locale", async () => {
        const storage = installBrowser(null, "en-US");

        await loadI18n();

        expect(storage.size).toBe(0);
    });

    it("persists the chosen locale and translates to it", async () => {
        const storage = installBrowser(null, "en-US");
        const { localeStore, t, translations } = await loadI18n();

        localeStore.set("ko");

        expect(storage.get("arisutalk:locale")).toBe("ko");
        expect(t("common.close")).toBe(translations.ko["common.close"]);
    });
});
