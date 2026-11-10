/**
 * @fileoverview Color helpers for browser tests that check text stays readable on its background.
 */

/**
 * Converts any CSS color the browser understands (including `oklch()`/`oklab()`, which is what
 * `getComputedStyle` returns for DaisyUI theme colors) to sRGB channels.
 * Must run in a browser, because it relies on a canvas for parsing.
 * @param cssColor - A CSS color string.
 * @returns Red, green and blue channels in 0-255.
 */
function toRgb(cssColor: string): [number, number, number] {
    const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("2D canvas is unavailable");
    // An unparsable value leaves fillStyle unchanged, so start from a sentinel to detect that.
    ctx.fillStyle = "#010203";
    ctx.fillStyle = cssColor;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b];
}

function luminance(cssColor: string): number {
    const [r, g, b] = toRgb(cssColor).map((channel) => {
        const c = channel / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG contrast ratio between two CSS colors.
 * @param foreground - Text color.
 * @param background - Background color.
 * @returns A ratio from 1 (identical) to 21 (black on white).
 */
export function contrastRatio(foreground: string, background: string): number {
    const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    return (light + 0.05) / (dark + 0.05);
}
