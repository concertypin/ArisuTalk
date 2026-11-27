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
    test("shows the stored metadata in its fields", () => {
        const { metadata } = createSettingsCharacter();
        renderMetadata();

        expect(screen.getByRole("textbox", { name: "Author" })).toHaveValue(metadata.author);
        expect(screen.getByRole("combobox", { name: "License" })).toHaveValue(metadata.license);
        expect(screen.getByRole("textbox", { name: "Version" })).toHaveValue(metadata.version);
        expect(screen.getByRole("textbox", { name: "Distribution URL" })).toHaveValue(
            metadata.distributedOn
        );
        expect(screen.getByRole("textbox", { name: "Additional Info" })).toHaveValue(
            metadata.additionalInfo
        );
    });

    test("shows empty fields for optional metadata that was never set", () => {
        renderMetadata(
            createSettingsCharacter({
                metadata: { license: "ARR" },
            })
        );

        expect(screen.getByRole("textbox", { name: "Author" })).toHaveValue("");
        expect(screen.getByRole("textbox", { name: "Version" })).toHaveValue("");
        expect(screen.getByRole("textbox", { name: "Additional Info" })).toHaveValue("");
    });

    test("offers the common licenses as suggestions for the license field", () => {
        renderMetadata();

        const license = screen.getByRole("combobox", { name: "License" });
        if (!(license instanceof HTMLInputElement)) throw new Error("license is not an input");

        const suggestions = Array.from(license.list?.children ?? []).map((option) =>
            option.getAttribute("value")
        );
        expect(suggestions).toEqual(
            expect.arrayContaining(["ARR", "CC0", "CC-BY", "CC-BY-SA", "CC-BY-NC", "MIT"])
        );
    });

    test("typing an author reports it and leaves the other metadata and fields untouched", async () => {
        const original = createSettingsCharacter();
        const { editor, user } = renderMetadata(original);

        await fillText(user, screen.getByRole("textbox", { name: "Author" }), "새 작가");

        expect(editor.lastChange()).toEqual({
            ...original,
            metadata: { ...original.metadata, author: "새 작가" },
        });
    });

    test("each field writes to its own metadata key", async () => {
        const { editor, user } = renderMetadata();

        await fillText(user, screen.getByRole("combobox", { name: "License" }), "CC-BY");
        await fillText(user, screen.getByRole("textbox", { name: "Version" }), "2.1.0");
        await fillText(
            user,
            screen.getByRole("textbox", { name: "Distribution URL" }),
            "https://example.org/x"
        );
        await fillText(
            user,
            screen.getByRole("textbox", { name: "Additional Info" }),
            "다른 분께 감사드립니다"
        );

        expect(editor.lastChange().metadata).toEqual({
            author: createSettingsCharacter().metadata.author,
            license: "CC-BY",
            version: "2.1.0",
            distributedOn: "https://example.org/x",
            additionalInfo: "다른 분께 감사드립니다",
        });
    });

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

    test("clearing the license stores an empty string instead of dropping the required field", async () => {
        const { editor, user } = renderMetadata();

        await fillText(user, screen.getByRole("combobox", { name: "License" }), "");

        expect(editor.lastChange().metadata.license).toBe("");
    });
});
