import { renderSidebar } from "./components/Sidebar.js";
import {
  renderMainChat,
  setupMainChatEventListeners,
} from "./components/MainChat.js";
import { renderDesktopSettingsModal } from "./components/DesktopSettingsModal.js";
import {
  renderMobileSettingsUI,
  renderAiSettingsPage, // Import the new function
  renderScaleSettingsPage,
  setupMobileSettingsUIEventListeners,
} from "./components/MobileSettingsUI.js";
import { setupDesktopSettingsEventListeners } from "./components/DesktopSettingsUI.js";

import { renderCharacterModal } from "./components/CharacterModal.js";
import {
  renderPromptModal,
  setupPromptModalEventListeners,
} from "./components/PromptModal.js";
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

const MODAL_ANIMATION_INITIAL_SCALE = 0.2;
const MODAL_ANIMATION_DURATION_MS = 350;

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
  const confirmationContainer = document.getElementById(
    "confirmation-modal-container",
  );

  // Render main modals
  let mainModalHtml = "";
  if (app.state.showSettingsModal)
    mainModalHtml += renderDesktopSettingsModal(app);
  if (app.state.showCharacterModal) mainModalHtml += renderCharacterModal(app);
  if (app.state.showPromptModal) mainModalHtml += await renderPromptModal(app);
  if (app.state.showCreateGroupChatModal)
    mainModalHtml += renderCreateGroupChatModal(app);
  if (app.state.showCreateOpenChatModal)
    mainModalHtml += renderCreateOpenChatModal(app);
  if (app.state.showEditGroupChatModal)
    mainModalHtml += renderEditGroupChatModal(app);
  if (app.state.showDebugLogsModal)
    mainModalHtml += renderDebugLogsModal(app.state);
  if (app.state.showMobileSearch) mainModalHtml += renderSearchModal(app);
  if (app.state.modal.isOpen && app.state.modal.type === "chatSelection") {
    mainModalHtml += renderChatSelectionModal(app);
  }
  if (container.innerHTML !== mainModalHtml) {
    container.innerHTML = mainModalHtml;
  }

  // Render confirmation modal
  let confirmationModalHtml = "";
  if (app.state.modal.isOpen && app.state.modal.type === "confirmation") {
    confirmationModalHtml += renderConfirmationModal(app);
  }
  if (confirmationContainer.innerHTML !== confirmationModalHtml) {
    confirmationContainer.innerHTML = confirmationModalHtml;
  }

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

function renderConfirmationModalContainer(app) {
  const container = document.getElementById("confirmation-modal-container");
  let html = "";
  if (app.state.modal.isOpen && app.state.modal.type === "confirmation") {
    html += renderConfirmationModal(app);
  }
  container.innerHTML = html;
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
        oldState.mobileSettingsPage !== newState.mobileSettingsPage ||
        JSON.stringify(oldState.debugLogs) !==
          JSON.stringify(newState.debugLogs)
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
          oldState.showFabMenu !== newState.showFabMenu ||
          oldState.mobileEditModeCharacterId !== newState.mobileEditModeCharacterId
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

  // Render confirmation modal separately
  if (isFirstRender || shouldUpdateConfirmationModal(oldState, newState)) {
    renderConfirmationModalContainer(app);
  }

  // Set scroll position for group chat character list and add scroll listener
  if (newState.showCreateGroupChatModal) {
    const characterList = document.getElementById("group-chat-character-list");
    if (characterList) {
      characterList.scrollTop = newState.createGroupChatScrollTop || 0;
      // Remove existing listener to prevent duplicates
      if (characterList._scrollListener) {
        characterList.removeEventListener(
          "scroll",
          characterList._scrollListener,
        );
      }
      const scrollListener = (e) => {
        app.setState({ createGroupChatScrollTop: e.target.scrollTop });
      };
      characterList.addEventListener("scroll", scrollListener);
      characterList._scrollListener = scrollListener; // Store reference
    }
  }

  // Animate character modal opening
  if (newState.showCharacterModal && newState.modalOpeningEvent) {
    const event = newState.modalOpeningEvent;
    // Use requestAnimationFrame to ensure the element is in the DOM before animating
    requestAnimationFrame(() => {
        const modalBackdrop = document.getElementById("character-modal-backdrop");
        const modalPanel = modalBackdrop?.querySelector("#character-modal-panel");

        if (modalPanel) {
            const rect = modalPanel.getBoundingClientRect();
            const initialScale = MODAL_ANIMATION_INITIAL_SCALE;
            const modalCenterX = rect.left + rect.width / 2;
            const modalCenterY = rect.top + rect.height / 2;
            const initialX = event.clientX - modalCenterX;
            const initialY = event.clientY - modalCenterY;

            modalPanel.style.opacity = 0; // prevent flash

            modalPanel.animate([
                { transform: `translate(${initialX}px, ${initialY}px) scale(${initialScale})`, opacity: 0 },
                { transform: 'translate(0, 0) scale(1)', opacity: 1 }
            ], {
                duration: MODAL_ANIMATION_DURATION_MS,
                easing: 'cubic-bezier(0.215, 0.610, 0.355, 1)',
                fill: 'forwards'
            });
        }
    });

    // Clean up the event so it doesn't fire again
    app.setState({ modalOpeningEvent: null });
  }

  lucide.createIcons();
  setupConditionalBlur();
}

// --- RENDER HELPER FUNCTIONS ---

