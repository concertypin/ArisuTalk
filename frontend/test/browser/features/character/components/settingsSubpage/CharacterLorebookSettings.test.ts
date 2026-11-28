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
    test("shows the empty state and a zero entry count for a character without lore", () => {
        renderLorebook(makeLorebookCharacter([]));

        screen.getByText("No lorebook entries yet.");
        screen.getByRole("heading", { name: "Entries (0)" });
    });

    test("lists every entry with its condition label and priority", () => {
        renderLorebook(
            makeLorebookCharacter([
                makeEntry("a", { name: "알파", priority: 3 }),
                makeEntry("b", {
                    name: "베타",
                    condition: [{ type: "plain_text_match", text: "안녕" }],
                }),
                makeEntry("c", {
                    name: "감마",
                    condition: [{ type: "regex_match", regexPattern: "h.llo", regexFlags: "g" }],
                }),
            ])
        );

        screen.getByRole("heading", { name: "Entries (3)" });
        screen.getByRole("button", { name: /알파.*Always.*P: 3/ });
        screen.getByRole("button", { name: /베타.*Plain Text Match/ });
        screen.getByRole("button", { name: /감마.*Regex Match/ });
    });

    test("labels an entry with an empty name as Untitled", () => {
        renderLorebook(makeLorebookCharacter([makeEntry("a", { name: "" })]));

        screen.getByText("Untitled");
    });

    test("reports the typed token limit, and 0 for input that is not a number", async () => {
        const { editor, user } = renderLorebook(makeLorebookCharacter([], 100));
        const limit = screen.getByRole("spinbutton", { name: "Token Limit" });

        expect(limit).toHaveValue(100);

        await fillText(user, limit, "2500");
        expect(editor.lastChange().prompt.lorebook.config.tokenLimit).toBe(2500);

        await fillText(user, limit, "");
        expect(editor.lastChange().prompt.lorebook.config.tokenLimit).toBe(0);
    });

    test("keeps the existing entries when the token limit changes", async () => {
        const { editor, user } = renderLorebook(
            makeLorebookCharacter([makeEntry("a"), makeEntry("b")])
        );

        await fillText(user, screen.getByRole("spinbutton", { name: "Token Limit" }), "7");

        expect(editor.lastChange().prompt.lorebook.data.map((e) => e.id)).toEqual(["a", "b"]);
    });

    test("Add Entry appends a default entry after the existing ones and opens it for editing", async () => {
        const { editor, user } = renderLorebook(makeLorebookCharacter([makeEntry("a")]));

        await user.click(screen.getByRole("button", { name: "Add Entry" }));

        const data = editor.lastChange().prompt.lorebook.data;
        expect(data).toHaveLength(2);
        expect(data[0].id).toBe("a");
        expect(data[1]).toMatchObject({
            name: "New Entry",
            content: "",
            condition: [{ type: "always" }],
            multipleConditionResolveStrategy: "any",
            enabled: true,
            priority: 0,
        });
        expect(data[1].id).not.toBe("a");
        expect(data[1].id).not.toBe("");

        await screen.findByRole("heading", { name: "Entries (2)" });
        // The new entry is expanded: its name field shows the default name.
        expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("New Entry");
    });

    test("clicking an entry header expands it and clicking again collapses it", async () => {
        const { user } = renderLorebook(makeLorebookCharacter([makeEntry("a", { name: "알파" })]));
        const header = screen.getByRole("button", { name: /알파/ });

        await user.click(header);
        expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("알파");

        await user.click(header);
        expect(screen.queryByRole("textbox", { name: "Name" })).not.toBeInTheDocument();
    });

    test("pressing Enter on a focused entry header expands it, other keys do not", async () => {
        const { user } = renderLorebook(makeLorebookCharacter([makeEntry("a", { name: "알파" })]));
        const header = screen.getByRole("button", { name: /알파/ });

        header.focus();
        await user.keyboard("a");
        expect(screen.queryByRole("textbox", { name: "Name" })).not.toBeInTheDocument();

        await user.keyboard("{Enter}");
        expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("알파");
    });

    test("toggling the enabled checkbox changes only that entry and does not expand it", async () => {
        const { editor, user } = renderLorebook(
            makeLorebookCharacter([makeEntry("a"), makeEntry("b")])
        );

        await user.click(screen.getAllByRole("checkbox")[1]);

        const data = editor.lastChange().prompt.lorebook.data;
        expect(data.map((e) => [e.id, e.enabled])).toEqual([
            ["a", true],
            ["b", false],
        ]);
        expect(screen.queryByRole("textbox", { name: "Name" })).not.toBeInTheDocument();
    });

    test("editing name, priority and content of an expanded entry updates only that entry", async () => {
        const { editor, user } = renderLorebook(
            makeLorebookCharacter([makeEntry("a"), makeEntry("b", { name: "베타" })])
        );

        await user.click(screen.getByRole("button", { name: /베타/ }));

        await fillText(user, screen.getByRole("textbox", { name: "Name" }), "새 이름");
        await fillText(user, screen.getByRole("spinbutton", { name: "Priority" }), "5");
        await fillText(user, screen.getByRole("textbox", { name: "Content" }), "새 설정");

        const [a, b] = editor.lastChange().prompt.lorebook.data;
        expect(a).toEqual(makeEntry("a"));
        expect(b).toMatchObject({ id: "b", name: "새 이름", priority: 5, content: "새 설정" });
    });

    test("an empty priority is stored as 0", async () => {
        const { editor, user } = renderLorebook(
            makeLorebookCharacter([makeEntry("a", { priority: 9 })])
        );

        await user.click(screen.getByRole("button", { name: /Entry a/ }));
        await fillText(user, screen.getByRole("spinbutton", { name: "Priority" }), "");

        expect(editor.lastChange().prompt.lorebook.data[0].priority).toBe(0);
    });

    test("switching the condition to regex match creates an empty global regex condition", async () => {
        const { editor, user } = renderLorebook(makeLorebookCharacter([makeEntry("a")]));

        await user.click(screen.getByRole("button", { name: /Entry a/ }));
        await user.selectOptions(
            screen.getByRole("combobox", { name: "Condition" }),
            "regex_match"
        );

        expect(editor.lastChange().prompt.lorebook.data[0].condition).toEqual([
            { type: "regex_match", regexPattern: "", regexFlags: "g" },
        ]);
        await screen.findByRole("button", { name: /Entry a.*Regex Match/ });
    });

    test("switching the condition to plain text match creates an empty text condition", async () => {
        const { editor, user } = renderLorebook(makeLorebookCharacter([makeEntry("a")]));

        await user.click(screen.getByRole("button", { name: /Entry a/ }));
        await user.selectOptions(
            screen.getByRole("combobox", { name: "Condition" }),
            "plain_text_match"
        );

        expect(editor.lastChange().prompt.lorebook.data[0].condition).toEqual([
            { type: "plain_text_match", text: "" },
        ]);
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
