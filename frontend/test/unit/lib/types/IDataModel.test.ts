import { describe, test, expect } from "vitest";
import {
    LLMConfigSchema,
    LLMGenerationParametersSchema,
    SettingsSchema,
} from "@/lib/types/IDataModel";

// These tests pin the decisions made in the schemas (defaults, id format, numeric bounds).
// What zod does with a valid value is zod's business and is not tested here.
describe.concurrent("IDataModel schema decisions", () => {
    describe("LLMConfigSchema", () => {
        /** A config that states nothing but the required fields, so every default applies. */
        const minimalConfig = LLMConfigSchema.parse({ name: "Test", provider: "Mock" });

        test("is enabled unless stated otherwise", () => {
            expect(minimalConfig.enabled).toBe(true);
        });

        test("starts with empty generation parameters", () => {
            expect(minimalConfig.generationParameters).toEqual({});
        });

        test("gets a fresh id with the LLMconfig- prefix for every config", () => {
            const first = LLMConfigSchema.parse({ name: "Config 1", provider: "Mock" });
            const second = LLMConfigSchema.parse({ name: "Config 2", provider: "Mock" });

            expect(first.id).toMatch(/^LLMconfig-/);
            expect(second.id).toMatch(/^LLMconfig-/);
            expect(first.id).not.toBe(second.id);
        });

        test("keeps an id that was given explicitly", () => {
            const config = LLMConfigSchema.parse({
                id: "LLMconfig-fixed",
                name: "Test",
                provider: "Mock",
            });

            expect(config.id).toBe("LLMconfig-fixed");
        });
    });

    describe("SettingsSchema", () => {
        test("has no active LLM config by default", () => {
            expect(SettingsSchema.parse({}).activeLLMConfigId).toBeNull();
        });

        test("has no LLM configs by default", () => {
            expect(SettingsSchema.parse({}).llmConfigs).toEqual([]);
        });

        test.for([9, 33, Number.NaN])("rejects the font size %s", (fontSize) => {
            expect(SettingsSchema.safeParse({ fontSize }).success).toBe(false);
        });

        test.for([10, 16, 32])("accepts the font size %s", (fontSize) => {
            expect(SettingsSchema.parse({ fontSize }).fontSize).toBe(fontSize);
        });
    });

    describe("LLMGenerationParametersSchema", () => {
        test("does not force any parameter, so providers keep their own defaults", () => {
            expect(LLMGenerationParametersSchema.parse({})).toEqual({});
        });

        test.for([
            { topP: -0.1 },
            { topP: 1.1 },
            { frequencyPenalty: -2.1 },
            { frequencyPenalty: 2.1 },
            { presencePenalty: -2.1 },
            { presencePenalty: 2.1 },
            { maxInputTokens: 0 },
            { maxOutputTokens: 0 },
            { maxOutputTokens: 1.5 },
            { topK: -1 },
            { topK: 1.5 },
            { thinkingLevel: -1 },
        ])("rejects the out-of-range parameters %o", (params) => {
            expect(LLMGenerationParametersSchema.safeParse(params).success).toBe(false);
        });

        test.for([
            { topP: 0 },
            { topP: 1 },
            { frequencyPenalty: -2 },
            { frequencyPenalty: 2 },
            { presencePenalty: -2 },
            { presencePenalty: 2 },
            { maxInputTokens: 1 },
            { maxOutputTokens: 1 },
            { topK: 0 },
            { thinkingLevel: 0 },
            { thinkingLevel: "high" },
        ])("accepts the boundary parameters %o", (params) => {
            expect(LLMGenerationParametersSchema.parse(params)).toEqual(params);
        });
    });
});
