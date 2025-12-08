import { writable } from "svelte/store";
import { persistentStore } from "./persistentStore";
import { defaultCharacters } from "../../defaults";

export const characters = persistentStore(
    "personaChat_characters_v16",
    defaultCharacters
);
import type { Character, Sticker, CharacterState } from "$types/character";

export const userStickers = persistentStore<Sticker[]>("personaChat_userStickers_v16", []);

export const editingCharacter = writable<Character|null>(null);
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
