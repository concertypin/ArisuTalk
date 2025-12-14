import { test, expect, describe } from "vitest";
import { render } from "vitest-browser-svelte";
import CharacterLayoutTestWrapper from "./CharacterLayoutTestWrapper.svelte";

describe("Character Sidebar Verification", () => {
    test("Character Sidebar Verification", async () => {
        const { getByLabelText, getByText } = render(CharacterLayoutTestWrapper);

        // Check for Add Character button
        const addButton = getByLabelText("Add Character");
        await expect.element(addButton).toBeVisible();

        // Click add
        await addButton.click();

        // Check if modal opens
        const modalTitle = getByText("New Character");
        await expect.element(modalTitle).toBeVisible();
    });
});
