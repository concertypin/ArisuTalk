/**
 * @fileoverview Shared character fixture for tests that need a valid `Character`.
 */
import type * as z from "zod";
import { apply } from "@arisutalk/character-spec/utils";
import { CharacterSchema, type Character } from "@arisutalk/character-spec/v0/Character";

/**
 * Builds a valid character with every schema default filled in, so tests only spell out the
 * fields they care about. Each call returns a fresh object, so tests may mutate the result.
 * @param overrides - Fields to set on top of the fixture's id, name, description and prompt.
 * @returns A schema-parsed character.
 */
export function createTestCharacter(
    overrides: Partial<z.input<typeof CharacterSchema>> = {}
): Character {
    return apply(CharacterSchema, {
        id: "char-1",
        specVersion: 0,
        name: "Test Character",
        description: "A test character",
        prompt: { description: "" },
        ...overrides,
    });
}
