import { renderSidebar } from "./components/Sidebar.js";
import {
  renderMainChat,
  setupMainChatEventListeners,
} from "./components/MainChat.js";
import { renderSettingsUI } from "./components/SettingsRouter.js";
import {
  renderSnapshotList,
  setupSettingsModalEventListeners,
} from "./components/MobileSettingsModal.js";
import { setupDesktopSettingsEventListeners } from "./components/DesktopSettingsUI.js";
import { getCurrentSettingsUIMode } from "./components/SettingsRouter.js";
import { renderCharacterModal } from "./components/CharacterModal.js";
import { renderPromptModal } from "./components/PromptModal.js";
import { renderConfirmationModal } from "./components/ConfirmationModal.js";
import {
  renderCreateGroupChatModal,
  renderCreateOpenChatModal,
  renderEditGroupChatModal,
} from "./components/GroupChat.js";
import {
  renderDebugLogsModal,
  setupDebugLogsModalEventListeners,
} from "./components/DebugLogsModal.js";

function renderModals(app) {
  const container = document.getElementById("modal-container");
  let html = "";
  if (app.state.showSettingsModal) html += renderSettingsUI(app);
  if (app.state.showCharacterModal) html += renderCharacterModal(app);
  if (app.state.showPromptModal) html += renderPromptModal(app);
  if (app.state.showCreateGroupChatModal)
    html += renderCreateGroupChatModal(app);
  if (app.state.showCreateOpenChatModal) html += renderCreateOpenChatModal(app);
  if (app.state.showEditGroupChatModal) html += renderEditGroupChatModal(app);
  if (app.state.showDebugLogsModal) html += renderDebugLogsModal(app.state);
  if (app.state.modal.isOpen) html += renderConfirmationModal(app);
  container.innerHTML = html;

  // Setup event listeners for modals after DOM update
  if (app.state.showDebugLogsModal) {
    setupDebugLogsModalEventListeners();
  }
  if (app.state.showSettingsModal) {
    const uiMode = getCurrentSettingsUIMode(app);
    if (uiMode === "desktop") {
      // DOM이 완전히 업데이트된 후 이벤트 리스너 설정
      requestAnimationFrame(() => {
        setupDesktopSettingsEventListeners(app);
      });
    } else {
      setupSettingsModalEventListeners();
    }
  }
}

function updateSnapshotList(app) {
  const container = document.getElementById("snapshots-list");
  if (container) {
    container.innerHTML = renderSnapshotList(app);
    lucide.createIcons();
  }
}

// --- MAIN RENDER ORCHESTRATOR ---

export function render(app) {
  const oldState = app.oldState || {};
  const newState = app.state;
  const isFirstRender = !app.oldState;

  // Conditionally render the sidebar to minimize DOM updates
  if (isFirstRender || shouldUpdateSidebar(oldState, newState)) {
    const sidebarScrollContainer = document.querySelector(
      "#sidebar-content > .overflow-y-auto",
    );
    const scrollPosition = sidebarScrollContainer
      ? sidebarScrollContainer.scrollTop
      : 0;

    renderSidebar(app);

    const newSidebarScrollContainer = document.querySelector(
      "#sidebar-content > .overflow-y-auto",
    );
    if (newSidebarScrollContainer) {
      newSidebarScrollContainer.scrollTop = scrollPosition;
    }
  }

  // Conditionally render the main chat to minimize DOM updates
  if (isFirstRender || shouldUpdateMainChat(oldState, newState)) {
    // 재렌더링 전에 입력창 값과 스크롤 위치 보존
    const messageInput = document.getElementById("new-message-input");
    const inputValue = messageInput ? messageInput.value : "";
    const inputHeight = messageInput ? messageInput.style.height : "auto";

    const messagesContainer = document.getElementById("messages-container");
    const scrollPosition = messagesContainer ? messagesContainer.scrollTop : 0;

    renderMainChat(app);
    setupMainChatEventListeners();
    setupConditionalBlur();

    // 재렌더링 후 스크롤 위치 복원
    const newMessagesContainer = document.getElementById("messages-container");
    if (newMessagesContainer) {
      newMessagesContainer.scrollTop = scrollPosition;
    }

    // 재렌더링 후 입력창 값 복원
    const newMessageInput = document.getElementById("new-message-input");
    if (newMessageInput && inputValue) {
      newMessageInput.value = inputValue;
      newMessageInput.style.height = inputHeight;

      // 전송 버튼 상태도 업데이트
      const sendButton = document.getElementById("send-message-btn");
      if (sendButton) {
        const hasText = inputValue.trim() !== "";
        const hasImage = !!app.state.imageToSend;
        sendButton.disabled =
          (!hasText && !hasImage) || app.state.isWaitingForResponse;
      }
    }
  }

  // showInputOptions 상태 변화 시 입력 옵션 영역만 업데이트
  if (
    !isFirstRender &&
    oldState.showInputOptions !== newState.showInputOptions
  ) {
    updateInputOptions(app);
  }

  // Conditionally render modals to minimize DOM updates
  if (isFirstRender || shouldUpdateModals(oldState, newState)) {
    const settingsContent = document.getElementById("settings-modal-content");
    const scrollPosition = settingsContent ? settingsContent.scrollTop : 0;

    renderModals(app);

    const newSettingsContent = document.getElementById(
      "settings-modal-content",
    );
    if (newSettingsContent) {
      newSettingsContent.scrollTop = scrollPosition;
    }
  }

  lucide.createIcons();
}

