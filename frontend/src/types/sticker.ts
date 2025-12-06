export type Sticker = {
    id: string;
    name: string;
    emotion?: string;
    /** Base64 data of the sticker (used in some contexts) */
    data?: string;
    /** URL or Base64 data of the sticker (used in other contexts) */
    dataUrl?: string;
    /** MIME type of the sticker */
    type?: string;
    createdAt?: number;
    size?: number;
};

export type StickerEmotion = string | { emotion: string; title?: string };

export type StickerGenerationProgress = {
    isVisible: boolean;
    status: "generating" | "completed" | "error" | "waiting";
    character?: { name?: string };
    currentIndex: number;
    totalCount: number;
    currentEmotion?: StickerEmotion;
    error?: string;
    emotions: StickerEmotion[];
    generatedStickers: Sticker[];
    failedEmotions?: string[];
    waitTime?: number;
    canRetry?: boolean;
};
