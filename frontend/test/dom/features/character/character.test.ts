import { test, expect, describe, beforeEach } from "vitest";
import { screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
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
        const user = userEvent.setup();
        renderWithAppContext(CharacterLayoutTestWrapper, {});

        // Check for Add Character button
        const addButton = screen.getByLabelText("Add Character");
        expect(addButton).toBeInTheDocument();

        // Click add
        await user.click(addButton);

        // Check if modal opens
        // jsdom evaluates the `open` attribute of <dialog> (hidden until `showModal()` runs), so
        // this fails if the modal never opened. A plain text query would not notice.
        const modalTitle = screen.getByText("New Character");
        expect(modalTitle).toBeVisible();
    });
});
