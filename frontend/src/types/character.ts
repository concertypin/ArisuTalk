import type { SNSPost } from "./sns";
import type { Sticker } from "./sticker";

export type Media = {
    id: string;
    mimeType: string;
    dataUrl: string;
};

export type HypnosisSettings = {
    enabled?: boolean;
    sns_edit_access?: boolean;
    affection_override?: boolean;
    affection?: number;
    intimacy?: number;
    trust?: number;
    romantic_interest?: number;
    force_love_unlock?: boolean;
    sns_full_access?: boolean;
    secret_account_access?: boolean;
    [key: string]: any;
};

export type Character = {
    id: number | string;
    name: string;
    description?: string;
    prompt: string;
    avatar: string | null;
    responseTime?: string | number;
    thinkingTime?: string | number;
    reactivity?: string | number;
    tone?: string | number;
    memories?: string[];
    proactiveEnabled?: boolean;
    messageCountSinceLastSummary?: number;
    media?: Media[];
    stickers?: Sticker[];
    naiSettings?: Record<string, any>;
    isRandom?: boolean;
    snsPosts?: SNSPost[];
    hypnosis?: HypnosisSettings;
    [key: string]: any;
};

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

export * from "./sticker";
export * from "./sns";
