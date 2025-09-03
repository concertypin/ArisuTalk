import { t } from "../i18n.js";
import { formatTimestamp } from "../utils.js";

import { renderAvatar } from "./Avatar.js";
import {
  renderGroupChatList,
  renderOpenChatList,
  renderEditGroupChatModal,
} from "./GroupChat.js";

/**
 * Calculates and applies the correct horizontal position for the tree-like connector lines.
 * It uses a CSS variable to dynamically style the lines based on the avatar's position.
 * @param {number | string} characterId - The ID of the character whose tree line needs updating.
 */
function updateTreeLine(characterId) {
  const characterGroup = document.querySelector(
    `.character-group[data-id='${characterId}']`,
  );
  if (!characterGroup) return;

  const avatar = characterGroup.querySelector(".character-avatar");

  if (!avatar) {
    characterGroup.style.removeProperty("--tree-trunk-left");
    return;
  }

  const groupRect = characterGroup.getBoundingClientRect();
  const avatarRect = avatar.getBoundingClientRect();

  // Alignment: Calculate the avatar center and apply a small manual correction based on screenshot visuals.
  const alignmentCorrection = -2; // Nudge 2px to the left
  const trunkLeft =
    avatarRect.left -
    groupRect.left +
    avatarRect.width / 2 +
    alignmentCorrection;

  characterGroup.style.setProperty("--tree-trunk-left", `${trunkLeft}px`);
}

function renderCharacterItem(app, char) {
  const chatRooms = app.state.chatRooms[char.id] || [];
  const isExpanded = app.state.expandedCharacterIds.has(Number(char.id));

  let lastMessage = null;
  let totalUnreadCount = 0;

  chatRooms.forEach((chatRoom) => {
    const messages = app.state.messages[chatRoom.id] || [];
    const chatRoomLastMessage = messages.slice(-1)[0];
    if (
      chatRoomLastMessage &&
      (!lastMessage || chatRoomLastMessage.id > lastMessage.id)
    ) {
      lastMessage = chatRoomLastMessage;
    }
    totalUnreadCount += app.state.unreadCounts[chatRoom.id] || 0;
  });

  let lastMessageContent = t("sidebar.startNewChat");
  if (lastMessage) {
    if (lastMessage.type === "image") {
      lastMessageContent = t("sidebar.imageSent");
    } else {
      lastMessageContent = lastMessage.content;
    }
  }

  return `
        <div class="character-group ${isExpanded ? "is-expanded" : ""}" data-id="${char.id}">
            <div onclick="window.personaApp.toggleCharacterExpansion(${
              char.id
            })" class="character-header group p-3 md:p-4 rounded-xl cursor-pointer transition-all duration-200 relative hover:bg-gray-800/50">
                <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1 z-10">
                    <button onclick="window.personaApp.createNewChatRoomForCharacter(${
                      char.id
                    }); event.stopPropagation();" class="p-1 bg-gray-700 hover:bg-blue-600 rounded text-gray-300 hover:text-white transition-colors" title="${t(
                      "sidebar.newChatRoom",
                    )}">
                        <i data-lucide="plus" class="w-3 h-3"></i>
                    </button>
                    <button data-id="${
                      char.id
                    }" class="edit-character-btn p-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 hover:text-white transition-colors" title="${t(
                      "common.edit",
                    )}">
                        <i data-lucide="edit-3" class="w-3 h-3"></i>
                    </button>
                    <button data-id="${
                      char.id
                    }" class="delete-character-btn p-1 bg-gray-700 hover:bg-red-600 rounded text-gray-300 hover:text-white transition-colors" title="${t(
                      "common.delete",
                    )}">
                        <i data-lucide="trash-2" class="w-3 h-3"></i>
                    </button>
                </div>
                <div class="flex items-center space-x-4 md:space-x-5">
                    <div class="character-avatar relative">
                         ${renderAvatar(char, "md")}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1">
                            <h3 class="font-semibold text-white text-sm truncate">${
                              char.name || t("sidebar.unknownCharacter")
                            }</h3>
                            <div class="flex items-center gap-2">
                                ${
                                  totalUnreadCount > 0
                                    ? `<span class="bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full leading-none">${totalUnreadCount}</span>`
                                    : ""
                                }
                                <span class="text-sm text-gray-500 shrink-0">${formatTimestamp(
                                  lastMessage?.id,
                                )}</span>
                                <i data-lucide="chevron-${
                                  isExpanded ? "down" : "right"
                                }" class="w-4 h-4 text-gray-400"></i>
                            </div>
                        </div>
                        <p class="text-xs md:text-sm truncate ${
                          lastMessage?.isError
                            ? "text-red-400"
                            : "text-gray-400"
                        }">${lastMessageContent}</p>
                        <p class="text-xs text-gray-500 mt-1">${
                          chatRooms.length
                        }${t("sidebar.chatRoomCount")}</p>
                    </div>
                </div>
            </div>
            ${
              isExpanded
                ? `
                <div class="ml-2 space-y-1 pb-2 chat-room-list">
                    ${chatRooms
                      .map((chatRoom) => renderChatRoomItem(app, chatRoom))
                      .join("")}
                </div>
            `
                : ""
            }
        </div>
    `;
}

