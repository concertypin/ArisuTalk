import { derived } from "svelte/store";
import { selectedChatId, chatRooms, groupChats, openChats } from "./chat";
import { characters } from "./character";

export const chatType = derived(selectedChatId, ($selectedChatId) => {
  if (!$selectedChatId) return null;
  if ($selectedChatId.startsWith("group_")) return "group";
  if ($selectedChatId.startsWith("open_")) return "open";
  return "regular";
});

export const selectedChat = derived(
  [selectedChatId, chatRooms, groupChats, openChats],
  ([$selectedChatId, $chatRooms, $groupChats, $openChats]) => {
    if (!$selectedChatId) return null;

    if ($selectedChatId.startsWith("group_")) {
      return $groupChats[$selectedChatId] || null;
    }

    if ($selectedChatId.startsWith("open_")) {
      return $openChats[$selectedChatId] || null;
    }

    for (const characterId in $chatRooms) {
      const room = $chatRooms[characterId].find(
        (r) => r.id === $selectedChatId,
      );
      if (room) return room;
    }

    return null;
  },
);

export const selectedCharacter = derived(
  [selectedChat, characters],
  ([$selectedChat, $characters]) => {
    if (
      !$selectedChat ||
      $selectedChat.type === "group" ||
      $selectedChat.type === "open"
    ) {
      return null;
    }
    return $characters.find((c) => c.id === $selectedChat.characterId) || null;
  },
);
