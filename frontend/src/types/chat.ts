import type { Sticker } from "./sticker";

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
	sticker?: Sticker;
	stickerData?: { stickerName: string; [key: string]: unknown };
	imageUrl?: string;
	imageId?: string;
	[key: string]: unknown;
}

export interface MessagePart {
	content: string;
	delay?: number;
	sticker?: Sticker | null;
}

export interface ChatRoomSettings {
	[key: string]: unknown;
}

export interface GroupChatParticipantSettings {
	isActive: boolean;
	responseProbability: number;
	characterRole?: "normal" | "leader" | "quiet" | "active";
}

export interface GroupChatSettings extends ChatRoomSettings {
	responseFrequency: number;
	maxRespondingCharacters: number;
	responseDelay: number;
	participantSettings: Record<string, GroupChatParticipantSettings>;
}

export interface ChatRoom {
	id: string;
	characterId: string;
	name: string;
	createdAt: number;
	lastActivity: number;
	participantIds?: string[];
	settings?: ChatRoomSettings;
	currentParticipants?: string[];
	participantHistory?: { characterId: string; joinedAt: number }[];
	[key: string]: unknown;
}

export interface GroupChat {
	id: string;
	name: string;
	participantIds: string[];
	settings: GroupChatSettings;
	createdAt?: number;
	lastActivity?: number;
	[key: string]: unknown;
}

export interface DisplayCharacter {
	id: string | number;
	name: string;
	avatar: string | null;
	[key: string]: unknown;
}

export interface MessageGroupData {
	id: number | string;
	messages: Message[];
	isMe: boolean;
	showSenderInfo: boolean;
	character?: DisplayCharacter | null;
}
