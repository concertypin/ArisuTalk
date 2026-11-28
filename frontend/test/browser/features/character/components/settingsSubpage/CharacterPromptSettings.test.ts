import { test, expect, describe, afterEach } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import CharacterPromptSettings from "@/features/character/components/settingsSubpage/CharacterPromptSettings.svelte";
import { promptTemplateStore } from "@/features/promptTemplate/stores/promptTemplateStore.svelte";
import type { Character } from "@arisutalk/character-spec/v0/Character";
import { createCharacterEditor, createSettingsCharacter } from "@test/utils/characterEditor.svelte";
import { fillText } from "@test/utils/user";

function renderPrompt(character: Character = createSettingsCharacter()) {
    const user = userEvent.setup();
    const editor = createCharacterEditor(character);
    render(CharacterPromptSettings, { props: { context: editor.context } });
    return { editor, user };
}

function makePromptCharacter(description: string, authorsNote: string | undefined): Character {
    const base = createSettingsCharacter();
    return createSettingsCharacter({
        prompt: { ...base.prompt, description, authorsNote },
    });
}

describe("CharacterPromptSettings", () => {
    test("shows the description and author note with a token estimate for each", () => {
        // The estimate is about one token per four bytes, and a Hangul syllable is 3 bytes:
        // 6 bytes are 2 tokens, 12 bytes are 3 tokens.
        renderPrompt(makePromptCharacter("가나", "가나다라"));

        expect(screen.getByRole("textbox", { name: "Character Prompt Description" })).toHaveValue(
            "가나"
        );
        expect(screen.getByRole("textbox", { name: "Author's Note" })).toHaveValue("가나다라");
        screen.getByText("~2 tokens");
        screen.getByText("~3 tokens");
    });

    test("shows an empty author note and zero tokens when none is set", () => {
        renderPrompt(makePromptCharacter("", undefined));

        expect(screen.getByRole("textbox", { name: "Author's Note" })).toHaveValue("");
        expect(screen.getAllByText("~0 tokens")).toHaveLength(2);
    });

    test("editing the description reports it and refreshes the token estimate", async () => {
        const original = makePromptCharacter("짧음", "메모");
        const { editor, user } = renderPrompt(original);

        await fillText(
            user,
            screen.getByRole("textbox", { name: "Character Prompt Description" }),
            "가나다라마바사아"
        );

        expect(editor.lastChange()).toEqual({
            ...original,
            prompt: { ...original.prompt, description: "가나다라마바사아" },
        });
        // 24 bytes -> 6 tokens
        await screen.findByText("~6 tokens");
    });

    test("editing the author note keeps the description", async () => {
        const { editor, user } = renderPrompt(makePromptCharacter("설명", "이전 메모"));

        await fillText(user, screen.getByRole("textbox", { name: "Author's Note" }), "새 메모");

        expect(editor.lastChange().prompt).toMatchObject({
            description: "설명",
            authorsNote: "새 메모",
        });
    });

    test("clearing the author note removes it from the character", async () => {
        const { editor, user } = renderPrompt(makePromptCharacter("설명", "이전 메모"));

        await fillText(user, screen.getByRole("textbox", { name: "Author's Note" }), "");

        expect(editor.lastChange().prompt.authorsNote).toBeUndefined();
        expect(screen.getByRole("textbox", { name: "Author's Note" })).toHaveValue("");
    });

    test("an emptied description is stored as an empty string", async () => {
        const { editor, user } = renderPrompt(makePromptCharacter("설명", "메모"));

        await fillText(
            user,
            screen.getByRole("textbox", { name: "Character Prompt Description" }),
            ""
        );

        expect(editor.lastChange().prompt.description).toBe("");
    });

    test("focusing a textarea expands it, and its toggle button collapses it again", async () => {
        const { user } = renderPrompt();

        // Each fieldset has a toggle that reads "Expand" until its textarea is expanded.
        expect(screen.getAllByRole("button", { name: "Expand" })).toHaveLength(2);

        await user.click(screen.getByRole("textbox", { name: "Character Prompt Description" }));
        expect(screen.getAllByRole("button", { name: "Collapse" })).toHaveLength(1);

        await user.click(screen.getByRole("button", { name: "Collapse" }));
        expect(screen.getAllByRole("button", { name: "Expand" })).toHaveLength(2);

        await user.click(screen.getAllByRole("button", { name: "Expand" })[0]);
        expect(screen.getAllByRole("button", { name: "Collapse" })).toHaveLength(1);
    });

    test("the author note expands on focus independently of the description", async () => {
        const { user } = renderPrompt();
        const [descriptionToggle, noteToggle] = screen.getAllByRole("button", { name: "Expand" });

        await user.click(screen.getByRole("textbox", { name: "Author's Note" }));

        // Only the second toggle (the author note's) flipped.
        expect(descriptionToggle).toHaveAccessibleName("Expand");
        expect(noteToggle).toHaveAccessibleName("Collapse");
    });

    describe("templates", () => {
        const createdIds: string[] = [];

        afterEach(async () => {
            for (const id of createdIds.splice(0)) await promptTemplateStore.delete(id);
        });

        async function createTemplate(lore: string | undefined) {
            await promptTemplateStore.initPromise;
            const template = await promptTemplateStore.create({
                name: "커버리지 템플릿",
                description: "",
                prompts: { system: "템플릿 시스템 프롬프트", generation: "unused", lore },
            });
            createdIds.push(template.id);
            return template;
        }

        test("the template manager is hidden until Load Template is pressed, and Hide Templates closes it", async () => {
            const { user } = renderPrompt();

            expect(
                screen.queryByRole("heading", { name: "Prompt Templates" })
            ).not.toBeInTheDocument();

            await user.click(screen.getByRole("button", { name: "Load Template" }));
            await screen.findByRole("heading", { name: "Prompt Templates" });

            await user.click(screen.getByRole("button", { name: "Hide Templates" }));
            expect(
                screen.queryByRole("heading", { name: "Prompt Templates" })
            ).not.toBeInTheDocument();
        });

        test("applying a template replaces the description and the author note", async () => {
            const original = makePromptCharacter("이전 설명", "이전 메모");
            const { editor, user } = renderPrompt(original);
            await createTemplate("템플릿 설정");

            await user.click(screen.getByRole("button", { name: "Load Template" }));
            // The new template is stored after the seeded defaults.
            const applyButtons = await screen.findAllByRole("button", { name: "Apply template" });
            await user.click(applyButtons[applyButtons.length - 1]);

            expect(editor.lastChange().prompt).toMatchObject({
                description: "템플릿 시스템 프롬프트",
                authorsNote: "템플릿 설정",
            });
            expect(
                screen.getByRole("textbox", { name: "Character Prompt Description" })
            ).toHaveValue("템플릿 시스템 프롬프트");
        });

        test("applying a template without lore clears the previous author note", async () => {
            const { editor, user } = renderPrompt(makePromptCharacter("이전 설명", "이전 메모"));
            await createTemplate(undefined);

            await user.click(screen.getByRole("button", { name: "Load Template" }));
            const applyButtons = await screen.findAllByRole("button", { name: "Apply template" });
            await user.click(applyButtons[applyButtons.length - 1]);

            expect(editor.lastChange().prompt.authorsNote).toBeUndefined();
            expect(screen.getByRole("textbox", { name: "Author's Note" })).toHaveValue("");
        });
    });
});
