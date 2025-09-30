import { writable } from "svelte/store";
import { persistentStore } from "./persistentStore";
import { t } from "../../i18n";

export interface Message {
  id: number;
  sender: string;
  characterId?: string;
  content: string;
  time: string;
  timestamp: number;
  isMe: boolean;
  isError: boolean;
  type: string;
  hasText?: boolean;
  sticker?: any;
  imageUrl?: string;
}

export interface MessagesStore {
  [chatId: string]: Message[];
}

export const chatRooms = persistentStore<Record<string, any[]>>(
  "personaChat_chatRooms_v16",
  {},
);
export const groupChats = persistentStore<Record<string, any>>(
  "personaChat_groupChats_v16",
  {},
);
export const openChats = persistentStore<Record<string, any>>(
  "personaChat_openChats_v16",
  {},
);
export const messages = persistentStore<MessagesStore>(
  "personaChat_messages_v16",
  {},
);
export const unreadCounts = persistentStore<Record<string, number>>(
  "personaChat_unreadCounts_v16",
  {},
);

// Forcing the landing page to be visible on refresh.
export const selectedChatId = writable(null);

// Non-persistent stores
export const editingMessageId = writable(null);
export const editingChatRoomId = writable(null);
export const editingGroupChat = writable(null);

export const isWaitingForResponse = writable(false);
export const typingCharacterId = writable(null);

export const searchQuery = writable("");
export const imageToSend = writable(null);
export const stickerToSend = writable(null);
export const currentMessage = writable("");

export const virtualStream = writable({
  isStreaming: false,
  chatId: null,
  characterId: null,
  messages: [],
  isTyping: false,
});

export function createNewChatRoom(characterId) {
  const newChatRoomId = `${characterId}_${Date.now()}`;
  const newChatRoom = {
    id: newChatRoomId,
    characterId: characterId,
    name: t("ui.newChatName"),
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };

  chatRooms.update((rooms) => {
    const characterChatRooms = [...(rooms[characterId] || []), newChatRoom];
    return { ...rooms, [characterId]: characterChatRooms };
  });

  messages.update((msgs) => ({ ...msgs, [newChatRoomId]: [] }));

  return newChatRoomId;
}
