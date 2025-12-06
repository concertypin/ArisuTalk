import type { Sticker } from "./sticker";

export interface Message {
    id: number | string;
    sender: string | any;
    characterId?: string;
    content: string;
    time?: string;
    timestamp: number;
    isMe: boolean;
    isError?: boolean;
    type?: string;
    hasText?: boolean;
    sticker?: Sticker;
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

export interface GroupChatParticipantSettings {
    isActive: boolean;
    responseProbability: number;
    characterRole: "normal" | "leader" | "quiet" | "active";
}

export interface GroupChatSettings {
    responseFrequency?: number;
    maxRespondingCharacters?: number;
    responseDelay?: number;
    participantSettings?: Record<string, GroupChatParticipantSettings>;
}

export interface GroupChat {
    id: string;
    name: string;
    participantIds: string[];
    settings: GroupChatSettings;
    createdAt?: number;
    lastActivity?: number;
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
