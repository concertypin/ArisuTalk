export interface Message {
    id: number | string;
    sender: string;
    characterId?: string;
    content: string;
    time?: string;
    timestamp: number;
    isMe: boolean;
    isError?: boolean;
    type?: string;
    hasText?: boolean;
    sticker?: { name: string; [key: string]: any };
    stickerData?: { stickerName: string; [key: string]: any };
    imageUrl?: string;
    imageId?: string;
    [key: string]: any;
}

export interface ChatRoom {
    id: string;
    characterId: string;
    name: string;
    createdAt: number;
    lastActivity: number;
    participantIds?: string[];
    settings?: any;
    currentParticipants?: string[];
    [key: string]: any;
}
