import type { Character } from "@arisutalk/character-spec/v0/Character";

export type TContext = {
    getCharacter: () => Character;
    onCharacterChange: (updatedCharacter: Character | null) => void;
};

export type TProps<T> = {
    context: () => T;
};
