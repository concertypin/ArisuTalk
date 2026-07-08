import { test, expect, describe, beforeEach, afterEach } from "vitest";
import { render } from "vitest-browser-svelte";
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

    test("prompt settings renders correctly", async () => {
        const { getByText, getByRole } = render(PromptSettings);
        await expect.element(getByText("Prompt Settings")).toBeVisible();
        const textarea = getByRole("textbox");
        await expect.element(textarea).toBeVisible();
        expect(settings.value.prompt.generationPrompt).toBe(savedPrompt);
    });

    test("section toggle fieldset with instruction text renders", async () => {
        const { getByText } = render(PromptSettings);
        await expect.element(getByText("Prompt Sections")).toBeVisible();
        await expect.element(getByText("Toggle which sections are included")).toBeVisible();
    });

    test("section description visible when override disables a section", async () => {
        settings.value.prompt.promptSections = [{ key: "character", enabled: false }];
        const { getByText } = render(PromptSettings);
        await expect.element(getByText("Character persona (prompt.description)")).toBeVisible();
    });

    test("Load Template button renders", async () => {
        const { getByRole } = render(PromptSettings);
        const templateBtn = getByRole("button", { name: "Load Template" });
        await expect.element(templateBtn).toBeVisible();
        const textarea = getByRole("textbox");
        await expect.element(textarea).toBeVisible();
    });

    test("magic pattern syntax in help text uses correct {| ... |} form", async () => {
        const { container } = render(PromptSettings);
        const helpText = container.textContent ?? "";
        expect(helpText).toContain("{| ... |}");
        expect(helpText).not.toMatch(/(?<!\{)\|\s*\.\.\.\s*\|(?!})/);
    });
});
