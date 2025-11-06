import { writable } from "svelte/store";
import { persistentStore } from "./persistentStore";
import { defaultCharacters } from "../../defaults.js";

export const characters = persistentStore(
    "personaChat_characters_v16",
    defaultCharacters
);
export const userStickers = persistentStore("personaChat_userStickers_v16", []);

export const editingCharacter = writable(null);
export const expandedCharacterIds = writable(new Set());
export interface ImportedCharacterData {
    name: string;
    prompt: string;
    avatar?: string | null;
    appearance?: string;
    proactiveEnabled?: boolean;
    responseTime?: number;
    thinkingTime?: number;
    reactivity?: number;
    tone?: number;
    memories?: unknown[];
    stickers?: unknown[];
    naiSettings?: Record<string, unknown>;
    hypnosis?: Record<string, unknown>;
}

export interface PhonebookImportResult {
    character: ImportedCharacterData;
    sourceId: string;
}

export const phonebookImportResult = writable<PhonebookImportResult | null>(
    null
);

// Character State Management
export interface CharacterState {
    mood: number; // 0.0 ~ 1.0
    socialBattery: number; // 0.0 ~ 1.0
    energy: number; // 0.0 ~ 1.0
    personality: {
        extroversion: number; // 0.0 ~ 1.0
    };
    currentRooms: string[];
    lastActivity: number;
    affection?: number; // 0.0 ~ 1.0
    intimacy?: number; // 0.0 ~ 1.0
    trust?: number; // 0.0 ~ 1.0
    romantic_interest?: number; // 0.0 ~ 1.0
    messageCount?: number;
}

export const characterStateStore = persistentStore<
    Record<string, CharacterState>
>("personaChat_characterStates_v16", {});

export function initializeCharacterState(
    characterId: string,
    personality: { extroversion: number } = { extroversion: 0.5 }
) {
    characterStateStore.update((states) => {
        if (!states[characterId]) {
            states[characterId] = {
                mood: 0.8,
                socialBattery: 1.0,
                energy: 1.0,
                personality: personality,
                currentRooms: [],
                lastActivity: Date.now(),
            };
        }
        return states;
    });
}

export function updateCharacterState(
    characterId: string,
    newState: Partial<CharacterState>
) {
    characterStateStore.update((states) => {
        if (states[characterId]) {
            states[characterId] = {
                ...states[characterId],
                ...newState,
                lastActivity: Date.now(),
            };
        }
        return states;
    });
}
