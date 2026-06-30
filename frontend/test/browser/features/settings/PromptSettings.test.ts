import { test, expect } from "vitest";
import { render } from "vitest-browser-svelte";
import PromptSettings from "@/components/settingSubpage/PromptSettings.svelte";
import { settings } from "@/lib/stores/settings.svelte";

test("PromptSettings renders correctly", async () => {
    const { getByText, getByRole } = render(PromptSettings);

    // Check if main title exists
    await expect.element(getByText("Prompt Settings")).toBeVisible();

    // Check if textarea exists with current value
    // Note: Using getByRole('textbox') since <legend> doesn't create a label-input relationship
    const textarea = getByRole("textbox");
    await expect.element(textarea).toBeVisible();
    expect((textarea.element() as HTMLTextAreaElement).value).toBe(
        settings.value.prompt.generationPrompt
    );
});
