import { renderSidebar } from "./components/Sidebar.js";
import {
  renderMainChat,
  setupMainChatEventListeners,
} from "./components/MainChat.js";
import { saveToBrowserStorage } from "./storage.js";
import { renderSettingsUI } from "./components/SettingsRouter.js";
import {
  renderSnapshotList,
  setupSettingsModalEventListeners,
} from "./components/MobileSettingsModal.js";
import { setupDesktopSettingsEventListeners } from "./components/DesktopSettingsUI.js";
import { getCurrentSettingsUIMode } from "./components/SettingsRouter.js";
import { setupNAIHandlers } from "./handlers/naiHandlers.js";
import { renderCharacterModal } from "./components/CharacterModal.js";
import { renderPromptModal, setupPromptModalEventListeners } from "./components/PromptModal.js";
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
import { renderSNSCharacterList } from "./components/SNSCharacterList.js";
import { renderSNSFeed } from "./components/SNSFeed.js";
import { renderSNSPostModal } from "./components/SNSPostModal.js";
import { renderImageResultModal } from "./components/ImageResultModal.js";

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
  if (app.state.showSNSCharacterListModal) html += renderSNSCharacterList(app);
  if (app.state.showSNSModal) html += renderSNSFeed(app);
  if (app.state.showSNSPostModal) html += renderSNSPostModal(app);
  if (app.state.modal.isOpen) html += renderConfirmationModal(app);
  if (app.state.imageResultModal && app.state.imageResultModal.isOpen) html += renderImageResultModal(app.state.imageResultModal);
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
        setupNAIHandlers(app);
      });
    } else {
      setupSettingsModalEventListeners();
      setupNAIHandlers(app);
    }
  }
  if (app.state.showCharacterModal) {
    // CharacterModal이 렌더링된 후 최면 표시 값 업데이트 및 이벤트 리스너 설정
    requestAnimationFrame(() => {
      const characterId = app.state.editingCharacter?.id;
      let characterState = app.state.characterStates[characterId];
      // console.log('[최면] ui.js에서 CharacterModal 렌더링 후 호출:', { characterId, characterState });
      
      // 캐릭터 상태가 없으면 기본값으로 생성
      if (characterId && !characterState) {
        // console.warn('[최면] ui.js에서 characterState가 없음, 기본값 생성:', characterId);
        
        characterState = {
          affection: 0.2,
          intimacy: 0.2,
          trust: 0.2,
          romantic_interest: 0,
          lastActivity: Date.now()
        };
        
        // 새로운 캐릭터 상태를 저장
        const newCharacterStates = { ...app.state.characterStates };
        newCharacterStates[characterId] = characterState;
        app.setState({ characterStates: newCharacterStates });
        saveToBrowserStorage("personaChat_characterStates_v16", newCharacterStates);
      }
      
      if (characterId && characterState && app.updateHypnosisDisplayValues) {
        app.updateHypnosisDisplayValues(characterState);
      }
      
      // 최면 슬라이더 이벤트 리스너 설정
      const setupHypnosisSlider = (type) => {
        const slider = document.getElementById(`hypnosis-${type}`);
        const valueDisplay = document.getElementById(`hypnosis-${type}-value`);
        
        if (slider && valueDisplay) {
          slider.addEventListener('input', (e) => {
            const value = e.target.value;
            valueDisplay.textContent = `${value}%`;
            
            if (app.updateHypnosisValue) {
              app.updateHypnosisValue(characterId, type, parseInt(value));
            }
          });
        }
      };
      
      setupHypnosisSlider('affection');
      setupHypnosisSlider('intimacy');
      setupHypnosisSlider('trust');
      setupHypnosisSlider('romantic_interest');
    });
  }
  if (app.state.showPromptModal) {
    setupPromptModalEventListeners(app);
  }
  // 이미지 결과 모달 이벤트 리스너 설정
  if (app.state.imageResultModal && app.state.imageResultModal.isOpen) {
    // DOM이 완전히 업데이트된 후 이벤트 리스너 설정
    requestAnimationFrame(() => {
      app.setupImageResultModalEvents();
    });
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

  // Conditionally render the sidebar to minimize DOM updates
  if (isFirstRender || shouldUpdateSidebar(oldState, newState)) {
    renderSidebar(app);
  }

  // Conditionally render the main chat to minimize DOM updates
  if (isFirstRender || shouldUpdateMainChat(oldState, newState)) {
    // 재렌더링 전에 입력창 값 보존
    const messageInput = document.getElementById("new-message-input");
    const inputValue = messageInput ? messageInput.value : "";
    const inputHeight = messageInput ? messageInput.style.height : "auto";

    renderMainChat(app);
    setupMainChatEventListeners();

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

    await renderModals(app);

    const newSettingsContent = document.getElementById(
      "settings-modal-content",
    );
    if (newSettingsContent) {
      newSettingsContent.scrollTop = scrollPosition;
    }
  }

  lucide.createIcons();
  app.scrollToBottom();
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
    oldState.expandedCharacterId !== newState.expandedCharacterId ||
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
    oldState.showSNSCharacterListModal !== newState.showSNSCharacterListModal ||
    oldState.showSNSModal !== newState.showSNSModal ||
    oldState.showSNSPostModal !== newState.showSNSPostModal ||
    oldState.selectedSNSCharacter !== newState.selectedSNSCharacter ||
    oldState.snsSecretMode !== newState.snsSecretMode ||
    oldState.snsActiveTab !== newState.snsActiveTab ||
    // 이미지 결과 모달 상태 변경 감지 (중요!)
    JSON.stringify(oldState.imageResultModal) !== JSON.stringify(newState.imageResultModal) ||
    // SNS 모달이 열려있을 때 characters 배열의 변경(글 작성/삭제)을 감지
    (newState.showSNSModal &&
      JSON.stringify(oldState.characters) !== JSON.stringify(newState.characters)) ||
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