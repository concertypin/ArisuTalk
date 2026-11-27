import { createContext } from "svelte";
import type { Character } from "@arisutalk/character-spec/v0/Character";

/** App-wide UI state shared through Svelte context: which modals are open and what they edit. */
export type AppContext = {
    /** Whether the app settings modal is open. */
    appSettingsOpen: boolean;
    /** Whether the character settings modal is open. */
    characterSettingsOpen: boolean;
    /** The character the settings modal edits, or `null` when none is selected. */
    editingCharacter: Character | null;
};

/**
 * `getAppContext` reads the {@link AppContext} provided by an ancestor and throws when there is none.
 * `setAppContext` provides it to the descendants of the calling component.
 */
export const [getAppContext, setAppContext] = createContext<AppContext>();
