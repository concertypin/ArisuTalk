/**
 * @fileoverview Test helpers for the character settings subpages.
 * A subpage reads the character through `context().getCharacter()` and reports edits through
 * `context().onCharacterChange()`. `CharacterSettingsModal` answers the second by replacing the character it
 * hands back through the first. `createCharacterEditor` does the same, so a test sees what the user sees
 * after an edit, and can also read every character the subpage reported.
 */
import { vi } from "vitest";
import type * as z from "zod";
import type { Character, CharacterSchema } from "@arisutalk/character-spec/v0/Character";
import { createTestCharacter } from "@test/utils/character";
import type { TContext } from "@/features/character/components/settingsSubpage/types";

/** An editor driving a settings subpage with a real, replaceable character. */
export type CharacterEditor = {
    /** The character as the subpage currently sees it. */
    readonly character: Character;
    /** Every value passed to `onCharacterChange`, in call order, as plain snapshots (`null` for a deletion). */
    readonly changes: (Character | null)[];
    /** The last value passed to `onCharacterChange`. Fails the test when nothing was reported. */
    lastChange(): Character;
    /** Spy behind the `cancelAutosave` callback of the context. */
    readonly cancelAutosave: ReturnType<typeof vi.fn<() => void>>;
    /** The `context` prop of a subpage. */
    readonly context: () => TContext;
};

/**
 * Builds the character the settings subpage tests edit: a prompt with an author note and a lorebook
 * config, and fully filled metadata, on top of the shared `createTestCharacter` fixture.
 * @param overrides - Top-level fields to replace.
 * @returns A fresh character. Nested objects are not shared between calls.
 */
export function createSettingsCharacter(
    overrides: Partial<z.input<typeof CharacterSchema>> = {}
): Character {
    return createTestCharacter({
        prompt: {
            description: "캐릭터 설명",
            authorsNote: "작가의 메모",
            lorebook: { config: { tokenLimit: 100 }, data: [] },
        },
        metadata: {
            author: "테스트 작가",
            license: "MIT",
            version: "1.0.0",
            distributedOn: "https://example.com/char",
            additionalInfo: "참고 사항",
        },
        ...overrides,
    });
}

/**
 * Creates an editor around `initial`. Reassigning the character is reactive, nested edits are not
 * (the same as in `CharacterSettingsModal`, which swaps in the object a subpage reports).
 * @param initial - Character the subpage starts with.
 * @returns The editor. Pass `editor.context` as the `context` prop of the subpage.
 */
export function createCharacterEditor(initial: Character): CharacterEditor {
    let current = $state.raw(initial);
    const changes: (Character | null)[] = [];
    const cancelAutosave = vi.fn<() => void>();

    return {
        get character() {
            return current;
        },
        changes,
        lastChange() {
            const last = changes.at(-1);
            if (!last) throw new Error("Expected the subpage to report a character change");
            return last;
        },
        cancelAutosave,
        context: () => ({
            getCharacter: () => current,
            onCharacterChange: (updated) => {
                changes.push(updated === null ? null : structuredClone($state.snapshot(updated)));
                if (updated !== null) current = updated;
            },
            cancelAutosave,
        }),
    };
}
