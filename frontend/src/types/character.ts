export interface Character {
    name: string;
    description: string;
    stickers?: { id: string; name: string }[];
    memories?: string[];
    media?: { id: string; mimeType: string; dataUrl: string }[];
    isRandom?: boolean;
}
