import { renderSidebar } from "./components/Sidebar.js";
import {
  renderMainChat,
  setupMainChatEventListeners,
} from "./components/MainChat.js";
import { renderSettingsUI } from "./components/SettingsRouter.js";
import {
  renderMobileSettingsUI,
  renderAiSettingsPage, // Import the new function
  renderScaleSettingsPage,
  setupMobileSettingsUIEventListeners,
} from "./components/MobileSettingsUI.js";
import { setupDesktopSettingsEventListeners } from "./components/DesktopSettingsUI.js";

import { renderCharacterModal } from "./components/CharacterModal.js";
import { renderPromptModal, setupPromptModalEventListeners } from "./components/PromptModal.js";
import { renderConfirmationModal } from "./components/ConfirmationModal.js";
import { renderChatSelectionModal } from "./components/ChatSelectionModal.js";
import {
  renderCreateGroupChatModal,
  renderCreateOpenChatModal,
  renderEditGroupChatModal,
} from "./components/GroupChat.js";
import {
  renderDebugLogsModal,
  setupDebugLogsModalEventListeners,
} from "./components/DebugLogsModal.js";
import {
  renderCharacterListPage,
  renderCharacterList,
} from "./components/CharacterListPage.js";
import { renderSearchModal } from "./components/SearchModal.js";

export function adjustMessageContainerPadding() {
  const messagesContainer = document.getElementById("messages-container");
  const inputAreaWrapper = document.getElementById("input-area-wrapper");

  if (messagesContainer && inputAreaWrapper) {
    const inputHeight = inputAreaWrapper.offsetHeight;
    messagesContainer.style.paddingBottom = `${inputHeight + 4}px`;
  }
}

