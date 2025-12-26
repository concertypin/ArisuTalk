/// <reference types="vitest/browser" />
import { test, expect, describe, vi, beforeEach } from "vitest";
import { render } from "vitest-browser-svelte";
import Wrapper from "./GenerationParametersTestWrapper.svelte";
import { settings } from "@/lib/stores/settings.svelte";
import type { LLMConfig } from "@/lib/types/IDataModel";

// Mock the settings store
vi.mock("@/lib/stores/settings.svelte", () => {
    const mockSettings = {
        value: {
            llmConfigs: [],
            activeLLMConfigId: null,
            prompt: {
                generationPrompt: "",
                authorsNote: "",
            },
            advanced: {
                debug: false,
                experimental: false,
            },
        },
        save: vi.fn().mockResolvedValue(undefined),
        init: vi.fn().mockResolvedValue(undefined),
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
        const { getByRole } = render(Wrapper, {
            config: mockConfig,
            id: 0,
        });

        const nameInput = getByRole("textbox").first();
        await expect.element(nameInput).toHaveValue("Test Config");
    });

    test("shows active badge when config is active", async () => {
        const { getByText } = render(Wrapper, {
            config: mockConfig,
            id: 0,
        });

        const activeBadge = getByText("Active");
        await expect.element(activeBadge).toBeVisible();
    });

    test("disables set as active button when config is already active", async () => {
        const { getByRole } = render(Wrapper, {
            config: mockConfig,
            id: 0,
        });

        const setActiveButton = getByRole("button", { name: /Use this config/i });
        await expect.element(setActiveButton).toBeDisabled();
    });

    test("shows model when configured", async () => {
        const { getByLabelText } = render(Wrapper, {
            config: mockConfig,
            id: 0,
        });

        const modelInput = getByLabelText(/model/i);
        await expect.element(modelInput).toHaveValue("gpt-4");
    });

    test("shows temperature value when configured", async () => {
        const { getByLabelText } = render(Wrapper, {
            config: mockConfig,
            id: 0,
        });

        const temperatureInput = getByLabelText(/temperature value/i);
        await expect.element(temperatureInput).toHaveValue("0.7");
    });

    test("shows max tokens values when configured", async () => {
        const { getByLabelText } = render(Wrapper, {
            config: mockConfig,
            id: 0,
        });

        const maxInputTokens = getByLabelText(/max input tokens value/i);
        await expect.element(maxInputTokens).toHaveValue(4096);

        const maxOutputTokens = getByLabelText(/max output tokens value/i);
        await expect.element(maxOutputTokens).toHaveValue(2048);
    });

    test("calls removeLLMConfig when delete button is clicked", async () => {
        const { getByLabelText } = render(Wrapper, {
            config: mockConfig,
            id: 0,
        });

        const deleteButton = getByLabelText("Delete config");
        const element = await deleteButton.element();
        element.click();

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

        const { getByLabelText } = render(Wrapper, {
            config: inactiveConfig,
            id: 1,
        });

        const setActiveButton = getByLabelText("Use this config");
        const element = await setActiveButton.element();
        element.click();

        expect(settings.value.activeLLMConfigId).toBe("config-2");
    });

    test("toggles enabled state when checkbox is changed", async () => {
        const { getByLabelText } = render(Wrapper, {
            config: mockConfig,
            id: 0,
        });

        const toggleButton = getByLabelText("Toggle enabled");
        // Start checked
        await expect.element(toggleButton).toBeChecked();
        
        await toggleButton.click({ force: true });

        // Verify UI change
        await expect.element(toggleButton).not.toBeChecked();
    });

    test("updates config name when input changes", async () => {
        const { getByRole } = render(Wrapper, {
            config: mockConfig,
            id: 0,
        });

        const nameInput = getByRole("textbox").first();
        await nameInput.fill("Updated Config");

        await expect.element(nameInput).toHaveValue("Updated Config");
    });

    test("updates model when input changes", async () => {
        const { getByLabelText } = render(Wrapper, {
            config: mockConfig,
            id: 0,
        });

        const modelInput = getByLabelText(/model/i);
        await modelInput.fill("gpt-4-turbo");

        await expect.element(modelInput).toHaveValue("gpt-4-turbo");
    });

    test("shows checkboxes for optional parameters", async () => {
        const { getByLabelText } = render(Wrapper, {
            config: mockConfig,
            id: 0,
        });

        const temperatureCheckbox = getByLabelText(/Temperature/i).first();
        const topPCheckbox = getByLabelText(/Top P/i).first();
        const topKCheckbox = getByLabelText("Top K", { exact: true });

        await expect.element(temperatureCheckbox).toBeChecked();
        await expect.element(topPCheckbox).toBeChecked();
        await expect.element(topKCheckbox).toBeChecked();
    });

    test("unchecks optional parameter when checkbox is toggled", async () => {
        const { getByLabelText } = render(Wrapper, {
            config: mockConfig,
            id: 0,
        });

        const temperatureCheckbox = getByLabelText(/Temperature/i).first();
        await expect.element(temperatureCheckbox).toBeChecked();
        
        await temperatureCheckbox.click({ force: true });

        // Verify UI change (Label will change to "Temperature (Off)")
        const offCheckbox = getByLabelText(/Temperature/i).first();
        await expect.element(offCheckbox).not.toBeChecked();
    });

    test("clears active config when active config is deleted", async () => {
        const { getByLabelText } = render(Wrapper, {
            config: mockConfig,
            id: 0,
        });

        const deleteButton = getByLabelText("Delete config");
        const element = await deleteButton.element();
        element.click();

        expect(settings.value.activeLLMConfigId).toBeNull();
    });
});
