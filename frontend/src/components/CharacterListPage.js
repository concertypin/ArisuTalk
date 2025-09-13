import { t } from "../i18n.js";
import { renderAvatar } from "./Avatar.js";
import { formatTimestamp } from "../utils.js";

/**
 * Renders mobile character action buttons (SNS, Character Settings).
 * @param {object} app - The main application object.
 * @param {object} char - The character object.
 * @returns {string} The HTML string for the action buttons.
 */
function renderMobileCharacterButtons(app, char) {
  return `
    <div class="flex items-center gap-1">
      <!-- SNS 버튼 -->
      <button class="mobile-character-sns-btn p-1.5 hover:bg-gray-700 rounded-full transition-colors z-20" 
              data-character-id="${char.id}" 
              title="${t('characterModal.openSNS')}">
        <i data-lucide="instagram" class="w-4 h-4 text-gray-300 pointer-events-none"></i>
      </button>
      
      <!-- 캐릭터 설정 버튼 -->
      <button class="mobile-character-edit-btn p-1.5 hover:bg-gray-700 rounded-full transition-colors z-20" 
              data-character-id="${char.id}" 
              title="${t('sidebar.editCharacter')}">
        <i data-lucide="settings" class="w-4 h-4 text-gray-300 pointer-events-none"></i>
      </button>
    </div>
  `;
}

/**
 * Renders mobile affection display for a character.
 * @param {object} app - The main application object.
 * @param {object} char - The character object.
 * @returns {string} The HTML string for affection display.
 */
function renderMobileAffectionDisplay(app, char) {
  const currentState = char.currentState || {
    affection: 0.0,
    intimacy: 0.0,
    trust: 0.0,
    romantic_interest: 0.0
  };

  const getAffectionColor = (value) => {
    if (value >= 0.8) return "text-pink-400";
    if (value >= 0.6) return "text-blue-400";
    if (value >= 0.4) return "text-green-400";
    if (value >= 0.2) return "text-yellow-400";
    return "text-gray-400";
  };

  return `
    <div class="flex items-center gap-3 text-xs mb-1">
      <span class="${getAffectionColor(currentState.affection)}" title="${t('sns.affection')}">
        ❤️ ${Math.round(currentState.affection * 100)}%
      </span>
      <span class="${getAffectionColor(currentState.intimacy)}" title="${t('sns.intimacy')}">
        🤝 ${Math.round(currentState.intimacy * 100)}%
      </span>
      <span class="${getAffectionColor(currentState.trust)}" title="${t('sns.trust')}">
        🛡️ ${Math.round(currentState.trust * 100)}%
      </span>
      <span class="${getAffectionColor(currentState.romantic_interest)}" title="${t('sns.romanticInterest')}">
        💕 ${Math.round(currentState.romantic_interest * 100)}%
      </span>
    </div>
  `;
}

/**
 * Renders a single character item for the character list page.
 * @param {object} app - The main application object.
 * @param {object} char - The character object to render.
 * @returns {string} The HTML string for the character item.
 */
export function renderCharacterItem(app, char) {
  // Simplified version of the character item for the list page.
  // It won't have chat rooms or expansion logic, just a direct link to the chat.

  // Find the most recent message across all chat rooms for this character to display.
  const chatRooms = app.state.chatRooms[char.id] || [];
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
    } else if (lastMessage.type === "sticker") {
      lastMessageContent = t("sidebar.stickerSent");
    } else {
      lastMessageContent = lastMessage.content;
    }
  }

  // The first chat room is selected by default when clicking the character.
  const primaryChatRoom = chatRooms[0];

  return `
    <div class="character-list-item p-3 rounded-full cursor-pointer hover:bg-gray-800/60 transition-colors duration-200" 
         data-character-id="${char.id}">
        <div class="flex items-center space-x-5">
            <div class="character-avatar relative">
                ${renderAvatar(char, "lg")}
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center mb-1">
                    <h3 class="font-semibold text-white text-lg truncate">${char.name || t("sidebar.unknownCharacter")}</h3>
                    <div class="flex items-center gap-2 shrink-0 ml-auto">
                        ${renderMobileCharacterButtons(app, char)}
                        ${totalUnreadCount > 0 ? `<span class="bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full leading-none">${totalUnreadCount}</span>` : ""}
                    </div>
                </div>
                ${renderMobileAffectionDisplay(app, char)}
                <div class="flex justify-between items-start">
                    <p class="text-base line-clamp-2 ${lastMessage?.isError ? "text-red-400" : "text-gray-400"} pr-4">${lastMessageContent}</p>
                    <span class="text-sm text-gray-500 shrink-0">${formatTimestamp(lastMessage?.id)}</span>
                </div>
            </div>
        </div>
    </div>
  `;
}

