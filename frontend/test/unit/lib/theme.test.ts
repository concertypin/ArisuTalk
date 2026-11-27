// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from "vitest";
import { applyTheme } from "@/lib/theme.svelte";

/** The attribute DaisyUI reads to pick a theme. */
const appliedTheme = () => document.documentElement.getAttribute("data-theme");

/** Handler shape `applyTheme` registers for `(prefers-color-scheme: dark)` changes. */
type ChangeListener = (event: { matches: boolean }) => void;

/** Stubs `window.matchMedia` for one test, with a query that can be flipped like an OS switch. */
function stubMatchMedia(prefersDark: boolean) {
    const listeners = new Set<ChangeListener>();
    const query = {
        matches: prefersDark,
        addEventListener: vi.fn((_type: string, listener: ChangeListener) => {
            listeners.add(listener);
        }),
        removeEventListener: vi.fn((_type: string, listener: ChangeListener) => {
            listeners.delete(listener);
        }),
    };
    const matchMedia = vi.fn(() => query);
    vi.stubGlobal("matchMedia", matchMedia);
    return {
        matchMedia,
        query,
        listeners,
        /** Simulates the OS switching its color scheme. */
        setPrefersDark(matches: boolean) {
            query.matches = matches;
            for (const listener of listeners) listener({ matches });
        },
    };
}

// Each test body is synchronous and sets up its own `matchMedia`, so the tests can run concurrently.
describe.concurrent("applyTheme", () => {
    afterEach(() => {
        // Drops a system-preference listener left by the test and the stubbed `matchMedia`.
        applyTheme("light");
        vi.unstubAllGlobals();
        // jsdom has no `matchMedia`; unstubbing may leave the key behind with an undefined value.
        Reflect.deleteProperty(window, "matchMedia");
        document.documentElement.removeAttribute("data-theme");
        document.documentElement.style.colorScheme = "";
    });

    test("light maps to the winter theme with a light color scheme", () => {
        applyTheme("light");

        expect(appliedTheme()).toBe("winter");
        expect(document.documentElement.style.colorScheme).toBe("light");
    });

    test("dark maps to the night theme with a dark color scheme", () => {
        applyTheme("dark");

        expect(appliedTheme()).toBe("night");
        expect(document.documentElement.style.colorScheme).toBe("dark");
    });

    test("explicit light and dark ignore the system preference", () => {
        const media = stubMatchMedia(true);

        applyTheme("light");
        expect(appliedTheme()).toBe("winter");

        media.setPrefersDark(false);
        applyTheme("dark");
        expect(appliedTheme()).toBe("night");
        expect(media.matchMedia).not.toHaveBeenCalled();
        expect(media.listeners.size).toBe(0);
    });

    describe("system", () => {
        test("follows a dark system preference", () => {
            const media = stubMatchMedia(true);

            applyTheme("system");

            expect(media.matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
            expect(appliedTheme()).toBe("night");
            expect(document.documentElement.style.colorScheme).toBe("dark");
        });

        test("follows a light system preference", () => {
            stubMatchMedia(false);

            applyTheme("system");

            expect(appliedTheme()).toBe("winter");
            expect(document.documentElement.style.colorScheme).toBe("light");
        });

        test("switches live when the system preference changes", () => {
            const media = stubMatchMedia(false);
            applyTheme("system");
            expect(appliedTheme()).toBe("winter");

            media.setPrefersDark(true);
            expect(appliedTheme()).toBe("night");
            expect(document.documentElement.style.colorScheme).toBe("dark");

            media.setPrefersDark(false);
            expect(appliedTheme()).toBe("winter");
            expect(document.documentElement.style.colorScheme).toBe("light");
        });

        test("stops following the system once an explicit theme is chosen", () => {
            const media = stubMatchMedia(false);
            applyTheme("system");
            const listener = media.query.addEventListener.mock.calls[0]?.[1];

            applyTheme("dark");

            expect(media.query.removeEventListener).toHaveBeenCalledWith("change", listener);
            expect(media.listeners.size).toBe(0);
            media.setPrefersDark(false);
            expect(appliedTheme()).toBe("night");
        });

        test("applying system twice keeps a single listener", () => {
            const media = stubMatchMedia(false);

            applyTheme("system");
            applyTheme("system");

            expect(media.listeners.size).toBe(1);
        });

        test("falls back to night when the browser has no matchMedia", () => {
            Reflect.deleteProperty(window, "matchMedia");

            applyTheme("system");

            expect(appliedTheme()).toBe("night");
            expect(document.documentElement.style.colorScheme).toBe("dark");
        });
    });
});