function renderChatRoomItem(app, chatRoom) {
  const messages = app.state.messages[chatRoom.id] || [];
  const lastMessage = messages.slice(-1)[0];
  const isSelected = app.state.selectedChatId === chatRoom.id;
  const isEditing = app.state.editingChatRoomId === chatRoom.id;
  const unreadCount = app.state.unreadCounts[chatRoom.id] || 0;

  let lastMessageContent = t("sidebar.startChatting");
  if (lastMessage) {
    if (lastMessage.type === "image") {
      lastMessageContent = t("sidebar.imageSent");
    } else if (lastMessage.type === "sticker") {
      lastMessageContent = t("sidebar.stickerSent");
    } else {
      lastMessageContent = lastMessage.content;
    }
  }

  const nameElement = isEditing
    ? `<input type="text"
                 id="chat-room-name-input-${chatRoom.id}"
                 value="${chatRoom.name}"
                 class="flex-grow bg-gray-600 text-white rounded px-1 py-0 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                 onkeydown="window.personaApp.handleChatRoomNameKeydown(event, '${chatRoom.id}')"
                 onclick="event.stopPropagation()"
                 autofocus>`
    : `<h4 class="text-sm font-medium text-white truncate">${chatRoom.name}</h4>`;

  const actionButtons = isEditing
    ? `<button data-chat-room-id="${
        chatRoom.id
      }" class="confirm-rename-btn p-1 bg-green-600 hover:bg-green-700 rounded text-white" title="${t(
        "common.confirm",
      )}">
               <i data-lucide="check" class="w-3 h-3"></i>
           </button>`
    : `<button data-chat-room-id="${
        chatRoom.id
      }" class="rename-chat-room-btn p-1 bg-gray-700 hover:bg-blue-600 rounded text-white" title="${t(
        "sidebar.rename",
      )}">
               <i data-lucide="edit-3" class="w-3 h-3"></i>
           </button>
           <button data-chat-room-id="${
             chatRoom.id
           }" class="delete-chat-room-btn p-1 bg-red-600 hover:bg-red-700 rounded text-white" title="${t(
             "sidebar.deleteChatRoom",
           )}">
               <i data-lucide="trash-2" class="w-3 h-3"></i>
           </button>`;

  const metaElement = isEditing
    ? ""
    : `<div class="flex items-center gap-2 shrink-0">
            ${
              unreadCount > 0
                ? `<span class="bg-red-500 text-white text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full leading-none">${unreadCount}</span>`
                : ""
            }
            <span class="text-xs text-gray-400 shrink-0">${
              lastMessage?.time || ""
            }</span>
           </div>`;

  return `
    <div class="chat-room-list-item-wrapper">
        <div onclick="${isEditing ? "event.stopPropagation()" : `window.personaApp.selectChatRoom('${chatRoom.id}')`}" class="chat-room-item group p-2 rounded-lg cursor-pointer transition-all duration-200 w-full ${isSelected ? "bg-blue-600" : "hover:bg-gray-700"}">
            <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1 gap-2">
                        ${nameElement}
                        ${metaElement}
                    </div>
                    <p class="text-xs text-gray-400 truncate">${lastMessageContent}</p>
                </div>
            </div>
            <div class="mt-1 flex justify-end items-center space-x-1 ${isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-200">
                ${actionButtons}
            </div>
        </div>
    </div>
    `;
}

/**
 * Renders the entire sidebar, including the header, search, character list, and group/open chats.
 * @param {object} app - The main application object.
 */
export function renderSidebar(app) {
  const appElement = document.getElementById("app");
  if (appElement) {
    if (app.state.sidebarCollapsed) {
      appElement.classList.add("sidebar-collapsed");
    } else {
      appElement.classList.remove("sidebar-collapsed");
    }
  }

  const sidebarContent = document.getElementById("sidebar-content");
  const desktopToggle = document.getElementById("desktop-sidebar-toggle");

  if (desktopToggle) {
    desktopToggle.innerHTML = app.state.sidebarCollapsed
      ? `<i data-lucide="chevron-right" class="w-5 h-5 text-gray-300"></i>`
      : `<i data-lucide="chevron-left" class="w-5 h-5 text-gray-300"></i>`;
  }

  const filteredCharacters = app.state.characters.filter((char) =>
    char.name.toLowerCase().includes(app.state.searchQuery.toLowerCase()),
  );

  sidebarContent.innerHTML = `
        <header class="p-4 md:p-6 border-b border-gray-800">
            <div class="flex items-center justify-between mb-4 md:mb-6">
                <div>
                    <h1 class="text-xl md:text-2xl font-bold text-white mb-1">${t(
                      "sidebar.title",
                    )}</h1>
                    <p class="text-xs md:text-sm text-gray-400">${t(
                      "sidebar.description",
                    )}</p>
                </div>
                <button id="open-settings-modal" class="p-2 md:p-2.5 rounded-full bg-gray-800 hover:bg-gray-700 transition-all duration-200">
                    <i data-lucide="settings" class="w-5 h-5 text-gray-300"></i>
                </button>
            </div>
            <div class="relative">
                <i data-lucide="bot" class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4"></i>
                <input id="search-input" type="text" placeholder="${t(
                  "sidebar.searchPlaceholder",
                )}" value="${
                  app.state.searchQuery
                }" class="w-full pl-11 pr-4 py-2 md:py-3 bg-gray-800 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/30 focus:bg-gray-750 transition-all duration-200 text-sm placeholder-gray-500" />
            </div>
        </header>
        <div class="flex-1 overflow-y-auto">
            <div class="p-4">
                <button id="open-new-character-modal" class="w-full flex items-center justify-center py-3 md:py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg text-sm">
                    <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                    ${t("sidebar.invite")}
                </button>
            </div>
            <div class="space-y-1 px-3 pb-4">
                ${renderGroupChatList(app)}
                ${renderOpenChatList(app)}
                ${filteredCharacters
                  .map((char) => renderCharacterItem(app, char))
                  .join("")}
            </div>
        </div>
    `;

  // After rendering, update the tree lines for all expanded characters
  requestAnimationFrame(() => {
    app.state.expandedCharacterIds.forEach((id) => {
      updateTreeLine(id);
    });
  });
}
