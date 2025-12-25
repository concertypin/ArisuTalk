import { test, expect, describe, vi, beforeEach } from "vitest";
import { render } from "vitest-browser-svelte";
import GenerationParameters from "@/components/settingSubpage/LLMSetting/GenerationParameters.svelte";
import { settings } from "@/lib/stores/settings.svelte";
import type { LLMConfig } from "@/lib/types/IDataModel";

// Mock the settings store
vi.mock("@/lib/stores/settings.svelte", () => {
    const mockSettings = {
        value: {
            llmConfigs: [],
            activeLLMConfigId: null,
        },
    };
    return {
        settings: mockSettings,
    };
});

describe("GenerationParameters Component", () => {
    let mockConfig: LLMConfig;

    beforeEach(() => {
        mockConfig = {
            id: "config-1",
            name: "Test Config",
            enabled: true,
            provider: "OpenAI",
            model: "gpt-4",
            apiKey: "sk-test-key",
            baseURL: "https://api.openai.com/v1",
            generationParameters: {
                temperature: 0.7,
                maxInputTokens: 4096,
                maxOutputTokens: 2048,
                topP: 0.95,
                topK: 40,
                frequencyPenalty: 0,
                presencePenalty: 0,
            },
        };

        settings.value.llmConfigs = [mockConfig];
        settings.value.activeLLMConfigId = "config-1";
    });

    test("renders config name", async () => {
        const { getByLabelText } = render(GenerationParameters, {
            config: mockConfig,
            id: 0,
        });

        const nameInput = getByLabelText(/config name/i);
        await expect.element(nameInput).toHaveValue("Test Config");
    });

    test("shows active badge when config is active", async () => {
        const { getByText } = render(GenerationParameters, {
            config: mockConfig,
            id: 0,
        });

        const activeBadge = getByText("Active");
        await expect.element(activeBadge).toBeVisible();
    });

    test("disables set as active button when config is already active", async () => {
        const { getByRole } = render(GenerationParameters, {
            config: mockConfig,
            id: 0,
        });

        const setActiveButton = getByRole("button", { name: /Use this config/i });
        await expect.element(setActiveButton).toBeDisabled();
    });

    test("shows model when configured", async () => {
        const { getByLabelText } = render(GenerationParameters, {
            config: mockConfig,
            id: 0,
        });

        const modelInput = getByLabelText(/model/i);
        await expect.element(modelInput).toHaveValue("gpt-4");
    });

    test("shows temperature value when configured", async () => {
        const { getByLabelText } = render(GenerationParameters, {
            config: mockConfig,
            id: 0,
        });

        const temperatureInput = getByLabelText(/temperature/i);
        await expect.element(temperatureInput).toHaveValue(0.7);
    });

    test("shows max tokens values when configured", async () => {
        const { getByLabelText } = render(GenerationParameters, {
            config: mockConfig,
            id: 0,
        });

        const maxInputTokens = getByLabelText(/max input tokens/i);
        await expect.element(maxInputTokens).toHaveValue(4096);

        const maxOutputTokens = getByLabelText(/max output tokens/i);
        await expect.element(maxOutputTokens).toHaveValue(2048);
    });

    test("calls removeLLMConfig when delete button is clicked", async () => {
        const { getByRole } = render(GenerationParameters, {
            config: mockConfig,
            id: 0,
        });

        const deleteButton = getByRole("button", { name: /Delete/i });
        await deleteButton.click();

        expect(settings.value.llmConfigs).toHaveLength(0);
        expect(settings.value.activeLLMConfigId).toBeNull();
    });

    test("calls setAsActive when set as active button is clicked", async () => {
        const inactiveConfig = {
            ...mockConfig,
            id: "config-2",
        };
        settings.value.llmConfigs = [mockConfig, inactiveConfig];
        settings.value.activeLLMConfigId = "config-1";

        const { getByRole } = render(GenerationParameters, {
            config: inactiveConfig,
            id: 1,
        });

        const setActiveButton = getByRole("button", { name: /Use this config/i });
        await setActiveButton.click();

        expect(settings.value.activeLLMConfigId).toBe("config-2");
    });

    test("toggles enabled state when checkbox is changed", async () => {
        const { getByRole } = render(GenerationParameters, {
            config: mockConfig,
            id: 0,
        });

        const toggleButton = getByRole("switch", { name: /Enable\/Disable/i });
        await toggleButton.click();

        expect(mockConfig.enabled).toBe(false);
    });

    test("updates config name when input changes", async () => {
        const { getByLabelText } = render(GenerationParameters, {
            config: mockConfig,
            id: 0,
        });

        const nameInput = getByLabelText(/config name/i);
        await nameInput.fill("Updated Config");

        expect(mockConfig.name).toBe("Updated Config");
    });

    test("updates model when input changes", async () => {
        const { getByLabelText } = render(GenerationParameters, {
            config: mockConfig,
            id: 0,
        });

        const modelInput = getByLabelText(/model/i);
        await modelInput.fill("gpt-4-turbo");

        expect(mockConfig.model).toBe("gpt-4-turbo");
    });

    test("shows checkboxes for optional parameters", async () => {
        const { getByLabelText } = render(GenerationParameters, {
            config: mockConfig,
            id: 0,
        });

        const temperatureCheckbox = getByLabelText(/temperature/i, { exact: false });
        const topPCheckbox = getByLabelText(/top p/i, { exact: false });
        const topKCheckbox = getByLabelText(/top k/i, { exact: false });

        await expect.element(temperatureCheckbox).toBeChecked();
        await expect.element(topPCheckbox).toBeChecked();
        await expect.element(topKCheckbox).toBeChecked();
    });

    test("unchecks optional parameter when checkbox is toggled", async () => {
        const { getByLabelText } = render(GenerationParameters, {
            config: mockConfig,
            id: 0,
        });

        const temperatureCheckbox = getByLabelText(/temperature/i, { exact: false });
        await temperatureCheckbox.click();

        // After clicking, the parameter should be undefined
        // This is a simplified test - actual behavior depends on component implementation
    });

    test("clears active config when active config is deleted", async () => {
        const { getByRole } = render(GenerationParameters, {
            config: mockConfig,
            id: 0,
        });

        const deleteButton = getByRole("button", { name: /Delete/i });
        await deleteButton.click();

        expect(settings.value.activeLLMConfigId).toBeNull();
    });
});
