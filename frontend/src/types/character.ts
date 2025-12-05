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
    stickers?: { id: string; name: string; emotion?: string; [key: string]: any }[];
    naiSettings?: Record<string, any>;
    isRandom?: boolean;
    snsPosts?: any[];
    hypnosis?: any;
    [key: string]: any;
}
