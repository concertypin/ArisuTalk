import { test, expect, describe, beforeEach } from "vitest";
import { renderWithAppContext } from "@test/utils/appContext.svelte";
import CharacterLayoutTestWrapper from "../../wrappers/CharacterLayoutTestWrapper.svelte";
import { characterStore } from "@/features/character/stores/characterStore.svelte";
import type { Character } from "@arisutalk/character-spec/v0/Character";

describe("Character Sidebar Verification", () => {
    let mockCharacters: Character[];

    beforeEach(async () => {
        // The store loads from storage asynchronously and would overwrite the characters set below.
        await characterStore.initPromise;

        mockCharacters = [
            {
                id: "char-1",
                specVersion: 0,
                name: "Character 1",
                description: "First character",
                avatarUrl: undefined,
                assets: { assets: [] },
                prompt: {
                    description: "",
                    authorsNote: "",
                    lorebook: { config: { tokenLimit: 0 }, data: [] },
                },
                executables: {
                    runtimeSetting: { mem: undefined, timeout: 30000 },
                    replaceHooks: { display: [], input: [], output: [], request: [] },
                },
                metadata: {
                    author: undefined,
                    license: "",
                    version: undefined,
                    distributedOn: undefined,
                    additionalInfo: undefined,
                },
            },
        ];

        characterStore.characters = mockCharacters;
    });

    test("Character Sidebar Verification", async () => {
        const { getByLabelText, getByText } = renderWithAppContext(CharacterLayoutTestWrapper, {});

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
