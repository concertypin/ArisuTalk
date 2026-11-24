import { test, expect, describe, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/svelte";
import PromptSettings from "@/components/settingSubpage/PromptSettings.svelte";
import { settings } from "@/lib/stores/settings.svelte";

describe("PromptSettings", () => {
    let savedSections: typeof settings.value.prompt.promptSections;
    let savedPrompt: string;

    beforeEach(() => {
        savedSections = settings.value.prompt.promptSections;
        savedPrompt = settings.value.prompt.generationPrompt;
    });

    afterEach(() => {
        settings.value.prompt.promptSections = savedSections;
        settings.value.prompt.generationPrompt = savedPrompt;
    });

    test("prompt settings renders correctly", () => {
        render(PromptSettings);
        expect(screen.getByText("Prompt Settings")).toBeInTheDocument();
        const textarea = screen.getByRole("textbox");
        expect(textarea).toBeInTheDocument();
        expect(settings.value.prompt.generationPrompt).toBe(savedPrompt);
    });

    test("section toggle fieldset with instruction text renders", () => {
        render(PromptSettings);
        expect(screen.getByText("Prompt Sections")).toBeInTheDocument();
        expect(screen.getByText(/Toggle which sections are included/)).toBeInTheDocument();
    });

    test("section description visible when override disables a section", () => {
        settings.value.prompt.promptSections = [{ key: "character", enabled: false }];
        render(PromptSettings);
        expect(screen.getByText("Character persona (prompt.description)")).toBeInTheDocument();
    });

    test("Load Template button renders", () => {
        render(PromptSettings);
        const templateBtn = screen.getByRole("button", { name: "Load Template" });
        expect(templateBtn).toBeInTheDocument();
        const textarea = screen.getByRole("textbox");
        expect(textarea).toBeInTheDocument();
    });

    test("magic pattern syntax in help text uses correct {| ... |} form", () => {
        const { container } = render(PromptSettings);
        const helpText = container.textContent ?? "";
        expect(helpText).toContain("{| ... |}");
        expect(helpText).not.toMatch(/(?<!\{)\|\s*\.\.\.\s*\|(?!})/);
    });
});
