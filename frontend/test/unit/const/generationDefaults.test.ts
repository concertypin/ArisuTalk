import { describe, it, expect, expectTypeOf } from "vitest";
import { GENERATION_DEFAULTS } from "@/const/generationDefaults";

describe.concurrent("GENERATION_DEFAULTS", () => {
    it("is a readonly constant (as const)", () => {
        // as const makes properties readonly at the type level,
        // but does not freeze the object at runtime
        expect(GENERATION_DEFAULTS).toBeDefined();
        expect(typeof GENERATION_DEFAULTS).toBe("object");
    });

    it("has all expected properties", () => {
        expect(GENERATION_DEFAULTS).toHaveProperty("temperature");
        expect(GENERATION_DEFAULTS).toHaveProperty("maxInputTokens");
        expect(GENERATION_DEFAULTS).toHaveProperty("maxOutputTokens");
        expect(GENERATION_DEFAULTS).toHaveProperty("topP");
        expect(GENERATION_DEFAULTS).toHaveProperty("topK");
        expect(GENERATION_DEFAULTS).toHaveProperty("frequencyPenalty");
        expect(GENERATION_DEFAULTS).toHaveProperty("presencePenalty");
    });

    it("has correct default values", () => {
        expect(GENERATION_DEFAULTS.temperature).toBe(1);
        expect(GENERATION_DEFAULTS.maxInputTokens).toBe(1024);
        expect(GENERATION_DEFAULTS.maxOutputTokens).toBe(1024);
        expect(GENERATION_DEFAULTS.topP).toBe(0.95);
        expect(GENERATION_DEFAULTS.topK).toBe(40);
        expect(GENERATION_DEFAULTS.frequencyPenalty).toBe(0);
        expect(GENERATION_DEFAULTS.presencePenalty).toBe(0);
    });

    it("has correct types for all properties", () => {
        expectTypeOf(GENERATION_DEFAULTS.temperature).toBeNumber();
        expectTypeOf(GENERATION_DEFAULTS.maxInputTokens).toBeNumber();
        expectTypeOf(GENERATION_DEFAULTS.maxOutputTokens).toBeNumber();
        expectTypeOf(GENERATION_DEFAULTS.topP).toBeNumber();
        expectTypeOf(GENERATION_DEFAULTS.topK).toBeNumber();
        expectTypeOf(GENERATION_DEFAULTS.frequencyPenalty).toBeNumber();
        expectTypeOf(GENERATION_DEFAULTS.presencePenalty).toBeNumber();
    });

    it("has exactly 7 properties", () => {
        expect(Object.keys(GENERATION_DEFAULTS)).toHaveLength(7);
    });

    it("values are within expected ranges", () => {
        expect(GENERATION_DEFAULTS.temperature).toBeGreaterThanOrEqual(0);
        expect(GENERATION_DEFAULTS.topP).toBeGreaterThanOrEqual(0);
        expect(GENERATION_DEFAULTS.topP).toBeLessThanOrEqual(1);
        expect(GENERATION_DEFAULTS.topK).toBeGreaterThan(0);
        expect(GENERATION_DEFAULTS.maxInputTokens).toBeGreaterThan(0);
        expect(GENERATION_DEFAULTS.maxOutputTokens).toBeGreaterThan(0);
    });
});
