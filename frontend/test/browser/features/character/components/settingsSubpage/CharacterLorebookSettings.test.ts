import { test, expect, describe } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import CharacterLorebookSettings from "@/features/character/components/settingsSubpage/CharacterLorebookSettings.svelte";
import type { Character } from "@arisutalk/character-spec/v0/Character";
import { createCharacterEditor, createSettingsCharacter } from "@test/utils/characterEditor.svelte";
import { fillText } from "@test/utils/user";

type LorebookEntry = Character["prompt"]["lorebook"]["data"][number];

function makeEntry(id: string, overrides: Partial<LorebookEntry> = {}): LorebookEntry {
    return {
        id,
        name: `Entry ${id}`,
        content: `Content ${id}`,
        condition: [{ type: "always" }],
        multipleConditionResolveStrategy: "any",
        enabled: true,
        priority: 0,
        ...overrides,
    };
}

function makeLorebookCharacter(entries: LorebookEntry[], tokenLimit = 100): Character {
    const base = createSettingsCharacter();
    return createSettingsCharacter({
        prompt: { ...base.prompt, lorebook: { config: { tokenLimit }, data: entries } },
    });
}

function renderLorebook(character: Character) {
    const user = userEvent.setup();
    const editor = createCharacterEditor(character);
    render(CharacterLorebookSettings, { props: { context: editor.context } });
    return { editor, user };
}

describe("CharacterLorebookSettings", () => {
    test("keeps the existing entries when the token limit changes", async () => {
        const { editor, user } = renderLorebook(
            makeLorebookCharacter([makeEntry("a"), makeEntry("b")])
        );

        await fillText(user, screen.getByRole("spinbutton", { name: "Token Limit" }), "7");

        expect(editor.lastChange().prompt.lorebook.data.map((e) => e.id)).toEqual(["a", "b"]);
    });

    test("switching the condition back to always drops the fields of the previous condition", async () => {
        const { editor, user } = renderLorebook(
            makeLorebookCharacter([
                makeEntry("a", {
                    condition: [{ type: "regex_match", regexPattern: "h.llo", regexFlags: "gi" }],
                }),
            ])
        );

        await user.click(screen.getByRole("button", { name: /Entry a/ }));
        await user.selectOptions(screen.getByRole("combobox", { name: "Condition" }), "always");

        expect(editor.lastChange().prompt.lorebook.data[0].condition).toEqual([{ type: "always" }]);
    });

    test("deleting an entry removes exactly that entry and keeps the others in order", async () => {
        const { editor, user } = renderLorebook(
            makeLorebookCharacter([
                makeEntry("a", { name: "알파" }),
                makeEntry("b", { name: "베타" }),
                makeEntry("c", { name: "감마" }),
            ])
        );

        await user.click(screen.getByRole("button", { name: /베타/ }));
        await user.click(screen.getByRole("button", { name: "Delete" }));

        expect(editor.lastChange().prompt.lorebook.data.map((e) => e.id)).toEqual(["a", "c"]);
        await screen.findByRole("heading", { name: "Entries (2)" });
        expect(screen.queryByRole("button", { name: /베타/ })).not.toBeInTheDocument();
    });

    test("deleting the only entry brings back the empty state", async () => {
        const { editor, user } = renderLorebook(makeLorebookCharacter([makeEntry("a")]));

        await user.click(screen.getByRole("button", { name: /Entry a/ }));
        await user.click(screen.getByRole("button", { name: "Delete" }));

        expect(editor.lastChange().prompt.lorebook.data).toEqual([]);
        await screen.findByText("No lorebook entries yet.");
    });
});
