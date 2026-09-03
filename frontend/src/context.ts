import { createContext } from "svelte";
import type { Character } from "@arisutalk/character-spec/v0/Character";

export type AppContext = {
    appSettingsOpen: boolean;
    characterSettingsOpen: boolean;
    editingCharacter: Character | null;
};

export const [getAppContext, setAppContext] = createContext<AppContext>();
