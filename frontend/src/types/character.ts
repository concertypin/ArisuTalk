import type { SNSPost } from "./sns";
import type { Sticker } from "./sticker";

export type Media = {
    id: string;
    mimeType: string;
    dataUrl: string;
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
    hypnosis?: any;
    [key: string]: any;
};

export * from "./sticker";
export * from "./sns";
