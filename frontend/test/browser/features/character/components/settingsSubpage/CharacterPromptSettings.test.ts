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
