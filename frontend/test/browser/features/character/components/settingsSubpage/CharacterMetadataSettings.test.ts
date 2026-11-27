import { test, expect, describe } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import CharacterMetadataSettings from "@/features/character/components/settingsSubpage/CharacterMetadataSettings.svelte";
import type { Character } from "@arisutalk/character-spec/v0/Character";
import { createCharacterEditor, createSettingsCharacter } from "@test/utils/characterEditor.svelte";
import { fillText } from "@test/utils/user";

function renderMetadata(character: Character = createSettingsCharacter()) {
    const user = userEvent.setup();
    const editor = createCharacterEditor(character);
    render(CharacterMetadataSettings, { props: { context: editor.context } });
    return { editor, user };
}

describe("CharacterMetadataSettings", () => {
    test.each([
        ["Author", "author"],
        ["Version", "version"],
        ["Distribution URL", "distributedOn"],
        ["Additional Info", "additionalInfo"],
    ] as const)("clearing the %s field removes the stored value", async (label, key) => {
        const { editor, user } = renderMetadata();

        await fillText(user, screen.getByRole("textbox", { name: label }), "");

        expect(editor.lastChange().metadata[key]).toBeUndefined();
        expect(screen.getByRole("textbox", { name: label })).toHaveValue("");
    });
});
