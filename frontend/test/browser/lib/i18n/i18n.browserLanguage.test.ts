import { describe, it, expect, vi } from "vitest";
import { localeStore, t, translations } from "@/lib/i18n/index.svelte";

// The locale is read once, when the store module is created, so the initial state has to be in
// place before the imports above run. test/setup.ts swaps in its own mock unless the fake has a
// clear() method, so the fakes provide one. localStorage and navigator.language are replaced for this
// test file only, so the real origin storage that parallel test files share is never touched.
vi.hoisted(() => {
    vi.stubGlobal("localStorage", {
        // An unsupported value must be ignored in favour of the browser language.
        getItem: (key: string) => (key === "arisutalk:locale" ? "fr" : null),
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
    });
    Object.defineProperty(navigator, "language", { value: "ko-KR", configurable: true });
});

describe("i18n without a valid stored locale", () => {
    it("falls back to the browser language when the stored value is not a supported locale", () => {
        expect(localeStore.current).toBe("ko");
        expect(t("settings.tab.general")).toBe(translations.ko["settings.tab.general"]);
    });
});