/**
 * Renders the list of characters into a container.
 * @param {object} app - The main application object.
 * @param {HTMLElement} container - The container element to render the list into.
 */
export function renderCharacterList(app, container) {
  const filteredCharacters = app.state.characters.filter((char) =>
    char.name.toLowerCase().includes(app.state.searchQuery.toLowerCase()),
  );
  container.innerHTML = filteredCharacters
    .map((char) => renderCharacterItem(app, char))
    .join("");
}

/**
 * Renders the entire character list page for mobile view.
 * @param {object} app - The main application object.
 */
export function renderCharacterListPage(app) {
  const container = document.getElementById("character-list-page-container");
  if (!container) return;

  container.innerHTML = `
    <header class="px-6 py-4  sticky top-0 bg-gray-950 z-10">
        <div class="flex items-center justify-between">
            <h1 class="text-3xl text-white">${t("sidebar.title")}</h1>
            <div class="flex items-center gap-2">
                <button id="toggle-mobile-search-btn" class="p-3 rounded-full hover:bg-gray-700 transition-colors">
                    <i data-lucide="search" class="w-6 h-6 text-gray-100"></i>
                </button>
                <button id="open-settings-modal-mobile" class="p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
                    <i data-lucide="settings" class="w-6 h-6 text-gray-100"></i>
                </button>
            </div>
        </div>
    </header>
    <div class="flex-1 overflow-y-auto p-4 bg-gray-900 rounded-t-[3rem]" style="scroll-behavior: smooth;">
        <div id="character-list-items" class="character-list space-y-4">
            <!-- Character items will be rendered here by renderCharacterList -->
        </div>
    </div>

    <!-- FAB Menu (conditionally rendered) -->
    ${
      app.state.showFabMenu
        ? `
    <div class="fab-menu fixed bottom-24 right-6 w-48 bg-gray-700 rounded-2xl shadow-lg z-20 animate-fab-menu-in">
        <button id="open-new-character-modal-mobile" class="w-full flex items-center gap-3 px-4 py-3 text-white text-sm text-left rounded-2xl hover:bg-gray-600">
            <i data-lucide="user-plus" class="w-5 h-5"></i>
            <span>${t("sidebar.invite")}</span>
        </button>
    </div>
    `
        : ""
    }

    <!-- FAB Toggle -->
    <button id="fab-menu-toggle" class="fixed bottom-6 right-6 bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all duration-200 transform-gpu hover:scale-110 active:scale-95 z-30">
        <i data-lucide="${app.state.showFabMenu ? "x" : "plus"}" class="w-8 h-8 transition-transform duration-300 ease-in-out ${app.state.showFabMenu ? "rotate-45" : ""}"></i>
    </button>
  `;

  const listContainer = container.querySelector("#character-list-items");
  renderCharacterList(app, listContainer);

  listContainer.addEventListener("click", (e) => {
    const characterItem = e.target.closest(".character-list-item");
    if (characterItem) {
      const characterId = characterItem.dataset.characterId;
      if (characterId) {
        app.handleCharacterSelect(characterId);
      }
    }
  });
}