// --- RENDER HELPER FUNCTIONS ---

function updateInputOptions(app) {
  const inputAreaContainer = document.querySelector(".input-area-container");
  if (!inputAreaContainer) return;

  const existingOptionsPanel = inputAreaContainer.querySelector(
    ".absolute.bottom-full",
  );

  if (app.state.showInputOptions) {
    // 옵션 패널이 없으면 추가
    if (!existingOptionsPanel) {
      const optionsHtml = `
        <div class="absolute bottom-full left-0 mb-2 w-48 bg-gray-700 rounded-xl shadow-lg p-2 animate-fadeIn">
          <button id="open-image-upload" class="w-full flex items-center gap-3 px-3 py-2 text-sm text-left rounded-lg hover:bg-gray-600">
            <i data-lucide="image" class="w-4 h-4"></i> 사진 업로드
          </button>
        </div>
      `;
      inputAreaContainer.insertAdjacentHTML("afterbegin", optionsHtml);
      if (window.lucide) window.lucide.createIcons();
    }
  } else {
    // 옵션 패널이 있으면 제거
    if (existingOptionsPanel) {
      existingOptionsPanel.remove();
    }
  }
}

// --- RENDER HELPER FUNCTIONS ---

function shouldUpdateSidebar(oldState, newState) {
  // This function checks if any state related to the sidebar has changed
  return (
    oldState.sidebarCollapsed !== newState.sidebarCollapsed ||
    oldState.searchQuery !== newState.searchQuery ||
    JSON.stringify(Array.from(oldState.expandedCharacterIds || [])) !==
      JSON.stringify(Array.from(newState.expandedCharacterIds || [])) ||
    oldState.editingChatRoomId !== newState.editingChatRoomId ||
    JSON.stringify(oldState.characters) !==
      JSON.stringify(newState.characters) ||
    oldState.selectedChatId !== newState.selectedChatId ||
    JSON.stringify(oldState.unreadCounts) !==
      JSON.stringify(newState.unreadCounts) ||
    JSON.stringify(oldState.messages) !== JSON.stringify(newState.messages) ||
    JSON.stringify(oldState.chatRooms) !== JSON.stringify(newState.chatRooms) ||
    JSON.stringify(oldState.groupChats) !==
      JSON.stringify(newState.groupChats) ||
    JSON.stringify(oldState.openChats) !== JSON.stringify(newState.openChats)
  );
}

function shouldUpdateMainChat(oldState, newState) {
  // This function checks if any state related to the main chat has changed
  return (
    oldState.selectedChatId !== newState.selectedChatId ||
    oldState.editingMessageId !== newState.editingMessageId ||
    JSON.stringify(oldState.messages) !== JSON.stringify(newState.messages) ||
    oldState.typingCharacterId !== newState.typingCharacterId ||
    oldState.isWaitingForResponse !== newState.isWaitingForResponse ||
    oldState.imageToSend !== newState.imageToSend ||
    oldState.showUserStickerPanel !== newState.showUserStickerPanel ||
    oldState.stickerToSend !== newState.stickerToSend ||
    JSON.stringify(oldState.userStickers) !==
      JSON.stringify(newState.userStickers) ||
    JSON.stringify([...oldState.expandedStickers]) !==
      JSON.stringify([...newState.expandedStickers]) ||
    // 그룹채팅/오픈채팅 관련 상태 변화
    JSON.stringify(oldState.groupChats) !==
      JSON.stringify(newState.groupChats) ||
    JSON.stringify(oldState.openChats) !== JSON.stringify(newState.openChats)
  );
}

