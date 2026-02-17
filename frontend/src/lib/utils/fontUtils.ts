/**
 * Font Utilities
 * Handles supported fonts and dynamic loading of Google Fonts.
 */

export interface FontDefinition {
    name: string;
    value: string;
    type: "system" | "google";
}

export const SUPPORTED_FONTS: FontDefinition[] = [
    // System Fonts
    { name: "System Default", value: "system-ui", type: "system" },
    { name: "Monospace", value: "monospace", type: "system" },
    { name: "Serif", value: "serif", type: "system" },
    { name: "Sans-serif", value: "sans-serif", type: "system" },

    // Google Fonts
    { name: "Noto Sans KR", value: "Noto Sans KR", type: "google" },
    { name: "Roboto", value: "Roboto", type: "google" },
    { name: "Open Sans", value: "Open Sans", type: "google" },
    { name: "Lato", value: "Lato", type: "google" },
    { name: "Montserrat", value: "Montserrat", type: "google" },
    { name: "Poppins", value: "Poppins", type: "google" },
];

/**
 * Loads a Google Font dynamically by injecting a <link> tag.
 * Does nothing if the font is a system font or already loaded.
 * @param fontFamily The name of the font family to load.
 */
export function loadFont(fontFamily: string) {
    const font = SUPPORTED_FONTS.find((f) => f.value === fontFamily);

    if (!font || font.type !== "google") {
        return;
    }

    const fontId = `font-${fontFamily.replace(/\s+/g, "-").toLowerCase()}`;
    if (document.getElementById(fontId)) {
        return; // Already loaded
    }

    const link = document.createElement("link");
    link.id = fontId;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, "+")}:wght@300;400;500;700&display=swap`;

    document.head.appendChild(link);
}