async function renderModals(app) {
  const container = document.getElementById("modal-container");
  let html = "";
  if (app.state.showSettingsModal) html += renderSettingsUI(app);
  if (app.state.showCharacterModal) html += renderCharacterModal(app);
  if (app.state.showPromptModal) html += await renderPromptModal(app);
  if (app.state.showCreateGroupChatModal)
    html += renderCreateGroupChatModal(app);
  if (app.state.showCreateOpenChatModal) html += renderCreateOpenChatModal(app);
  if (app.state.showEditGroupChatModal) html += renderEditGroupChatModal(app);
  if (app.state.showDebugLogsModal) html += renderDebugLogsModal(app.state);
  if (app.state.showMobileSearch) html += renderSearchModal(app);
  if (app.state.modal.isOpen) {
    switch (app.state.modal.type) {
      case "confirmation":
        html += renderConfirmationModal(app);
        break;
      case "chatSelection":
        html += renderChatSelectionModal(app);
        break;
    }
  }
  container.innerHTML = html;

  // Setup event listeners for modals after DOM update
  if (app.state.showSettingsModal) {
    setupDesktopSettingsEventListeners(app);
  }
  if (app.state.showDebugLogsModal) {
    setupDebugLogsModalEventListeners();
  }
  if (app.state.showPromptModal) {
    setupPromptModalEventListeners(app);
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

export async function render(app) {
  const oldState = app.oldState || {};
  const newState = app.state;
  const isFirstRender = !app.oldState;
  const isMobile = window.innerWidth < 768;

  const mainContainer = document.getElementById("main-chat");
  const listContainer = document.getElementById(
    "character-list-page-container",
  );
  const settingsContainer = document.getElementById("settings-page-container");
  const aiSettingsContainer = document.getElementById(
    "ai-settings-page-container",
  );
  const scaleSettingsContainer = document.getElementById(
    "scale-settings-page-container",
  );
  const sidebarContainer = document.getElementById("sidebar");

  // Main Content Rendering
  if (isMobile) {
    const transitionContainer = document.getElementById(
      "page-transition-container",
    );

    // --- Visibility & Animation Control ---
    sidebarContainer.classList.add("hidden");
    listContainer.classList.remove("hidden");
    mainContainer.classList.remove("hidden");
    settingsContainer.classList.remove("hidden");
    aiSettingsContainer.classList.remove("hidden");

    // --- View Switching Logic ---
    if (newState.showAiSettingsUI) {
      transitionContainer.classList.add("show-ai-settings");
      transitionContainer.classList.remove(
        "show-chat",
        "show-settings",
        "show-scale-settings",
      );
      if (
        isFirstRender ||
        oldState.showAiSettingsUI !== newState.showAiSettingsUI
      ) {
        aiSettingsContainer.innerHTML = renderAiSettingsPage(app);
        setupMobileSettingsUIEventListeners(app); // Re-use listeners for back button etc.
      }
    } else if (newState.showScaleSettingsUI) {
      transitionContainer.classList.add("show-scale-settings");
      transitionContainer.classList.remove(
        "show-chat",
        "show-settings",
        "show-ai-settings",
      );
      if (
        isFirstRender ||
        oldState.showScaleSettingsUI !== newState.showScaleSettingsUI
      ) {
        scaleSettingsContainer.innerHTML = renderScaleSettingsPage(app);
        setupMobileSettingsUIEventListeners(app); // Re-use listeners for back button etc.
      }
    } else if (newState.showSettingsUI) {
      transitionContainer.classList.add("show-settings");
      transitionContainer.classList.remove(
        "show-chat",
        "show-ai-settings",
        "show-scale-settings",
      );
      if (
        isFirstRender ||
        oldState.showSettingsUI !== newState.showSettingsUI ||
        oldState.mobileSettingsPage !== newState.mobileSettingsPage
      ) {
        settingsContainer.innerHTML = renderMobileSettingsUI(app);
        setupMobileSettingsUIEventListeners(app);
      }
      setTimeout(() => {
        if (!window.personaApp.state.selectedChatId) {
          mainContainer.innerHTML = "";
        }
      }, 600);
    } else if (newState.selectedChatId) {
      if (oldState.selectedChatId !== newState.selectedChatId) {
        mainContainer.innerHTML =
          '<div class="flex-1 flex items-center justify-center"><div class="w-6 h-6 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div></div>';
      }

      transitionContainer.classList.add("show-chat");
      transitionContainer.classList.remove(
        "show-settings",
        "show-ai-settings",
        "show-scale-settings",
      );

      setTimeout(() => {
        if (
          window.personaApp.state.selectedChatId === newState.selectedChatId
        ) {
          if (isFirstRender || shouldUpdateMainChat(oldState, newState)) {
            renderMainChat(app);
            setupMainChatEventListeners();
            adjustMessageContainerPadding();
            lucide.createIcons();
            setupConditionalBlur();
            const messagesContainer =
              document.getElementById("messages-container");
            if (messagesContainer) {
              messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
          }
        }
      }, 600);
    } else {
      transitionContainer.classList.remove(
        "show-chat",
        "show-settings",
        "show-ai-settings",
        "show-scale-settings",
      );

      if (isFirstRender || shouldUpdateCharacterList(oldState, newState)) {
        const isListAlreadyRendered = !!listContainer.querySelector("header");
        if (
          !isListAlreadyRendered ||
          oldState.showFabMenu !== newState.showFabMenu
        ) {
          renderCharacterListPage(app);
        } else {
          const listItemsContainer = listContainer.querySelector(
            "#character-list-items",
          );
          if (listItemsContainer) {
            renderCharacterList(app, listItemsContainer);
          }
        }
      }

      setTimeout(() => {
        if (!window.personaApp.state.selectedChatId) {
          mainContainer.innerHTML = "";
        }
        if (!window.personaApp.state.showSettingsUI) {
          settingsContainer.innerHTML = "";
        }
        if (!window.personaApp.state.showAiSettingsUI) {
          aiSettingsContainer.innerHTML = "";
        }
        if (!window.personaApp.state.showScaleSettingsUI) {
          scaleSettingsContainer.innerHTML = "";
        }
      }, 600);
    }
  } else {
    // --- Desktop Layout ---
    const transitionContainer = document.getElementById(
      "page-transition-container",
    );

    // Setup desktop-specific visibility
    sidebarContainer.classList.remove("hidden");
    mainContainer.classList.remove("hidden");
    listContainer.classList.add("hidden"); // Character list page is not used on desktop
    transitionContainer.classList.add("show-chat");
    transitionContainer.classList.remove("show-settings", "show-ai-settings"); // Ensure animation state is reset for desktop

    // Render sidebar and main chat content
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
    if (isFirstRender || shouldUpdateMainChat(oldState, newState)) {
      renderMainChat(app);
      setupMainChatEventListeners();
      adjustMessageContainerPadding();
      const messagesContainer = document.getElementById("messages-container");
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
  }

  // Modal Rendering (always runs, independent of main content)
  if (isFirstRender || shouldUpdateModals(oldState, newState)) {
    const settingsContent = document.getElementById("settings-modal-content");
    const scrollPosition = settingsContent ? settingsContent.scrollTop : 0;

    await renderModals(app);

    const newSettingsContent = document.getElementById(
      "settings-modal-content",
    );
    if (newSettingsContent) {
      newSettingsContent.scrollTop = scrollPosition;
    }
  }

  lucide.createIcons();
  setupConditionalBlur();
}

// --- RENDER HELPER FUNCTIONS ---

function shouldUpdateCharacterList(oldState, newState) {
  return (
    oldState.selectedChatId !== newState.selectedChatId ||
    oldState.showFabMenu !== newState.showFabMenu ||
    oldState.showMobileSearch !== newState.showMobileSearch ||
    oldState.searchQuery !== newState.searchQuery ||
    JSON.stringify(oldState.characters) !==
      JSON.stringify(newState.characters) ||
    JSON.stringify(oldState.unreadCounts) !==
      JSON.stringify(newState.unreadCounts) ||
    JSON.stringify(oldState.messages) !== JSON.stringify(newState.messages)
  );
}

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
    oldState.showInputOptions !== newState.showInputOptions ||
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
    oldState.showMobileSearch !== newState.showMobileSearch ||
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
      JSON.stringify(oldState.debugLogs) !==
        JSON.stringify(newState.debugLogs)) ||
    (newState.showMobileSearch && oldState.searchQuery !== newState.searchQuery)
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

  // Initial check, deferred for accurate layout calculation
  setTimeout(handleScroll, 0);
}
