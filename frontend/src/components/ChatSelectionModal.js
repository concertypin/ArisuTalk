import { t } from "../i18n.js";
import { renderAvatar } from "./Avatar.js";

/**
 * Renders the chat selection modal for a character with multiple chat rooms.
 * @param {object} app - The main application object.
 * @returns {string} The HTML string for the chat selection modal.
 */
export function renderChatSelectionModal(app) {
  const { character } = app.state.modal;
  const chatRooms = app.state.chatRooms[character.id] || [];

  // Sort chat rooms by the timestamp of their last message
  chatRooms.sort((a, b) => {
    const lastMessageA = app.state.messages[a.id]?.slice(-1)[0];
    const lastMessageB = app.state.messages[b.id]?.slice(-1)[0];
    const timeA = lastMessageA ? lastMessageA.id : a.createdAt || 0;
    const timeB = lastMessageB ? lastMessageB.id : b.createdAt || 0;
    return timeB - timeA; // Newest first
  });

  return `
    <div id="chat-selection-modal-backdrop" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" data-action="close-chat-selection">
      <div class="bg-gray-800 rounded-2xl p-6 w-full max-w-sm mx-4" data-modal-content>
        <div class="flex items-center mb-4">
          ${renderAvatar(character, "md")}
          <h3 class="text-lg font-semibold text-white ml-4">${character.name}</h3>
          <button id="modal-close" class="ml-auto p-2 rounded-full hover:bg-gray-700" data-action="close-chat-selection">
            <i data-lucide="x" class="w-5 h-5 text-gray-300"></i>
          </button>
        </div>
        <p class="text-sm text-gray-300 mb-4">${t("modal.selectChat.message")}</p>
        <div class="max-h-60 overflow-y-auto space-y-2 pr-2">
          ${chatRooms
            .map((chatRoom) => {
              const messages = app.state.messages[chatRoom.id] || [];
              const lastMessage = messages.slice(-1)[0];
              let lastMessageContent = t("sidebar.startNewChat");
              if (lastMessage) {
                if (lastMessage.type === "image") {
                  lastMessageContent = t("sidebar.imageSent");
                } else if (lastMessage.type === "sticker") {
                  lastMessageContent = t("sidebar.stickerSent");
                } else {
                  lastMessageContent = lastMessage.content;
                }
              }
              const unreadCount = app.state.unreadCounts[chatRoom.id] || 0;

              return `
              <div class="chat-room-item p-3 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors" data-action="select-chat" data-chat-room-id="${chatRoom.id}">
                <div class="flex justify-between items-center">
                    <div class="flex-1 min-w-0">
                        <p class="font-semibold text-white truncate">${chatRoom.name || t("sidebar.defaultChatName")}</p>
                        <p class="text-sm text-gray-400 truncate">${lastMessageContent}</p>
                    </div>
                    ${unreadCount > 0 ? `<span class="bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full leading-none ml-2">${unreadCount}</span>` : ""}
                </div>
              </div>
            `;
            })
            .join("")}
        </div>
        <button id="create-new-chat-room-modal" class="w-full mt-4 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
          <i data-lucide="plus-circle" class="w-5 h-5"></i>
          <span>${t("modal.selectChat.newChat")}</span>
        </button>
      </div>
    </div>
  `;
}