function shouldUpdateModals(oldState, newState) {
  // This function checks if any state related to modals has changed

  // If the settings modal is open, we don't re-render it just for settings changes.
  // This prevents the modal from resetting while the user is typing in input fields.
  if (newState.showSettingsModal && oldState.showSettingsModal) {
    // We need to check for specific state changes that require a re-render
    // even when the settings modal is open.
    return (
      JSON.stringify(oldState.settingsSnapshots) !==
        JSON.stringify(newState.settingsSnapshots) ||
      oldState.settings.model !== newState.settings.model ||
      oldState.showPromptModal !== newState.showPromptModal ||
      JSON.stringify(oldState.modal) !== JSON.stringify(newState.modal) ||
      JSON.stringify(oldState.openSettingsSections) !==
        JSON.stringify(newState.openSettingsSections) ||
      oldState.enableDebugLogs !== newState.enableDebugLogs ||
      JSON.stringify(oldState.debugLogs) !==
        JSON.stringify(newState.debugLogs) ||
      // 데스크톱 설정 UI의 활성 패널 변경 감지
      oldState.ui?.desktopSettings?.activePanel !==
        newState.ui?.desktopSettings?.activePanel ||
      // 설정 UI 모드 변경 감지
      oldState.ui?.settingsUIMode !== newState.ui?.settingsUIMode
    );
  }

  return (
    oldState.showSettingsModal !== newState.showSettingsModal ||
    oldState.showCharacterModal !== newState.showCharacterModal ||
    oldState.showPromptModal !== newState.showPromptModal ||
    oldState.showCreateGroupChatModal !== newState.showCreateGroupChatModal ||
    oldState.showCreateOpenChatModal !== newState.showCreateOpenChatModal ||
    oldState.showEditGroupChatModal !== newState.showEditGroupChatModal ||
    oldState.showDebugLogsModal !== newState.showDebugLogsModal ||
    JSON.stringify(oldState.modal) !== JSON.stringify(newState.modal) ||
    (newState.showCharacterModal &&
      JSON.stringify(oldState.editingCharacter) !==
        JSON.stringify(newState.editingCharacter)) ||
    (newState.showPromptModal &&
      JSON.stringify(oldState.settings.prompts) !==
        JSON.stringify(newState.settings.prompts)) ||
    (newState.showCreateGroupChatModal &&
      JSON.stringify(oldState.characters) !==
        JSON.stringify(newState.characters)) ||
    (newState.showEditGroupChatModal &&
      JSON.stringify(oldState.editingGroupChat) !==
        JSON.stringify(newState.editingGroupChat)) ||
    (newState.showDebugLogsModal &&
      JSON.stringify(oldState.debugLogs) !== JSON.stringify(newState.debugLogs))
  );
}

// --- New function for conditional blur ---
function setupConditionalBlur() {
  const messagesContainer = document.getElementById("messages-container");
  const inputAreaWrapper = document.getElementById("input-area-wrapper");

  if (!messagesContainer || !inputAreaWrapper) {
    return; // If elements aren't here, do nothing. It will be called again on next render.
  }

  // To prevent multiple listeners on the same element if re-renders happen without DOM replacement
  if (messagesContainer._scrollHandler) {
    messagesContainer.removeEventListener(
      "scroll",
      messagesContainer._scrollHandler,
    );
  }

  const handleScroll = () => {
    // Check if scrolled to the bottom
    const isAtBottom =
      messagesContainer.scrollHeight -
        messagesContainer.scrollTop -
        messagesContainer.clientHeight <
      5;

    if (isAtBottom) {
      inputAreaWrapper.classList.add("scrolled-to-bottom");
    } else {
      inputAreaWrapper.classList.remove("scrolled-to-bottom");
    }
  };

  messagesContainer.addEventListener("scroll", handleScroll);
  messagesContainer._scrollHandler = handleScroll; // Store reference to the handler

  // Initial check
  handleScroll();
}
