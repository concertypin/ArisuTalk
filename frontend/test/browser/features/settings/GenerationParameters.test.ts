import { test, expect, describe, vi, beforeEach, assert } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { fillText } from "@test/utils/user";
import { tick } from "svelte";
import Wrapper from "../../wrappers/GenerationParametersTestWrapper.svelte";
import { settings } from "@/lib/stores/settings.svelte";
import type { LLMConfig } from "@/lib/types/IDataModel";

// Mock the settings store
vi.mock("@/lib/stores/settings.svelte", () => {
    const mockSettings = {
        isLoaded: true,
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

    test("renders config name", () => {
        render(Wrapper, {
            props: {
                config: mockConfig,
                id: 0,
            },
        });

        const nameInput = screen.getAllByRole("textbox")[0];
        expect(nameInput).toHaveValue("Test Config");
    });

    test("shows active badge when config is active", () => {
        render(Wrapper, {
            props: {
                config: mockConfig,
                id: 0,
            },
        });

        const activeBadge = screen.getByText("Active");
        expect(activeBadge).toBeInTheDocument();
    });

    test("disables set as active button when config is already active", () => {
        render(Wrapper, {
            props: {
                config: mockConfig,
                id: 0,
            },
        });

        const setActiveButton = screen.getByRole("button", { name: /Use this config/i });
        expect(setActiveButton).toBeDisabled();
    });

    test("shows model when configured", () => {
        render(Wrapper, {
            props: {
                config: mockConfig,
                id: 0,
            },
        });

        const modelInput = screen.getByRole("textbox", { name: /model/i });
        expect(modelInput).toHaveValue("gpt-4");
    });

    test("shows temperature value when configured", () => {
        render(Wrapper, {
            props: {
                config: mockConfig,
                id: 0,
            },
        });

        const temperatureInput = screen.getByLabelText(/temperature value/i);
        expect(temperatureInput).toHaveValue("0.7");
    });

    test("shows max tokens values when configured", () => {
        render(Wrapper, {
            props: {
                config: mockConfig,
                id: 0,
            },
        });

        const maxInputTokens = screen.getByLabelText(/max input tokens value/i);
        expect(maxInputTokens).toHaveValue(4096);

        const maxOutputTokens = screen.getByLabelText(/max output tokens value/i);
        expect(maxOutputTokens).toHaveValue(2048);
    });

    test("calls removeLLMConfig when delete button is clicked", () => {
        render(Wrapper, {
            props: {
                config: mockConfig,
                id: 0,
            },
        });

        const deleteButton = screen.getByLabelText("Delete config");
        const element = deleteButton;
        assert(element instanceof HTMLElement, "delete button must be HTMLElement");
        element.click();
        element.click();

        expect(settings.value.llmConfigs).toHaveLength(0);
        expect(settings.value.activeLLMConfigId).toBeNull();
    });

    test("calls setAsActive when set as active button is clicked", () => {
        const inactiveConfig = {
            ...mockConfig,
            id: "config-2",
        };
        settings.value.llmConfigs = [mockConfig, inactiveConfig];
        settings.value.activeLLMConfigId = "config-1";

        render(Wrapper, {
            props: {
                config: inactiveConfig,
                id: 1,
            },
        });

        const setActiveButton = screen.getByLabelText("Use this config");
        const element = setActiveButton;
        assert(element instanceof HTMLElement, "set-active button must be HTMLElement");
        element.click();

        expect(settings.value.activeLLMConfigId).toBe("config-2");
    });

    test("toggles enabled state when checkbox is changed", () => {
        render(Wrapper, {
            props: {
                config: mockConfig,
                id: 0,
            },
        });

        const toggleButton = screen.getByLabelText("Toggle enabled");
        // Start checked
        expect(toggleButton).toBeChecked();

        const element = toggleButton;
        assert(element instanceof HTMLElement, "toggle button must be HTMLElement");
        element.click();

        // Verify UI change
        expect(toggleButton).not.toBeChecked();
    });

    test("updates config name when input changes", async () => {
        const user = userEvent.setup();
        render(Wrapper, {
            props: {
                config: mockConfig,
                id: 0,
            },
        });

        const nameInput = screen.getAllByRole("textbox")[0];
        await fillText(user, nameInput, "Updated Config");

        expect(nameInput).toHaveValue("Updated Config");
    });

    test("updates model when input changes", async () => {
        const user = userEvent.setup();
        render(Wrapper, {
            props: {
                config: mockConfig,
                id: 0,
            },
        });

        const modelInput = screen.getByRole("textbox", { name: /model/i });
        await fillText(user, modelInput, "gpt-4-turbo");

        expect(modelInput).toHaveValue("gpt-4-turbo");
    });

    test("shows checkboxes for optional parameters", () => {
        render(Wrapper, {
            props: {
                config: mockConfig,
                id: 0,
            },
        });

        const temperatureCheckbox = screen.getAllByLabelText(/Temperature/i)[0];
        const topPCheckbox = screen.getAllByLabelText(/Top P/i)[0];
        const topKCheckbox = screen.getByLabelText("Top K", { exact: true });

        expect(temperatureCheckbox).toBeChecked();
        expect(topPCheckbox).toBeChecked();
        expect(topKCheckbox).toBeChecked();
    });

    test("unchecks optional parameter when checkbox is toggled", () => {
        render(Wrapper, {
            props: {
                config: mockConfig,
                id: 0,
            },
        });

        const temperatureCheckbox = screen.getAllByLabelText(/Temperature/i)[0];
        expect(temperatureCheckbox).toBeChecked();
        const element = temperatureCheckbox;
        assert(element instanceof HTMLElement, "temperature checkbox must be HTMLElement");
        element.click();

        // Verify UI change (Label will change to "Temperature (Off)")
        const offCheckbox = screen.getAllByLabelText(/Temperature/i)[0];
        expect(offCheckbox).not.toBeChecked();
    });

    test("clears active config when active config is deleted", () => {
        render(Wrapper, {
            props: {
                config: mockConfig,
                id: 0,
            },
        });

        const deleteButton = screen.getByLabelText("Delete config");
        const element = deleteButton;
        assert(element instanceof HTMLElement, "delete button must be HTMLElement");
        element.click();

        expect(settings.value.activeLLMConfigId).toBeNull();
    });
    // ─── Bidirectional reactive sync (GenerationParameters local $state shadow) ───
    // The component uses a `localConfig` $state shadow that mirrors UI edits
    // back to the parent config. These tests pin the child→parent direction,
    // which is the primary user scenario (typing in the UI persists).
    //
    // The parent→child direction is exercised in production when the keyed
    // `{#each}` block in `LLMSettings.svelte` remounts the component on
    // `settings.value.llmConfigs` replacement — not by mutating the existing
    // `config` prop in place.

    test("local UI edits propagate to the parent config prop", async () => {
        const user = userEvent.setup();
        render(Wrapper, {
            props: {
                config: mockConfig,
                id: 0,
            },
        });

        const nameInput = screen.getAllByRole("textbox")[0];
        await fillText(user, nameInput, "Renamed Config");
        await tick();

        expect(mockConfig.name).toBe("Renamed Config");
    });

    test("temperature slider change propagates to the parent config prop", async () => {
        render(Wrapper, {
            props: {
                config: mockConfig,
                id: 0,
            },
        });

        // user-event cannot drive a range input, so dispatch the input event directly.
        const temperatureInput = screen.getByLabelText(/temperature value/i);
        await fireEvent.input(temperatureInput, { target: { value: "1.5" } });
        await tick();

        expect(mockConfig.generationParameters.temperature).toBe(1.5);
    });

    test("unchecking model checkbox deletes the model field on the parent config", async () => {
        const user = userEvent.setup();
        render(Wrapper, {
            props: {
                config: mockConfig,
                id: 0,
            },
        });

        const modelToggle = screen.getByRole("checkbox", { name: "Include Model" });
        const modelInput = screen.getByRole("textbox", { name: /model/i });
        expect(modelToggle).toBeChecked();
        expect(modelInput).toBeEnabled();

        await user.click(modelToggle);

        expect(modelToggle).not.toBeChecked();
        expect(modelInput).toBeDisabled();
        await waitFor(() => expect(mockConfig).not.toHaveProperty("model"));
    });

    test("repeated field edits settle cleanly (no reactive thrash)", async () => {
        const user = userEvent.setup();
        render(Wrapper, {
            props: {
                config: mockConfig,
                id: 0,
            },
        });

        const nameInput = screen.getAllByRole("textbox")[0];
        const modelInput = screen.getByRole("textbox", { name: /model/i });

        await fillText(user, nameInput, "Round 1");
        await tick();
        expect(mockConfig.name).toBe("Round 1");

        await fillText(user, nameInput, "Round 2");
        await tick();
        expect(mockConfig.name).toBe("Round 2");

        await fillText(user, modelInput, "claude-4.5");
        await tick();
        expect(mockConfig.model).toBe("claude-4.5");

        // Sanity: subsequent settle should be a no-op (no thrash).
        await tick();
        expect(nameInput).toHaveValue("Round 2");
    });
});
