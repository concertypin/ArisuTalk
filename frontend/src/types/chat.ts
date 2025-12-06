export interface Message {
    id: number | string;
    sender: string | any; // Updated to any because it can be an object in runtime (e.g. Character object)
    characterId?: string;
    content: string;
    time?: string;
    timestamp: number;
    isMe: boolean;
    isError?: boolean;
    type?: string;
    hasText?: boolean;
    sticker?: { name: string; data?: string; stickerName?: string; [key: string]: any };
    stickerData?: { stickerName: string; [key: string]: any };
    imageUrl?: string;
    imageId?: string;
    [key: string]: any;
}

export interface MessagePart {
    content: string;
    delay?: number;
    sticker?: any;
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

export interface DisplayCharacter {
    id: string | number;
    name: string;
    avatar: string | null;
    [key: string]: any;
}

export interface MessageGroupData {
    id: number | string;
    messages: Message[];
    isMe: boolean;
    showSenderInfo: boolean;
    character?: DisplayCharacter | null;
}
