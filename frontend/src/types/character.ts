export interface SNSPost {
    id: string;
    type: string;
    content: string;
    timestamp: string;
    likes: number;
    comments: number;
    affection_state: {
        affection: number;
        intimacy: number;
        trust: number;
        romantic_interest: number;
    };
    access_level: string;
    importance: number;
    tags: string[];
    reason: string;
}

export interface Sticker {
    id: string;
    name: string;
    emotion?: string;
    [key: string]: any;
}

export interface Character {
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
    media?: { id: string; mimeType: string; dataUrl: string }[];
    stickers?: Sticker[];
    naiSettings?: Record<string, any>;
    isRandom?: boolean;
    snsPosts?: SNSPost[];
    hypnosis?: any;
    [key: string]: any;
}
