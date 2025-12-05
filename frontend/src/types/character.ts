export interface Character {
    name: string;
    description: string;
    stickers?: { id: string; name: string }[];
    memories?: string[];
    media?: { id: string; mimeType: string; dataUrl: string }[];
    isRandom?: boolean;
    hypnosis?: CharacterHyposis;
}

export type CharacterHyposis = {
    enabled: boolean;
    affection: number;
    intimacy: number;
    trust: number;
    romantic_interest: number;
    force_love_unlock: boolean;
    sns_full_access: boolean;
    secret_account_access: boolean;
    sns_edit_access: boolean;
    affection_override: boolean;
};
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
} // Character State Management

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
