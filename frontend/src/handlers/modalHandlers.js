import { debounce } from "../utils.js";
import { t, setLanguage } from "../i18n.js";
import { setupDesktopSettingsEventListeners } from "../components/DesktopSettingsUI.js";

export function handleModalClick(e, app) {
  const summary = e.target.closest("details > summary");
  if (summary) {
    const details = summary.parentElement;
    if (details.closest("#settings-modal-content")) {
      const section = details.dataset.section;
      if (section) {
        app.toggleSettingsSection(section);
        e.preventDefault();
        return; // Prevent other handlers from firing
      }
    }
  }

  // Settings Modal
  if (
    e.target.closest("#open-settings-modal") ||
    e.target.closest("#open-settings-modal-mobile")
  )
    app.openSettingsModal();
  if (
    e.target.closest("#close-settings-modal") ||
    e.target.closest("#close-settings-ui")
  )
    app.handleCancelSettings();
  if (
    e.target.closest("#save-settings") ||
    e.target.closest("#save-settings-ui")
  )
    app.handleSaveSettings();

  // Character Modal
  if (e.target.closest("#open-new-character-modal-mobile"))
    app.openNewCharacterModal();

  // Prompt Modal
  if (e.target.closest("#open-prompt-modal"))
    app.setState({ showPromptModal: true });
  if (e.target.closest("#close-prompt-modal"))
    app.setState({ showPromptModal: false });
  if (e.target.closest("#save-prompts")) app.handleSavePrompts();

  // Character Modal
  if (e.target.closest('[data-action="close-character-modal"]'))
    app.closeCharacterModal();

  // Chat Selection Modal
  const closeChatSelection = e.target.closest('[data-action="close-chat-selection"]');
  if (closeChatSelection) {
    app.hideModal();
  }

  const selectChat = e.target.closest('[data-action="select-chat"]');
  if (selectChat) {
    const chatRoomId = selectChat.dataset.chatRoomId;
    app.selectChatRoom(chatRoomId);
    app.hideModal();
  }

  if (e.target.closest('#create-new-chat-room-modal')) {
    app.handleCreateNewChatRoom();
  }
  if (e.target.closest("#save-character")) app.handleSaveCharacter();
  if (e.target.closest("#select-avatar-btn"))
    document.getElementById("avatar-input").click();
  if (e.target.closest("#load-card-btn"))
    document.getElementById("card-input").click();
  if (e.target.closest("#save-card-btn")) app.handleSaveCharacterToImage();
  if (e.target.closest("#add-memory-btn")) app.addMemoryField();
  if (e.target.closest("#add-sticker-btn"))
    document.getElementById("sticker-input").click();
  if (e.target.closest("#toggle-sticker-selection"))
    app.toggleStickerSelectionMode();
  if (e.target.closest("#select-all-stickers")) app.handleSelectAllStickers();
  if (e.target.closest("#delete-selected-stickers"))
    app.handleDeleteSelectedStickers();
  const deleteMemoryBtn = e.target.closest(".delete-memory-btn");
  if (deleteMemoryBtn) deleteMemoryBtn.closest(".memory-item").remove();
  const deleteStickerBtn = e.target.closest(".delete-sticker-btn");
  if (deleteStickerBtn)
    app.handleDeleteSticker(parseInt(deleteStickerBtn.dataset.index));
  const editStickerNameBtn = e.target.closest(".edit-sticker-name-btn");
  if (editStickerNameBtn)
    app.handleEditStickerName(parseInt(editStickerNameBtn.dataset.index));

  const stickerCheckbox = e.target.closest(".sticker-checkbox");
  if (stickerCheckbox) {
    const index = parseInt(stickerCheckbox.dataset.index);
    const isChecked = stickerCheckbox.checked;
    app.handleStickerSelection(index, isChecked);
  }

  // Confirmation Modal
  if (e.target.closest("#modal-cancel")) {
    e.preventDefault();
    e.stopPropagation();
    app.hideModal();
    return;
  }
  if (e.target.closest("#modal-confirm")) {
    e.preventDefault();
    e.stopPropagation();
    if (app.state.modal.onConfirm) {
      const onConfirm = app.state.modal.onConfirm;
      app.hideModal(); // 먼저 모달을 닫고
      setTimeout(() => onConfirm(), 0); // 비동기로 확인 액션 실행
    }
    return;
  }

  // User Sticker Panel
  if (e.target.closest("#add-user-sticker-btn"))
    document.getElementById("user-sticker-input").click();
  if (e.target.closest("#delete-selected-stickers"))
    app.handleDeleteSelectedStickers();

  // 언어 설정 버튼 클릭 처리
  const languageButton = e.target.closest(".language-select-btn");
  if (languageButton) {
    const selectedLanguage = languageButton.dataset.language;
    if (selectedLanguage) {
      // 언어 변경
      setLanguage(selectedLanguage);

      // 확인 메시지 표시 후 페이지 새로고침
      alert(t("system.languageChangeMessage"));

      // 짧은 지연 후 새로고침
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
    return;
  }

  // Data Management
  if (e.target.closest("#backup-data-btn")) app.handleBackup();
  if (e.target.closest("#restore-data-btn"))
    document.getElementById("restore-file-input").click();
  if (e.target.closest("#backup-prompts-btn")) app.handleBackupPrompts();
  if (e.target.closest("#restore-prompts-btn"))
    document.getElementById("restore-prompts-input").click();

  const restoreSnapshotBtn = e.target.closest(".restore-snapshot-btn");
  if (restoreSnapshotBtn) {
    const timestamp = Number(restoreSnapshotBtn.dataset.timestamp);
    app.handleRestoreSnapshot(timestamp);
  }

  const deleteSnapshotBtn = e.target.closest(".delete-snapshot-btn");
  if (deleteSnapshotBtn) {
    const timestamp = Number(deleteSnapshotBtn.dataset.timestamp);
    app.handleDeleteSnapshot(timestamp);
  }

  // API Diversification Handlers
  const modelSelectBtn = e.target.closest(".model-select-btn");
  if (modelSelectBtn) {
    app.handleModelSelect(modelSelectBtn.dataset.model);
  }

  const addCustomModelBtn = e.target.closest("#add-custom-model-btn");
  if (addCustomModelBtn) {
    app.handleAddCustomModel();
  }

  const removeCustomModelBtn = e.target.closest(".remove-custom-model-btn");
  if (removeCustomModelBtn) {
    app.handleRemoveCustomModel(parseInt(removeCustomModelBtn.dataset.index));
  }

  // AI Character Generation Handler
  if (e.target.closest("#ai-generate-character-btn")) {
    app.handleAIGenerateCharacter();
  }

  // Debug logs in advanced settings
  if (e.target.closest("#settings-enable-debug-logs")) {
    const checked = e.target.checked;
    app.setState({
      enableDebugLogs: checked,
      settings: { ...app.state.settings, enableDebugLogs: checked },
    });
  }
}

// Debounced function to update settings with a 500ms delay.
// This prevents the UI from re-rendering on every keystroke, improving user experience.
const debouncedUpdateSettings = debounce((app, newSetting) => {
  app.setState({ settings: { ...app.state.settings, ...newSetting } });
}, 500);

const settingsUpdaters = {
  "settings-font-scale": (app, value) => ({ fontScale: parseFloat(value) }),
  "settings-api-key": (app, value) => {
    // Legacy compatibility - also update current provider's API key
    const apiProvider = app.state.settings.apiProvider || "gemini";
    const apiConfigs = { ...app.state.settings.apiConfigs };
    if (!apiConfigs[apiProvider]) apiConfigs[apiProvider] = {};
    apiConfigs[apiProvider].apiKey = value;
    return { apiKey: value, apiConfigs };
  },
  "settings-base-url": (app, value) => {
    const apiProvider = app.state.settings.apiProvider || "gemini";
    const apiConfigs = { ...app.state.settings.apiConfigs };
    if (!apiConfigs[apiProvider]) apiConfigs[apiProvider] = {};
    apiConfigs[apiProvider].baseUrl = value;
    return { apiConfigs };
  },
  "settings-max-tokens": (app, value) => {
    const apiProvider = app.state.settings.apiProvider || "gemini";
    const apiConfigs = { ...app.state.settings.apiConfigs };
    if (!apiConfigs[apiProvider]) apiConfigs[apiProvider] = {};
    apiConfigs[apiProvider].maxTokens = parseInt(value, 10);
    return { apiConfigs };
  },
  "settings-temperature": (app, value) => {
    const apiProvider = app.state.settings.apiProvider || "gemini";
    const apiConfigs = { ...app.state.settings.apiConfigs };
    if (!apiConfigs[apiProvider]) apiConfigs[apiProvider] = {};
    apiConfigs[apiProvider].temperature = parseFloat(value);
    return { apiConfigs };
  },
  "settings-profile-max-tokens": (app, value) => {
    const apiProvider = app.state.settings.apiProvider || "gemini";
    const apiConfigs = { ...app.state.settings.apiConfigs };
    if (!apiConfigs[apiProvider]) apiConfigs[apiProvider] = {};
    apiConfigs[apiProvider].profileMaxTokens = parseInt(value, 10);
    return { apiConfigs };
  },
  "settings-profile-temperature": (app, value) => {
    const apiProvider = app.state.settings.apiProvider || "gemini";
    const apiConfigs = { ...app.state.settings.apiConfigs };
    if (!apiConfigs[apiProvider]) apiConfigs[apiProvider] = {};
    apiConfigs[apiProvider].profileTemperature = parseFloat(value);
    return { apiConfigs };
  },
  "settings-user-name": (app, value) => ({ userName: value }),
  "settings-user-desc": (app, value) => ({ userDescription: value }),
  "settings-proactive-toggle": (app, checked) => ({
    proactiveChatEnabled: checked,
  }),
  "settings-random-first-message-toggle": (app, checked) => ({
    randomFirstMessageEnabled: checked,
  }),
  "settings-random-character-count": (app, value) => ({
    randomCharacterCount: parseInt(value, 10),
  }),
  "settings-random-frequency-min": (app, value) => ({
    randomMessageFrequencyMin: parseInt(value, 10),
  }),
  "settings-random-frequency-max": (app, value) => ({
    randomMessageFrequencyMax: parseInt(value, 10),
  }),
  "settings-snapshots-toggle": (app, checked) => ({
    snapshotsEnabled: checked,
  }),
  "settings-api-provider": (app, value) => ({ apiProvider: value }),
};

export function handleModalInput(e, app) {
  const updater = settingsUpdaters[e.target.id];
  if (updater) {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    const newSetting = updater(app, value);
    // Call the debounced function to update settings
    debouncedUpdateSettings(app, newSetting);

    // API 제공업체 변경 시 즉시 UI 업데이트
    if (e.target.id === "settings-api-provider") {
      app.handleAPIProviderChange(value);
    }
  }

  if (e.target.id === "settings-random-character-count") {
    const count = e.target.value;
    const label = document.getElementById("random-character-count-label");
    if (label)
      label.textContent = `${count}${t("settings.characterCountUnit")}`;
  }
}

export function handleModalChange(e, app) {
  if (e.target.id === "avatar-input") app.handleAvatarChange(e, false);
  if (e.target.id === "card-input") app.handleAvatarChange(e, true);
  if (e.target.id === "sticker-input") app.handleStickerFileSelect(e);
  if (e.target.id === "user-sticker-input") app.handleUserStickerFileSelect(e);
  if (e.target.id === "settings-random-first-message-toggle") {
    const optionsDiv = document.getElementById("random-chat-options");
    if (optionsDiv) {
      // 모바일 UI에서는 style.display 사용
      optionsDiv.style.display = e.target.checked ? "block" : "none";
    }
  }

  if (e.target.id === "settings-snapshots-toggle") {
    const snapshotsList = document.getElementById("snapshots-list");
    if (snapshotsList) {
      // 모바일 UI에서는 style.display 사용
      snapshotsList.style.display = e.target.checked ? "block" : "none";
    }
  }

  if (e.target.id === "restore-file-input") app.handleRestore(e);
  if (e.target.id === "restore-prompts-input") app.handleRestorePrompts(e);
  if (e.target.id === "settings-snapshots-toggle") {
    const optionsDiv = document.getElementById("snapshots-list");
    if (optionsDiv)
      optionsDiv.style.display = e.target.checked ? "block" : "none";
    app.handleToggleSnapshots(e.target.checked);
  }

  // 디버그 로그 관련 이벤트는 모두 onclick/onchange로 처리됨
}
