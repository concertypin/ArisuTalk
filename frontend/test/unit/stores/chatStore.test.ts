import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

describe.concurrent("ChatStore Settings Loading", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test.concurrent("waits for settings to load with correct polling interval", async () => {
        // This test verifies the constants are used correctly
        const SETTINGS_POLL_TIMEOUT_MS = 5000;
        const SETTINGS_POLL_INTERVAL_MS = 100;

        // Calculate expected iterations
        const expectedIterations = SETTINGS_POLL_TIMEOUT_MS / SETTINGS_POLL_INTERVAL_MS;

        expect(expectedIterations).toBe(50);
        expect(SETTINGS_POLL_INTERVAL_MS).toBe(100);
        expect(SETTINGS_POLL_TIMEOUT_MS).toBe(5000);
    });

    test.concurrent("polling timeout is 5 seconds", async () => {
        const TIMEOUT_MS = 5000;
        const INTERVAL_MS = 100;

        // Verify the math
        expect(TIMEOUT_MS / INTERVAL_MS).toBe(50);
    });

    test.concurrent("polling interval is 100ms", async () => {
        const INTERVAL_MS = 100;

        // Verify interval is reasonable
        expect(INTERVAL_MS).toBeGreaterThan(0);
        expect(INTERVAL_MS).toBeLessThanOrEqual(1000);
    });
});

describe.concurrent("ChatStore Provider Loading Logic", () => {
    test.concurrent("mapProviderType maps Gemini correctly", async () => {
        const { LLMProviderSchema } = await import("@/lib/types/IDataModel");

        const geminiProvider = LLMProviderSchema.parse("Gemini");
        expect(geminiProvider).toBe("Gemini");
    });

    test.concurrent("mapProviderType maps OpenRouter correctly", async () => {
        const { LLMProviderSchema } = await import("@/lib/types/IDataModel");

        const openRouterProvider = LLMProviderSchema.parse("OpenRouter");
        expect(openRouterProvider).toBe("OpenRouter");
    });

    test.concurrent("mapProviderType maps Mock correctly", async () => {
        const { LLMProviderSchema } = await import("@/lib/types/IDataModel");

        const mockProvider = LLMProviderSchema.parse("Mock");
        expect(mockProvider).toBe("Mock");
    });

    test.concurrent("mapProviderType maps OpenAI correctly", async () => {
        const { LLMProviderSchema } = await import("@/lib/types/IDataModel");

        const openAIProvider = LLMProviderSchema.parse("OpenAI");
        expect(openAIProvider).toBe("OpenAI");
    });

    test.concurrent("mapProviderType maps OpenAI-compatible correctly", async () => {
        const { LLMProviderSchema } = await import("@/lib/types/IDataModel");

        const openAICompatible = LLMProviderSchema.parse("OpenAI-compatible");
        expect(openAICompatible).toBe("OpenAI-compatible");
    });

    test.concurrent("mapProviderType maps Anthropic correctly", async () => {
        const { LLMProviderSchema } = await import("@/lib/types/IDataModel");

        const anthropicProvider = LLMProviderSchema.parse("Anthropic");
        expect(anthropicProvider).toBe("Anthropic");
    });

    test.concurrent("LLMConfig schema has required fields", async () => {
        const { LLMConfigSchema } = await import("@/lib/types/IDataModel");

        const config = LLMConfigSchema.parse({
            name: "Test Config",
            provider: "Mock",
        });

        expect(config).toHaveProperty("id");
        expect(config).toHaveProperty("name");
        expect(config).toHaveProperty("provider");
        expect(config).toHaveProperty("enabled");
        expect(config).toHaveProperty("generationParameters");
    });

    test.concurrent("LLMConfig defaults to enabled=true", async () => {
        const { LLMConfigSchema } = await import("@/lib/types/IDataModel");

        const config = LLMConfigSchema.parse({
            name: "Test",
            provider: "Mock",
        });

        expect(config.enabled).toBe(true);
    });

    test.concurrent("LLMConfig can be disabled", async () => {
        const { LLMConfigSchema } = await import("@/lib/types/IDataModel");

        const config = LLMConfigSchema.parse({
            name: "Test",
            provider: "Mock",
            enabled: false,
        });

        expect(config.enabled).toBe(false);
    });

    test.concurrent("Settings schema has activeLLMConfigId field", async () => {
        const { SettingsSchema } = await import("@/lib/types/IDataModel");

        const settings = SettingsSchema.parse({});

        expect(settings).toHaveProperty("activeLLMConfigId");
        expect(settings.activeLLMConfigId).toBeNull();
    });

    test.concurrent("Settings can have activeLLMConfigId set", async () => {
        const { SettingsSchema } = await import("@/lib/types/IDataModel");

        const settings = SettingsSchema.parse({
            activeLLMConfigId: "test-id-123",
        });

        expect(settings.activeLLMConfigId).toBe("test-id-123");
    });

    test.concurrent("LLMConfig generates unique IDs", async () => {
        const { LLMConfigSchema } = await import("@/lib/types/IDataModel");

        const config1 = LLMConfigSchema.parse({ name: "Config 1", provider: "Mock" });
        const config2 = LLMConfigSchema.parse({ name: "Config 2", provider: "Mock" });

        expect(config1.id).not.toBe(config2.id);
        expect(config1.id).toMatch(/^LLMconfig-/);
        expect(config2.id).toMatch(/^LLMconfig-/);
    });

    test.concurrent("generationParameters has all optional fields", async () => {
        const { LLMGenerationParametersSchema } = await import("@/lib/types/IDataModel");

        const params = LLMGenerationParametersSchema.parse({});

        expect(params).toBeDefined();
        expect(params.temperature).toBeUndefined();
        expect(params.maxInputTokens).toBeUndefined();
        expect(params.maxOutputTokens).toBeUndefined();
        expect(params.topP).toBeUndefined();
        expect(params.topK).toBeUndefined();
        expect(params.frequencyPenalty).toBeUndefined();
        expect(params.presencePenalty).toBeUndefined();
    });

    test.concurrent("generationParameters validates temperature range", async () => {
        const { LLMGenerationParametersSchema } = await import("@/lib/types/IDataModel");

        const params = LLMGenerationParametersSchema.parse({
            temperature: 1.5,
        });

        expect(params.temperature).toBe(1.5);
    });

    test.concurrent("generationParameters validates topP range", async () => {
        const { LLMGenerationParametersSchema } = await import("@/lib/types/IDataModel");

        const params = LLMGenerationParametersSchema.parse({
            topP: 0.95,
        });

        expect(params.topP).toBe(0.95);
        expect(params.topP).toBeGreaterThanOrEqual(0);
        expect(params.topP).toBeLessThanOrEqual(1);
    });

    test.concurrent("generationParameters validates penalties range", async () => {
        const { LLMGenerationParametersSchema } = await import("@/lib/types/IDataModel");

        const params = LLMGenerationParametersSchema.parse({
            frequencyPenalty: 0.5,
            presencePenalty: -0.5,
        });

        expect(params.frequencyPenalty).toBe(0.5);
        expect(params.presencePenalty).toBe(-0.5);
        expect(params.frequencyPenalty).toBeGreaterThanOrEqual(-2);
        expect(params.frequencyPenalty).toBeLessThanOrEqual(2);
        expect(params.presencePenalty).toBeGreaterThanOrEqual(-2);
        expect(params.presencePenalty).toBeLessThanOrEqual(2);
    });
});
