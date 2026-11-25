import { test, expect, describe } from "vitest";
import { contrastRatio } from "@test/utils/color";

describe.concurrent("contrastRatio test helper", () => {
    test("black on white is the maximum ratio of 21", () => {
        expect(contrastRatio("#000", "#fff")).toBeCloseTo(21, 5);
    });

    test("identical colors have a ratio of 1", () => {
        expect(contrastRatio("#336699", "#336699")).toBeCloseTo(1, 5);
    });

    test("does not depend on which color is the foreground", () => {
        expect(contrastRatio("#fff", "#000")).toBeCloseTo(contrastRatio("#000", "#fff"), 5);
    });

    test("understands the modern color spaces getComputedStyle returns", () => {
        expect(contrastRatio("oklch(0% 0 0)", "oklch(100% 0 0)")).toBeCloseTo(21, 1);
    });

    test.each(["not-a-color", "", "#12345", "rgb(red)"])(
        "throws on the unparsable color %j instead of reading a stale fill",
        (bad) => {
            expect(() => contrastRatio(bad, "#fff")).toThrow(/Cannot parse/);
            expect(() => contrastRatio("#000", bad)).toThrow(/Cannot parse/);
        }
    );

    test("accepts a valid color that happens to equal the internal sentinel", () => {
        expect(() => contrastRatio("#010203", "#fff")).not.toThrow();
        expect(() => contrastRatio("#030201", "#fff")).not.toThrow();
    });

    test("a fully transparent foreground blends into the background (ratio 1), not opaque black", () => {
        expect(contrastRatio("rgba(0, 0, 0, 0)", "#fff")).toBeCloseTo(1, 5);
        expect(contrastRatio("transparent", "#000")).toBeCloseTo(1, 5);
    });

    test("a half-transparent foreground is composited over the background", () => {
        // 50% black over white is mid gray (about 3.95:1), nowhere near opaque black's 21:1.
        const ratio = contrastRatio("rgba(0, 0, 0, 0.5)", "#fff");

        expect(ratio).toBeGreaterThan(3.8);
        expect(ratio).toBeLessThan(4.1);
    });

    test("throws on a translucent background, which has nothing to blend with", () => {
        expect(() => contrastRatio("#000", "rgba(255, 255, 255, 0.5)")).toThrow(/translucent/);
        expect(() => contrastRatio("#000", "transparent")).toThrow(/translucent/);
    });
});