function shouldUpdateCharacterList(oldState, newState) {
  const conditions = [
    oldState.mobileEditModeCharacterId !== newState.mobileEditModeCharacterId,
    oldState.selectedChatId !== newState.selectedChatId,
    oldState.showFabMenu !== newState.showFabMenu,
    oldState.showMobileSearch !== newState.showMobileSearch,
    oldState.searchQuery !== newState.searchQuery,
    JSON.stringify(oldState.characters) !==
      JSON.stringify(newState.characters),
    JSON.stringify(oldState.unreadCounts) !==
      JSON.stringify(newState.unreadCounts),
    JSON.stringify(oldState.messages) !== JSON.stringify(newState.messages),
  ];
  return conditions.some(condition => condition);
}

function shouldUpdateSidebar(oldState, newState) {
  // This function checks if any state related to the sidebar has changed
  const conditions = [
    oldState.sidebarCollapsed !== newState.sidebarCollapsed,
    oldState.searchQuery !== newState.searchQuery,
    JSON.stringify(Array.from(oldState.expandedCharacterIds || [])) !==
      JSON.stringify(Array.from(newState.expandedCharacterIds || [])),
    oldState.editingChatRoomId !== newState.editingChatRoomId,
    JSON.stringify(oldState.characters) !==
      JSON.stringify(newState.characters),
    oldState.selectedChatId !== newState.selectedChatId,
    JSON.stringify(oldState.unreadCounts) !==
      JSON.stringify(newState.unreadCounts),
    JSON.stringify(oldState.messages) !== JSON.stringify(newState.messages),
    JSON.stringify(oldState.chatRooms) !== JSON.stringify(newState.chatRooms),
    JSON.stringify(oldState.groupChats) !==
      JSON.stringify(newState.groupChats),
    JSON.stringify(oldState.openChats) !== JSON.stringify(newState.openChats),
  ];
  return conditions.some(condition => condition);
}

function shouldUpdateMainChat(oldState, newState) {
  // This function checks if any state related to the main chat has changed
  const conditions = [
    oldState.selectedChatId !== newState.selectedChatId,
    oldState.editingMessageId !== newState.editingMessageId,
    JSON.stringify(oldState.messages) !== JSON.stringify(newState.messages),
    oldState.typingCharacterId !== newState.typingCharacterId,
    oldState.isWaitingForResponse !== newState.isWaitingForResponse,
    oldState.imageToSend !== newState.imageToSend,
    oldState.showUserStickerPanel !== newState.showUserStickerPanel,
    oldState.showInputOptions !== newState.showInputOptions,
    oldState.stickerToSend !== newState.stickerToSend,
    JSON.stringify(oldState.userStickers) !==
      JSON.stringify(newState.userStickers),
    JSON.stringify([...oldState.expandedStickers]) !==
      JSON.stringify([...newState.expandedStickers]),
    // Group/open chat related state changes
    JSON.stringify(oldState.groupChats) !==
      JSON.stringify(newState.groupChats),
    JSON.stringify(oldState.openChats) !== JSON.stringify(newState.openChats),
  ];
  return conditions.some(condition => condition);
}

function shouldUpdateModals(oldState, newState) {
  // This function checks if any state related to modals has changed

  // If the settings modal is open, we don't re-render it just for settings changes.
  // This prevents the modal from resetting while the user is typing in input fields.
  if (newState.showSettingsModal && oldState.showSettingsModal) {
    const conditions = [
        JSON.stringify(oldState.settingsSnapshots) !==
          JSON.stringify(newState.settingsSnapshots),
        oldState.settings.model !== newState.settings.model,
        oldState.showPromptModal !== newState.showPromptModal,
        JSON.stringify(oldState.openSettingsSections) !==
          JSON.stringify(newState.openSettingsSections),
        oldState.enableDebugLogs !== newState.enableDebugLogs,
        JSON.stringify(oldState.debugLogs) !==
          JSON.stringify(newState.debugLogs),
        // Detect active panel change in desktop settings UI
        oldState.ui?.desktopSettings?.activePanel !==
          newState.ui?.desktopSettings?.activePanel,
        // Detect settings UI mode change
        oldState.ui?.settingsUIMode !== newState.ui?.settingsUIMode
    ];
    return conditions.some(condition => condition);
  }

  const conditions = [
    JSON.stringify(oldState.modal) !== JSON.stringify(newState.modal),
    oldState.showSettingsModal !== newState.showSettingsModal,
    oldState.showCharacterModal !== newState.showCharacterModal,
    oldState.showMobileSearch !== newState.showMobileSearch,
    oldState.showPromptModal !== newState.showPromptModal,
    oldState.showCreateGroupChatModal !== newState.showCreateGroupChatModal,
    oldState.showCreateOpenChatModal !== newState.showCreateOpenChatModal,
    oldState.showEditGroupChatModal !== newState.showEditGroupChatModal,
    oldState.showDebugLogsModal !== newState.showDebugLogsModal,
    (newState.showCharacterModal &&
      JSON.stringify(oldState.editingCharacter) !==
        JSON.stringify(newState.editingCharacter)),
    (newState.showPromptModal &&
      JSON.stringify(oldState.settings.prompts) !==
        JSON.stringify(newState.settings.prompts)),
    (newState.showCreateGroupChatModal &&
      JSON.stringify(oldState.characters) !==
        JSON.stringify(newState.characters)),
    (newState.showEditGroupChatModal &&
      JSON.stringify(oldState.editingGroupChat) !==
        JSON.stringify(newState.editingGroupChat)),
    (newState.showDebugLogsModal &&
      JSON.stringify(oldState.debugLogs) !==
        JSON.stringify(newState.debugLogs)),
    (newState.showMobileSearch && oldState.searchQuery !== newState.searchQuery)
  ];
  return conditions.some(condition => condition);
}

function shouldUpdateConfirmationModal(oldState, newState) {
  return JSON.stringify(oldState.modal) !== JSON.stringify(newState.modal);
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
