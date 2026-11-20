/**
 * @fileoverview Color helpers for browser tests that check text stays readable on its background.
 */

type Rgba = { r: number; g: number; b: number; alpha: number };

/**
 * Converts any CSS color the browser understands (including `oklch()`/`oklab()`, which is what
 * `getComputedStyle` returns for DaisyUI theme colors) to sRGB channels plus opacity.
 * Must run in a browser, because it relies on a canvas for parsing.
 * @param cssColor - A CSS color string.
 * @returns Red, green and blue channels in 0-255, and the opacity in 0-1.
 * @throws If the browser cannot parse `cssColor`.
 */
function parseColor(cssColor: string): Rgba {
    const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("2D canvas is unavailable");

    // An unparsable value leaves fillStyle on whatever it held before. Parse against two different
    // starting values: a valid color lands on the same result, an invalid one echoes each start.
    // (A single sentinel would wrongly reject a color that equals the sentinel.)
    const parseFrom = (start: string) => {
        ctx.fillStyle = start;
        ctx.fillStyle = cssColor;
        return ctx.fillStyle;
    };
    if (parseFrom("#010203") !== parseFrom("#030201")) {
        throw new Error(`Cannot parse CSS color: ${cssColor}`);
    }

    ctx.fillStyle = cssColor;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return { r, g, b, alpha: a / 255 };
}

/**
 * Resolves a color to opaque sRGB channels. A translucent foreground is composited over the
 * background it will be painted on.
 */
function toOpaqueRgb(
    cssColor: string,
    backdrop: [number, number, number] | null
): [number, number, number] {
    const { r, g, b, alpha } = parseColor(cssColor);
    if (alpha === 1) return [r, g, b];
    if (!backdrop) {
        throw new Error(
            `Color is translucent (alpha ${alpha}) and has nothing to blend with: ${cssColor}`
        );
    }
    return [
        r * alpha + backdrop[0] * (1 - alpha),
        g * alpha + backdrop[1] * (1 - alpha),
        b * alpha + backdrop[2] * (1 - alpha),
    ];
}

function luminance([red, green, blue]: [number, number, number]): number {
    const [r, g, b] = [red, green, blue].map((channel) => {
        const c = channel / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG contrast ratio between two CSS colors.
 * A translucent `foreground` is composited over `background` first, the way it is painted.
 * @param foreground - Text color.
 * @param background - Background color. Must be opaque, since nothing lies behind it to blend with.
 * @returns A ratio from 1 (identical) to 21 (black on white).
 * @throws If either color cannot be parsed, or `background` is translucent.
 */
export function contrastRatio(foreground: string, background: string): number {
    const backgroundRgb = toOpaqueRgb(background, null);
    const foregroundRgb = toOpaqueRgb(foreground, backgroundRgb);
    const [light, dark] = [luminance(foregroundRgb), luminance(backgroundRgb)].sort(
        (a, b) => b - a
    );
    return (light + 0.05) / (dark + 0.05);
}
