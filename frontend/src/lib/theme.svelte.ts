/**
 * @fileoverview Theme application logic using Svelte 5 runes.
 * Maps the settings theme value to daisyUI theme names on <html>.
 */

import { Logger } from "@common/logger/Logger";

export type ThemeMode = "light" | "dark" | "system";

/** DaisyUI theme names for each mode. */
const THEME_MAP: Record<ThemeMode, string> = {
    light: "winter",
    dark: "night",
    system: "night", // Default fallback, overridden by matchMedia
};

/** Active media query listener for system preference — kept alive for cleanup. */
let systemPreferenceQuery: MediaQueryList | null = null;
let systemPreferenceHandler: ((e: MediaQueryListEvent) => void) | null = null;

/**
 * Resolves the effective theme based on the user's preference and system setting.
 * @param mode - Theme mode from settings.
 * @returns DaisyUI theme name to apply.
 */
function resolveTheme(mode: ThemeMode): string {
    if (mode !== "system") return THEME_MAP[mode];

    if (typeof window !== "undefined" && "matchMedia" in window) {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
        return prefersDark.matches ? "night" : "winter";
    }
    return "night";
}

/**
 * Applies a theme to the document root element.
 * Sets `data-theme` on `<html>` which DaisyUI uses for CSS variable switching.
 *
 * @param mode - The theme mode to apply.
 */
export function applyTheme(mode: ThemeMode): void {
    const theme = resolveTheme(mode);
    document.documentElement.setAttribute("data-theme", theme);

    // Also set color-scheme for browser-native elements (scrollbars, form controls)
    document.documentElement.style.colorScheme = theme === "night" ? "dark" : "light";

    // Clean up previous system preference listener
    if (systemPreferenceHandler && systemPreferenceQuery) {
        systemPreferenceQuery.removeEventListener("change", systemPreferenceHandler);
    }
    systemPreferenceHandler = null;
    systemPreferenceQuery = null;

    // If system mode, watch for changes
    if (mode === "system" && typeof window !== "undefined" && "matchMedia" in window) {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        systemPreferenceQuery = mediaQuery;

        systemPreferenceHandler = (e: MediaQueryListEvent) => {
            const newTheme = e.matches ? "night" : "winter";
            document.documentElement.setAttribute("data-theme", newTheme);
            document.documentElement.style.colorScheme = e.matches ? "dark" : "light";
        };

        mediaQuery.addEventListener("change", systemPreferenceHandler);
    }

    Logger.info("Theme applied", { mode, resolvedTheme: theme });
}
