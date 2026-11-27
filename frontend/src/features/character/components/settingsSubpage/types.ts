import type { Character } from "@arisutalk/character-spec/v0/Character";

/** What the character settings modal hands to each subpage. */
export type TContext = {
    /** Returns the character currently being edited. Read it inside a `$derived` to stay reactive. */
    getCharacter: () => Character;
    /**
     * Reports an edited character, which schedules an autosave.
     * `null` means the character was deleted and the modal should close.
     */
    onCharacterChange: (updatedCharacter: Character | null) => void;
    /**
     * Drops the pending (debounced) autosave.
     * A subpage must call it before deleting the character, or the timer could save the deleted character again.
     */
    cancelAutosave?: () => void;
};

/** Props of a subpage: the dialog context behind a getter, so a change of context stays reactive. */
export type TProps<T> = {
    context: () => T;
};
