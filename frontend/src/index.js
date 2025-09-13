import { t, setLanguage, getLanguage } from "./i18n.js";
import { renderSnapshotList, setupAdvancedSettingsEventListeners } from "./components/MobileSettingsUI.js";
import {
  defaultCharacters,
  defaultAPISettings,
  defaultPrompts,
} from "./defaults.js";
import { getAllPrompts, saveAllPrompts, getPrompt } from "./prompts/promptManager.ts";

import {
  loadFromBrowserStorage,
  saveToBrowserStorage,
  checkIndexedDBQuota,
} from "./storage.js";
import { APIManager } from "./api/apiManager.js";
import { PROVIDERS, PROVIDER_MODELS } from "./constants/providers.js";
import { renderProviderConfig } from "./components/MobileSettingsUI.js";
import { render, adjustMessageContainerPadding } from "./ui.js";
import { secureStorage } from "./utils/secureStorage.js";
import {
  handleSidebarClick,
  handleSidebarInput,
} from "./handlers/sidebarHandlers.js";
import {
  handleMainChatClick,
  handleMainChatInput,
  handleMainChatKeypress,
  handleMainChatChange,
} from "./handlers/mainChatHandlers.js";
import { renderUserStickerPanel } from "./components/MainChat.js";
import { renderStickerGrid } from "./components/CharacterModal.js";
import {
  handleModalClick,
  handleModalInput,
  handleModalChange,
  savePersonaSettings,
} from "./handlers/modalHandlers.js";
import { handleGroupChatClick } from "./handlers/groupChatHandlers.js";
import { debounce, findMessageGroup } from "./utils.js";
// 🎯 커스텀 기능 imports
import { setupNAIHandlers, handleAutoStickerGeneration } from "./handlers/naiHandlers.js";
import { snsMethods, handleSNSInput, handleSNSKeypress } from "./handlers/snsHandlers.js";
import { StickerManager } from "./services/stickerManager.js";
import { renderImageResultModal } from "./components/ImageResultModal.js";

const MODAL_FADE_OUT_DURATION_MS = 200;
const HEADER_FADE_OUT_DURATION_MS = 300;

// --- APP INITIALIZATION ---
document.addEventListener("DOMContentLoaded", async () => {
  window.personaApp = new PersonaChatApp();
  window.app = window.personaApp; // SNS 편집을 위한 전역 접근
  await window.personaApp.init();
  
  // 디버깅용 전역 함수 노출
  window.fixOverlays = () => window.personaApp.forceReinitialize();
});

class PersonaChatApp {
  constructor() {
    this.apiManager = new APIManager();
    this.defaultPrompts = defaultPrompts;
    this.stickerManager = null; // NAI 스티커 매니저
    this.state = {
      settings: {
        // Legacy compatibility
        apiKey: "",
        model: "gemini-2.5-flash",
        // New API diversification settings
        ...defaultAPISettings,
        userName: "",
        userDescription: "",
        proactiveChatEnabled: false,
        randomFirstMessageEnabled: false,
        randomCharacterCount: 3,
        randomMessageFrequencyMin: 10,
        randomMessageFrequencyMax: 120,
        fontScale: 1.0,
        snapshotsEnabled: true,
      },
      characters: defaultCharacters,
      chatRooms: {},
      groupChats: {},
      openChats: {},
      characterStates: {},
      messages: {},
      unreadCounts: {},
      userStickers: [],
      settingsSnapshots: [],
      selectedChatId: null,
      expandedCharacterIds: new Set(),
      isWaitingForResponse: false,
      typingCharacterId: null,
      sidebarCollapsed: window.innerWidth < 768,
      showSettingsModal: false,
      showSettingsUI: false,
      showCharacterModal: false,
      showPromptModal: false,
      showCreateGroupChatModal: false,
      createGroupChatName: "",
      createGroupChatScrollTop: 0,
      showCreateOpenChatModal: false,
      showEditGroupChatModal: false,
      editingGroupChat: null,
      editingCharacter: null,
      editingMessageId: null,
      editingChatRoomId: null,
      showMobileSearch: false,
      showFabMenu: false,
      searchQuery: "",
      modal: { isOpen: false, title: "", message: "", onConfirm: null },
      showInputOptions: false,
      imageToSend: null,
      currentMessage: "",
      // Debug log system
      showDebugLogsModal: false,
      enableDebugLogs: false,
      debugLogs: [],
      stickerSelectionMode: false,
      selectedStickerIndices: [],
      showUserStickerPanel: false,
      stickerToSend: null,
      expandedStickers: new Set(),
      openSettingsSections: ["ai"],
      // PC settings UI state
      ui: {
        settingsUIMode: null, // 'mobile' | 'desktop' | null (auto detect)
        desktopSettings: {
          activePanel: "api", // 'api' | 'appearance' | 'character' | 'data' | 'advanced'
          isVisible: false,
        },
      },
      showAiSettingsUI: false,
      showScaleSettingsUI: false,
      // Mobile edit mode states (upstream)
      mobileEditModeCharacterId: null,
      modalOpeningEvent: null,
      // 🎯 SNS 시스템 상태
      // SNS related states (백업 구조)
      showSNSCharacterListModal: false,
      showSNSModal: false,
      showSNSPostModal: false,
      selectedSNSCharacter: null,
      snsActiveTab: 'posts',
      snsCharacterListType: null,
      snsCharacterSearchTerm: '',
      snsSecretMode: false,
      // Image Result Modal
      imageResultModal: {
        isOpen: false,
        imageUrl: null,
        promptText: null
      },
    };
    this.oldState = null;
    this.messagesEndRef = null;
    this.proactiveInterval = null;
    this.animatedMessageIds = new Set();
    this.initialSettings = null;
    this.isSearchModalAnimating = false;
    this.pendingSearchUpdate = false;

    this.debouncedSaveSettings = debounce(
      (settings) => saveToBrowserStorage("personaChat_settings_v16", settings),
      500,
    );
    this.debouncedSaveCharacters = debounce(
      (characters) =>
        saveToBrowserStorage("personaChat_characters_v16", characters),
      500,
    );
    this.debouncedSaveChatRooms = debounce(
      (chatRooms) =>
        saveToBrowserStorage("personaChat_chatRooms_v16", chatRooms),
      500,
    );
    this.debouncedSaveMessages = debounce(
      (messages) => saveToBrowserStorage("personaChat_messages_v16", messages),
      500,
    );
    this.debouncedSaveUnreadCounts = debounce(
      (unreadCounts) =>
        saveToBrowserStorage("personaChat_unreadCounts_v16", unreadCounts),
      500,
    );
    this.debouncedSaveUserStickers = debounce(
      (userStickers) =>
        saveToBrowserStorage("personaChat_userStickers_v16", userStickers),
      500,
    );
    this.debouncedSaveGroupChats = debounce(
      (groupChats) =>
        saveToBrowserStorage("personaChat_groupChats_v16", groupChats),
      500,
    );
    this.debouncedSaveOpenChats = debounce(
      (openChats) =>
        saveToBrowserStorage("personaChat_openChats_v16", openChats),
      500,
    );
    this.debouncedSaveSettingsSnapshots = debounce(
      (snapshots) =>
        saveToBrowserStorage("personaChat_settingsSnapshots_v16", snapshots),
      500,
    );
    this.debouncedSaveDebugLogs = debounce(
      (debugLogs) =>
        saveToBrowserStorage("personaChat_debugLogs_v16", debugLogs),
      500,
    );


    this.debouncedSetSearchQuery = debounce(
      (query) => this.setState({ searchQuery: query }),
      300,
    );

    this.debouncedCreateSettingsSnapshot = debounce(
      () => this.createSettingsSnapshot(),
      2000,
    );

    this.debouncedSavePersonaData = debounce(
      (personaData) =>
        saveToBrowserStorage("personaChat_personaData_v16", personaData),
      500,
    );
  }

  /**
   * Handles character selection from the list.
   * If the character has multiple chat rooms, it shows a selection modal.
   * Otherwise, it directly opens the chat room.
   * @param {string | number} characterId - The ID of the selected character.
   * @param {MouseEvent} e - The click event.
   */
  async handleCharacterSelect(characterId, e) {
    const numericCharacterId = Number(characterId);
    const character = this.state.characters.find(
      (c) => c.id === numericCharacterId,
    );
    if (!character) return;

    const chatRooms = this.state.chatRooms[numericCharacterId] || [];

    if (chatRooms.length > 1) {
      await this.showModal("chatSelection", { character }, e);
    } else if (chatRooms.length === 1) {
      this.selectChatRoom(chatRooms[0].id);
    } else {
      const newChatRoomId = this.createNewChatRoom(numericCharacterId);
      this.selectChatRoom(newChatRoomId);
    }
  }

  /**
   * Handles changes to a specific setting.
   * @param {string} key - The key of the setting to change.
   * @param {*} value - The new value for the setting.
   */
  handleSettingChange(key, value) {
    this.setState({
      settings: { ...this.state.settings, [key]: value },
    });
    this.debouncedCreateSettingsSnapshot();
  }

  /**
   * Handles changes to the configuration of the current API provider.
   * @param {string} key - The key of the config to change.
   * @param {*} value - The new value for the config.
   */
  handleProviderConfigChange(key, value) {
    const provider = this.state.settings.apiProvider || DEFAULT_PROVIDER;
    const newConfig = {
      ...(this.state.settings.apiConfigs?.[provider] || {}),
      [key]: value,
    };
    this.setState({
      settings: {
        ...this.state.settings,
        apiConfigs: {
          ...this.state.settings.apiConfigs,
          [provider]: newConfig,
        },
      },
    });
    this.debouncedCreateSettingsSnapshot();
  }

  createSettingsSnapshot() {
    if (!this.state.settings.snapshotsEnabled) return;

    const newSnapshot = {
      timestamp: Date.now(),
      settings: { ...this.state.settings },
    };

    const newSnapshots = [newSnapshot, ...this.state.settingsSnapshots].slice(
      0,
      10,
    );
    this.setState({ settingsSnapshots: newSnapshots });

    // 모바일 UI가 표시 중일 때 스냅샷 목록을 수동으로 다시 렌더링
    if (this.state.showSettingsUI) {
      const snapshotsListEl = document.getElementById("snapshots-list");
      if (snapshotsListEl) {
        snapshotsListEl.innerHTML = renderSnapshotList(this);
        if (window.lucide) {
          window.lucide.createIcons();
        }
      }
    }
  }

  /**
   * Sets up the application height to match the window's inner height.
   * This is to prevent the UI from being pushed up by the on-screen keyboard on mobile devices.
   */
  setupAppHeight() {
    const setHeight = () => {
      const app = document.getElementById("app");
      if (app) {
        app.style.height = `${window.innerHeight}px`;
      }
    };
    window.addEventListener("resize", setHeight);
    setHeight();
  }

  // --- CORE METHODS ---
  async init() {
    this.setupAppHeight();
    await this.initializeSecureStorage();
    await this.loadAllData();
    this.applyFontScale();
    await this.migrateChatData();

    // 🎯 SNS 메서드 연결
    Object.assign(this, snsMethods);

    // 🎯 NAI 스티커 매니저 초기화
    this.stickerManager = new StickerManager(this);
    this.stickerManager.initializeNAI();

    await render(this);
    this.addEventListeners();
    
    // NAI 핸들러 초기화
    setupNAIHandlers(this);

    this.proactiveInterval = setInterval(
      () => this.checkAndSendProactiveMessages(),
      60000,
    );

    if (this.state.settings.randomFirstMessageEnabled) {
      this.scheduleMultipleRandomChats();
    }
  }

  openSettingsModal() {
    this.initialSettings = JSON.parse(JSON.stringify(this.state.settings));
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      this.setState({ showSettingsUI: true });
    } else {
      this.setState({ showSettingsModal: true });
    }
  }

  handleSaveSettings() {
    const wasRandomDisabled =
      this.initialSettings && !this.initialSettings.randomFirstMessageEnabled;
    const isRandomEnabled = this.state.settings.randomFirstMessageEnabled;

    // Save persona settings from DOM before closing
    savePersonaSettings(this);

    this.setState({
      showSettingsModal: false,
      showSettingsUI: false,
      initialSettings: null,
    });

    if (wasRandomDisabled && isRandomEnabled) {
      this.scheduleMultipleRandomChats();
    }
  }

  handleCancelSettings() {
    // Check for changes in DOM inputs for persona fields
    const userNameInput = document.getElementById("settings-user-name");
    const userDescInput = document.getElementById("settings-user-desc");
    
    let hasPersonaChanges = false;
    if (userNameInput && userNameInput.value !== (this.initialSettings?.userName || "")) {
      hasPersonaChanges = true;
    }
    if (userDescInput && userDescInput.value !== (this.initialSettings?.userDescription || "")) {
      hasPersonaChanges = true;
    }
    
    const hasSettingsChanges =
      JSON.stringify(this.initialSettings) !==
      JSON.stringify(this.state.settings);

    const hasChanges = hasSettingsChanges || hasPersonaChanges;

    if (hasChanges) {
      this.showConfirmModal(
        t("ui.discardChanges"),
        t("ui.unsavedChangesWarning"),
        () => {
          if (this.initialSettings) {
            this.setState({
              settings: this.initialSettings,
              showSettingsModal: false,
              showSettingsUI: false,
              initialSettings: null,
              modal: { isOpen: false, title: "", message: "", onConfirm: null },
            });
          } else {
            this.setState({
              showSettingsModal: false,
              showSettingsUI: false,
              modal: { isOpen: false, title: "", message: "", onConfirm: null },
            });
          }
        },
      );
    } else {
      this.setState({
        showSettingsModal: false,
        showSettingsUI: false,
        initialSettings: null,
      });
    }
  }

  handleToggleSnapshots(enabled) {
    this.setState({
      settings: { ...this.state.settings, snapshotsEnabled: enabled },
    });
  }

  handleRestoreSnapshot(timestamp) {
    const snapshot = this.state.settingsSnapshots.find(
      (s) => s.timestamp === timestamp,
    );
    if (snapshot) {
      this.setState({ settings: snapshot.settings });
    }
  }

  handleDeleteSnapshot(timestamp) {
    const newSnapshots = this.state.settingsSnapshots.filter(
      (s) => s.timestamp !== timestamp,
    );
    this.setState({ settingsSnapshots: newSnapshots });
  }

  toggleSettingsSection(section) {
    const openSections = this.state.openSettingsSections || [];
    const newOpenSections = openSections.includes(section)
      ? openSections.filter((s) => s !== section)
      : [...openSections, section];
    this.setState({ openSettingsSections: newOpenSections });
  }

  // 메모리를 SNS 포스트로 마이그레이션하는 함수
  migrateMemoriesToSNSPosts(characters) {
    let migrationNeeded = false;
    
    const migratedCharacters = characters.map(character => {
      // 이미 SNS 포스트가 있고 메모리가 없으면 이미 마이그레이션됨
      if (character.snsPosts && !character.memories?.length) {
        return character;
      }
      
      // 메모리가 있으면 SNS 포스트로 변환
      if (character.memories && character.memories.length > 0) {
        migrationNeeded = true;
        const snsPosts = character.memories.map((memory, index) => ({
          id: `memory_${character.id}_${Date.now()}_${index}`,
          type: "memory",
          content: memory,
          timestamp: new Date(Date.now() - (character.memories.length - index) * 86400000).toISOString(), // 과거 날짜로 설정
          affection_state: {
            affection: 0.3,
            intimacy: 0.2, 
            trust: 0.25,
            romantic_interest: 0.0
          },
          access_level: "main-public",
          importance: 5.0,
          tags: ["기존메모리"],
          reason: "기존 메모리에서 마이그레이션"
        }));
        
        return {
          ...character,
          snsPosts: [...(character.snsPosts || []), ...snsPosts],
          memories: [] // 메모리 배열 초기화
        };
      }
      
      // 메모리도 SNS 포스트도 없으면 빈 배열 설정
      return {
        ...character,
        snsPosts: character.snsPosts || []
      };
    });
    
    if (migrationNeeded) {
      console.log('[Migration] 메모리를 SNS 포스트로 마이그레이션했습니다.');
      this.shouldSaveCharacters = true;
    }
    
    return migratedCharacters;
  }

  processAutoPost(character, autoPost) {
    if (!autoPost || !autoPost.content?.trim()) return character;
    
    const currentState = this.getCharacterState(character.id);
    const timestamp = new Date().toISOString();
    
    // 태그가 #으로 시작하지 않으면 추가
    const formattedTags = Array.isArray(autoPost.tags) 
      ? autoPost.tags.map(tag => tag.startsWith('#') ? tag : `#${tag}`)
      : [];
    
    const newPost = {
      id: `autopost_${character.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: autoPost.type || "memory",
      content: autoPost.content.trim(),
      timestamp: timestamp,
      affection_state: {
        affection: currentState?.affection || 0.3,
        intimacy: currentState?.intimacy || 0.2,
        trust: currentState?.trust || 0.25,
        romantic_interest: currentState?.romantic_interest || 0.0
      },
      access_level: autoPost.access_level || "main-public",
      importance: autoPost.importance || 5.0,
      tags: formattedTags,
      reason: autoPost.reason || "AI 자동 포스팅"
    };
    
    return {
      ...character,
      snsPosts: [...(character.snsPosts || []), newPost]
    };
  }

  async loadAllData() {
    try {
      const [
        settings,
        characters,
        chatRooms,
        messages,
        unreadCounts,
        userStickers,
        groupChats,
        openChats,
        characterStates,
        settingsSnapshots,
        debugLogs,
        selectedChatId,
        personaData,
      ] = await Promise.all([
        loadFromBrowserStorage("personaChat_settings_v16", {}),
        loadFromBrowserStorage("personaChat_characters_v16", defaultCharacters),
        loadFromBrowserStorage("personaChat_chatRooms_v16", {}),
        loadFromBrowserStorage("personaChat_messages_v16", {}),
        loadFromBrowserStorage("personaChat_unreadCounts_v16", {}),
        loadFromBrowserStorage("personaChat_userStickers_v16", []),
        loadFromBrowserStorage("personaChat_groupChats_v16", {}),
        loadFromBrowserStorage("personaChat_openChats_v16", {}),
        loadFromBrowserStorage("personaChat_characterStates_v16", {}),
        loadFromBrowserStorage("personaChat_settingsSnapshots_v16", []),
        loadFromBrowserStorage("personaChat_debugLogs_v16", []),
        loadFromBrowserStorage("personaChat_selectedChatId_v16", null),
        loadFromBrowserStorage("personaChat_personaData_v16", { userName: "", userDescription: "" }),
      ]);

      this.state.settings = {
        ...this.state.settings,
        ...settings,
      };

      // 메모리를 SNS 포스트로 마이그레이션
      const migratedCharacters = this.migrateMemoriesToSNSPosts(characters);
      
      this.state.characters = migratedCharacters.map((char) => ({
        ...char,
        id: Number(char.id),
      }));
      this.state.chatRooms = chatRooms;
      this.state.messages = messages;
      this.state.unreadCounts = unreadCounts;
      this.state.userStickers = userStickers;
      this.state.groupChats = groupChats;
      this.state.openChats = openChats;
      this.state.characterStates = characterStates;
      this.state.settingsSnapshots = settingsSnapshots;
      this.state.selectedChatId = selectedChatId;
      this.state.userName = personaData.userName || "";
      this.state.userDescription = personaData.userDescription || "";

      // Load prompts
      this.state.settings.prompts = await getAllPrompts();

      // Load debug log settings
      this.state.enableDebugLogs = settings.enableDebugLogs || false;

      // Load debug logs (use existing logs if available, otherwise default)
      if (this.state.enableDebugLogs) {
        this.state.debugLogs =
          debugLogs.length > 0
            ? debugLogs
            : [
                {
                  id: Date.now(),
                  timestamp: Date.now(),
                  message: t("ui.appStarted"),
                  level: "info",
                  type: "simple",
                },
                {
                  id: Date.now() + 1,
                  timestamp: Date.now(),
                  characterName: "System",
                  chatType: "system",
                  type: "structured",
                  data: {
                    personaInput: {
                      characterName: "System",
                      characterPrompt: "System initialization",
                      characterMemories: [],
                      characterId: "system",
                    },
                    systemPrompt: { initialization: "App startup process" },
                    outputResponse: {
                      messages: [],
                      newMemory: null,
                      characterState: null,
                    },
                    parameters: {
                      model: "system",
                      isProactive: false,
                      forceSummary: false,
                      messageCount: 0,
                    },
                    metadata: {
                      chatId: null,
                      chatType: "system",
                      timestamp: Date.now(),
                      apiProvider: "system",
                      model: "system",
                    },
                  },
                },
              ];
      } else {
        this.state.debugLogs = [];
      }
    } catch (error) {
      console.error(t("ui.dataLoadFailed"), error);
    }
  }

  // 배치 처리를 위한 큐
  _stateQueue = [];
  _renderScheduled = false;

  async setState(newState) {
    const messagesContainerOld = document.getElementById("messages-container");
    let scrollInfo = null;
    if (messagesContainerOld) {
      const isAtBottom =
        messagesContainerOld.scrollHeight -
          messagesContainerOld.scrollTop -
          messagesContainerOld.clientHeight <
        10;
      scrollInfo = {
        isAtBottom,
        scrollTop: messagesContainerOld.scrollTop,
      };
    }

    const desktopSettingsContent = document.getElementById(
      "desktop-settings-content",
    );
    let desktopScrollTop = null;
    if (desktopSettingsContent) {
      desktopScrollTop = desktopSettingsContent.scrollTop;
    }

    const mobileSettingsContent = document.getElementById(
      "settings-ui-content",
    );
    let mobileScrollTop = null;
    if (mobileSettingsContent) {
      mobileScrollTop = mobileSettingsContent.scrollTop;
    }

    this.oldState = { ...this.state };
    this.state = { ...this.state, ...newState };

    await render(this);

    const isRenamingChat =
      this.oldState &&
      this.oldState.editingChatRoomId &&
      !this.state.editingChatRoomId;

    if (scrollInfo) {
      const messagesContainerNew =
        document.getElementById("messages-container");
      if (messagesContainerNew) {
        if (scrollInfo.isAtBottom && !isRenamingChat) {
          this.scrollToBottom();
        } else {
          messagesContainerNew.scrollTop = scrollInfo.scrollTop;
        }
      }
    }

    if (desktopScrollTop !== null) {
      const newDesktopSettingsContent = document.getElementById(
        "desktop-settings-content",
      );
      if (newDesktopSettingsContent) {
        newDesktopSettingsContent.scrollTop = desktopScrollTop;
      }
    }
    if (mobileScrollTop !== null) {
      const newMobileSettingsContent = document.getElementById(
        "settings-ui-content",
      );
      if (newMobileSettingsContent) {
        newMobileSettingsContent.scrollTop = mobileScrollTop;
      }
    }

    if (
      JSON.stringify(this.oldState.settings) !==
      JSON.stringify(this.state.settings)
    ) {
      this.debouncedSaveSettings(this.state.settings);
      if (this.oldState.settings.fontScale !== this.state.settings.fontScale) {
        this.applyFontScale();
      }
    }
    if (
      this.shouldSaveCharacters ||
      this.oldState.characters !== this.state.characters
    ) {
      this.debouncedSaveCharacters(this.state.characters);
      this.shouldSaveCharacters = false;
    }
    if (
      JSON.stringify(this.oldState.chatRooms) !==
      JSON.stringify(this.state.chatRooms)
    ) {
      this.debouncedSaveChatRooms(this.state.chatRooms);
    }
    if (
      JSON.stringify(this.oldState.messages) !==
      JSON.stringify(this.state.messages)
    ) {
      this.debouncedSaveMessages(this.state.messages);
    }
    if (
      JSON.stringify(this.oldState.unreadCounts) !==
      JSON.stringify(this.state.unreadCounts)
    ) {
      this.debouncedSaveUnreadCounts(this.state.unreadCounts);
    }
    if (
      JSON.stringify(this.oldState.groupChats) !==
      JSON.stringify(this.state.groupChats)
    ) {
      this.debouncedSaveGroupChats(this.state.groupChats);
    }
    if (
      JSON.stringify(this.oldState.openChats) !==
      JSON.stringify(this.state.openChats)
    ) {
      this.debouncedSaveOpenChats(this.state.openChats);
    }
    if (
      JSON.stringify(this.oldState.userStickers) !==
      JSON.stringify(this.state.userStickers)
    ) {
      this.debouncedSaveUserStickers(this.state.userStickers);
    }
    if (
      JSON.stringify(this.oldState.settingsSnapshots) !==
      JSON.stringify(this.state.settingsSnapshots)
    ) {
      this.debouncedSaveSettingsSnapshots(this.state.settingsSnapshots);
    }
    if (
      JSON.stringify(this.oldState.debugLogs) !==
      JSON.stringify(this.state.debugLogs)
    ) {
      this.debouncedSaveDebugLogs(this.state.debugLogs);
    }
    if (
      this.oldState.userName !== this.state.userName ||
      this.oldState.userDescription !== this.state.userDescription
    ) {
      this.debouncedSavePersonaData({
        userName: this.state.userName,
        userDescription: this.state.userDescription
      });
    }
    if (this.oldState.selectedChatId !== this.state.selectedChatId) {
      saveToBrowserStorage(
        "personaChat_selectedChatId_v16",
        this.state.selectedChatId,
      );
    }
  }

  // 고성능 배치 setState (SNS 등에서 사용)
  setStateBatch(newState) {
    return new Promise((resolve, reject) => {
      this._stateQueue.push({ newState, resolve, reject });
      
      if (!this._renderScheduled) {
        this._renderScheduled = true;
        // 다음 tick에서 배치 처리 (React의 패턴과 유사)
        Promise.resolve().then(() => this._processBatch());
      }
    });
  }

  async _processBatch() {
    if (this._stateQueue.length === 0) {
      this._renderScheduled = false;
      return;
    }

    // 모든 상태 변경 합치기
    this.oldState = { ...this.state };
    const batch = this._stateQueue.splice(0); // 큐 비우기
    
    const mergedState = batch.reduce((merged, { newState }) => {
      return { ...merged, ...newState };
    }, {});

    this.oldState = this.oldState;
    this.state = { ...this.state, ...mergedState };

    try {
      // 한 번만 렌더링
      await render(this);

      // 모든 Promise resolve
      batch.forEach(({ resolve }) => resolve());

      // 기존 저장 로직 실행
      await this._handleBatchStateChanges();
    } catch (error) {
      console.error('Batch setState error:', error);
      // 오류 시 모든 Promise reject
      batch.forEach(({ reject }) => reject(error));
    }

    this._renderScheduled = false;
  }

  async _handleBatchStateChanges() {
    // 기존 setState의 저장 로직과 동일
    if (
      JSON.stringify(this.oldState.settings) !==
      JSON.stringify(this.state.settings)
    ) {
      this.debouncedSaveSettings(this.state.settings);
      if (this.oldState.settings.fontScale !== this.state.settings.fontScale) {
        this.applyFontScale();
      }
      // NAI 설정이 변경되면 StickerManager의 NAI 클라이언트 재초기화
      if (JSON.stringify(this.oldState.settings.naiSettings) !== JSON.stringify(this.state.settings.naiSettings)) {
        if (this.stickerManager) {
          this.stickerManager.updateNAIClient(this.state.settings.naiSettings);
        }
      }
    }
    if (
      this.shouldSaveCharacters ||
      this.oldState.characters !== this.state.characters
    ) {
      this.debouncedSaveCharacters(this.state.characters);
      this.shouldSaveCharacters = false;
    }
    if (
      JSON.stringify(this.oldState.chatRooms) !==
      JSON.stringify(this.state.chatRooms)
    ) {
      this.debouncedSaveChatRooms(this.state.chatRooms);
    }
    if (
      JSON.stringify(this.oldState.messages) !==
      JSON.stringify(this.state.messages)
    ) {
      this.debouncedSaveMessages(this.state.messages);
    }
    if (
      JSON.stringify(this.oldState.groupChats) !==
      JSON.stringify(this.state.groupChats)
    ) {
      this.debouncedSaveGroupChats(this.state.groupChats);
    }
    if (
      JSON.stringify(this.oldState.openChats) !==
      JSON.stringify(this.state.openChats)
    ) {
      this.debouncedSaveOpenChats(this.state.openChats);
    }
    if (
      JSON.stringify(this.oldState.unreadCounts) !==
      JSON.stringify(this.state.unreadCounts)
    ) {
      this.debouncedSaveUnreadCounts(this.state.unreadCounts);
    }
    if (this.oldState.selectedChatId !== this.state.selectedChatId) {
      saveToBrowserStorage(
        "personaChat_selectedChatId_v16",
        this.state.selectedChatId,
      );
    }
    if (
      JSON.stringify(this.oldState.characterStates) !==
      JSON.stringify(this.state.characterStates)
    ) {
      this.debouncedSaveCharacters(this.state.characterStates);
    }
    if (
      JSON.stringify(this.oldState.debugLogs) !==
      JSON.stringify(this.state.debugLogs)
    ) {
      this.debouncedSaveDebugLogs(this.state.debugLogs);
    }
    
    // 비교 완료 후 this.oldState를 현재 상태로 업데이트
    this.oldState = { ...this.state };
  }

  // --- CHAT ROOM TYPE MANAGEMENT ---
  isGroupChat(chatId) {
    return chatId && typeof chatId === "string" && chatId.startsWith("group_");
  }

  isOpenChat(chatId) {
    return chatId && typeof chatId === "string" && chatId.startsWith("open_");
  }

  isRegularChat(chatId) {
    return chatId && !this.isGroupChat(chatId) && !this.isOpenChat(chatId);
  }

  getChatType(chatId) {
    if (this.isGroupChat(chatId)) return "group";
    if (this.isOpenChat(chatId)) return "open";
    return "regular";
  }

  getCurrentChatRoom() {
    if (!this.state.selectedChatId) return null;

    // Check group chats first
    if (this.isGroupChat(this.state.selectedChatId)) {
      return this.state.groupChats[this.state.selectedChatId] || null;
    }

    // Check open chats
    if (this.isOpenChat(this.state.selectedChatId)) {
      return this.state.openChats[this.state.selectedChatId] || null;
    }

    // Check regular chat rooms
    for (const characterId in this.state.chatRooms) {
      const chatRooms = this.state.chatRooms[characterId];
      const chatRoom = chatRooms.find(
        (room) => room.id === this.state.selectedChatId,
      );
      if (chatRoom) return chatRoom;
    }
    return null;
  }

  createGroupChat(name, participantIds) {
    const groupChatId = "group_" + Date.now();
    const newGroupChat = {
      id: groupChatId,
      name: name,
      participantIds: participantIds,
      createdAt: Date.now(),
      type: "group",
      settings: {
        responseFrequency: 0.8,
        maxRespondingCharacters: 2,
        responseDelay: 3000,
        participantSettings: participantIds.reduce((acc, id) => {
          acc[id] = {
            isActive: true,
            responseProbability: 0.9,
            characterRole: "normal",
          };
          return acc;
        }, {}),
      },
    };

    const newGroupChats = {
      ...this.state.groupChats,
      [groupChatId]: newGroupChat,
    };
    const newMessages = { ...this.state.messages, [groupChatId]: [] };

    this.setState({
      groupChats: newGroupChats,
      messages: newMessages,
      selectedChatId: groupChatId,
      showCreateGroupChatModal: false,
      createGroupChatName: "",
      createGroupChatScrollTop: 0,
    });

    saveToBrowserStorage("personaChat_messages_v16", newMessages);
    saveToBrowserStorage("personaChat_groupChats_v16", newGroupChats);
    return groupChatId;
  }

  async createOpenChat(name) {
    const openChatId = "open_" + Date.now();
    const newOpenChat = {
      id: openChatId,
      name: name,
      createdAt: Date.now(),
      type: "open",
      currentParticipants: [],
      participantHistory: [],
      chatActivity: 0,
      lastActivity: Date.now(),
    };

    const newOpenChats = { ...this.state.openChats, [openChatId]: newOpenChat };
    const newMessages = { ...this.state.messages, [openChatId]: [] };

    this.setState({
      openChats: newOpenChats,
      messages: newMessages,
      selectedChatId: openChatId,
      showCreateOpenChatModal: false,
    });

    saveToBrowserStorage("personaChat_messages_v16", newMessages);
    saveToBrowserStorage("personaChat_openChats_v16", newOpenChats);

    await this.initializeAllCharacterStates();
    this.triggerInitialOpenChatJoins(openChatId);
    return openChatId;
  }

  async initializeAllCharacterStates() {
    for (const character of this.state.characters) {
      this.initializeCharacterState(character.id);
    }
  }

  initializeCharacterState(characterId) {
    const currentStates = this.state.characterStates;
    if (!currentStates[characterId]) {
      const newCharacterStates = {
        ...currentStates,
        [characterId]: {
          mood: 0.7,
          energy: 0.8,
          socialBattery: 0.9,
          personality: {
            extroversion: 0.6,
            openness: 0.7,
            conscientiousness: 0.5,
            agreeableness: 0.8,
            neuroticism: 0.3,
          },
          currentRooms: [],
          lastActivity: Date.now(),
        },
      };
      this.setState({ characterStates: newCharacterStates });
      saveToBrowserStorage(
        "personaChat_characterStates_v16",
        newCharacterStates,
      );
    }
  }

  applyFontScale() {
    document.documentElement.style.setProperty(
      "--font-scale",
      this.state.settings.fontScale,
    );
  }

  // --- EVENT LISTENERS ---
  addEventListeners() {
    const appElement = document.getElementById("app");

    appElement.addEventListener("click", (e) => {
      handleSidebarClick(e, this);
      handleMainChatClick(e, this);
      handleModalClick(e, this);
      handleGroupChatClick(e, this);

      const characterListItem = e.target.closest(".character-list-item");
      if (characterListItem) {
        const characterId = characterListItem.dataset.characterId;
        if (characterId) {
          this.handleCharacterSelect(characterId, e);
        }
      }

      if (e.target.closest("#navigate-to-ai-settings")) {
        this.setState({ showAiSettingsUI: true });
      }

      if (e.target.closest("#navigate-to-scale-settings")) {
        this.setState({ showScaleSettingsUI: true });
      }

      if (e.target.closest("#close-ai-settings-ui")) {
        this.setState({ showAiSettingsUI: false });
      }

      if (e.target.closest("#close-scale-settings-ui")) {
        this.setState({ showScaleSettingsUI: false });
      }

      if (e.target.closest("#fab-menu-toggle")) {
        this.setState({ showFabMenu: !this.state.showFabMenu });
      }

      if (e.target.closest("#toggle-mobile-search-btn")) {
        this.setState({ showMobileSearch: !this.state.showMobileSearch });
      }

      if (
        e.target.closest("#close-search-modal-btn") ||
        e.target.id === "search-modal-backdrop"
      ) {
        this.setState({ showMobileSearch: false, searchQuery: "" });
      }

      // --- Handlers for Mobile Edit Mode ---
      if (e.target.closest("#cancel-edit-mode-btn")) {
        this._fadeOutHeaderAndCloseEditMode();
      }
      if (e.target.closest("#edit-character-btn")) {
        if (this.state.mobileEditModeCharacterId) {
          this.editCharacter(this.state.mobileEditModeCharacterId, e);
          this._fadeOutHeaderAndCloseEditMode();
        }
      }
      if (e.target.closest("#delete-character-btn")) {
        const deleteBtn = e.target.closest("#delete-character-btn");
        if (deleteBtn && this.state.mobileEditModeCharacterId) {
          const characterId = parseInt(deleteBtn.dataset.characterId);
          this.deleteCharacter(characterId);
          this._fadeOutHeaderAndCloseEditMode();
        }
      }
    });

    appElement.addEventListener("input", (e) => {
      handleSidebarInput(e, this);
      handleMainChatInput(e, this);
      handleModalInput(e, this);
      handleSNSInput(e, this); // SNS 관련 input 이벤트 처리
      if (e.target.id === "new-message-input") {
        adjustMessageContainerPadding();
      }
    });

    appElement.addEventListener("change", (e) => {
      handleMainChatChange(e, this);
      handleModalChange(e, this);
      handleSNSInput(e, this); // SNS 관련 change 이벤트 처리
    });

    appElement.addEventListener("keypress", (e) => {
      handleMainChatKeypress(e, this);
      handleSNSKeypress(e, this); // SNS 관련 keypress 이벤트 처리
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".input-area-container")) {
        this.setState({ showInputOptions: false });
      }

      // Close FAB menu if clicked outside
      if (
        this.state.showFabMenu &&
        !e.target.closest("#fab-menu-toggle") &&
        !e.target.closest(".fab-menu")
      ) {
        this.setState({ showFabMenu: false });
      }
    });
  }

  // --- CHAT ROOM MANAGEMENT ---
  async migrateChatData() {
    const migrationCompleted = await loadFromBrowserStorage(
      "personaChat_migration_v17",
      false,
    );

    // Check if prompts need migration (old format detection)
    const oldSettings = await loadFromBrowserStorage(
      "personaChat_settings_v16",
      {},
    );
    const hasOldPrompts =
      oldSettings &&
      oldSettings.prompts &&
      oldSettings.prompts.main &&
      typeof oldSettings.prompts.main === "object" &&
      oldSettings.prompts.main.system_rules;

    // Run migration if not completed OR if old prompts are detected (backup restoration case)
    if (migrationCompleted && !hasOldPrompts) return;

    // Migrate old prompts
    if (hasOldPrompts) {
      const newPrompts = {
        mainChat: Object.values(oldSettings.prompts.main).join("\n\n"),
        characterSheet: oldSettings.prompts.character_sheet_generation,
        profileCreation: oldSettings.prompts.profile_creation,
      };

      const filteredPrompts = Object.fromEntries(
        Object.entries(newPrompts).filter(([, v]) => v !== undefined),
      );
      await saveAllPrompts(filteredPrompts);

      delete oldSettings.prompts;
      await saveToBrowserStorage("personaChat_settings_v16", oldSettings);
    }

    const oldMessages = { ...this.state.messages };
    const newChatRooms = { ...this.state.chatRooms };
    const newMessages = { ...this.state.messages };

    this.state.characters.forEach((character) => {
      const characterId = character.id;
      const oldMessagesForChar = oldMessages[characterId];

      if (newChatRooms[characterId] && newChatRooms[characterId].length > 0)
        return;

      const isOldStructure =
        oldMessagesForChar && Array.isArray(oldMessagesForChar);

      if (isOldStructure && oldMessagesForChar.length > 0) {
        const defaultChatRoomId = `${characterId}_default_${Date.now()}`;
        const defaultChatRoom = {
          id: defaultChatRoomId,
          characterId: characterId,
          name: t("ui.defaultChatName"),
          createdAt: Date.now(),
          lastActivity: Date.now(),
        };

        newChatRooms[characterId] = [defaultChatRoom];
        newMessages[defaultChatRoomId] = oldMessagesForChar;
      } else if (
        !newChatRooms[characterId] ||
        newChatRooms[characterId].length === 0
      ) {
        // Create a default chat room if none exist for the character
        const defaultChatRoomId = `${characterId}_default_${Date.now()}`;
        const defaultChatRoom = {
          id: defaultChatRoomId,
          characterId: characterId,
          name: t("ui.defaultChatName"),
          createdAt: Date.now(),
          lastActivity: Date.now(),
        };
        newChatRooms[characterId] = [defaultChatRoom];
        newMessages[defaultChatRoomId] = [];
      }
    });

    this.setState({
      chatRooms: newChatRooms,
      messages: newMessages,
    });

    saveToBrowserStorage("personaChat_migration_v17", true);
  }

  getFirstAvailableChatRoom() {
    for (const character of this.state.characters) {
      const chatRooms = this.state.chatRooms[character.id] || [];
      if (chatRooms.length > 0) {
        return chatRooms[0].id;
      }
    }
    return null;
  }

  createNewChatRoom(characterId, chatName = null) {
    if (!chatName) chatName = t("ui.newChatName");
    const numericCharacterId = Number(characterId);
    const newChatRoomId = `${numericCharacterId}_${Date.now()}_${Math.random()}`;
    const newChatRoom = {
      id: newChatRoomId,
      characterId: numericCharacterId,
      name: chatName,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };

    const characterChatRooms = [
      ...(this.state.chatRooms[numericCharacterId] || []),
    ];
    characterChatRooms.unshift(newChatRoom);

    const newChatRooms = {
      ...this.state.chatRooms,
      [numericCharacterId]: characterChatRooms,
    };
    const newMessages = { ...this.state.messages, [newChatRoomId]: [] };

    this.setState({
      chatRooms: newChatRooms,
      messages: newMessages,
    });

    // Force save immediately, bypassing the debounce
    saveToBrowserStorage("personaChat_chatRooms_v16", newChatRooms);
    saveToBrowserStorage("personaChat_messages_v16", newMessages);

    return newChatRoomId;
  }

  toggleCharacterExpansion(characterId) {
    const numericCharacterId = Number(characterId);
    const newExpandedIds = new Set(this.state.expandedCharacterIds);
    if (newExpandedIds.has(numericCharacterId)) {
      newExpandedIds.delete(numericCharacterId);
    } else {
      newExpandedIds.add(numericCharacterId);
    }
    this.setState({ expandedCharacterIds: newExpandedIds });
  }

  createNewChatRoomForCharacter(characterId) {
    const numericCharacterId = Number(characterId);
    const newChatRoomId = this.createNewChatRoom(numericCharacterId);
    this.selectChatRoom(newChatRoomId);
    const newExpandedIds = new Set(this.state.expandedCharacterIds);
    newExpandedIds.add(numericCharacterId);
    this.setState({ expandedCharacterIds: newExpandedIds });
  }

  selectChatRoom(chatRoomId) {
    const newUnreadCounts = { ...this.state.unreadCounts };
    delete newUnreadCounts[chatRoomId];

    this.setState({
      selectedChatId: chatRoomId,
      unreadCounts: newUnreadCounts,
      editingMessageId: null,
      sidebarCollapsed:
        window.innerWidth < 768 ? true : this.state.sidebarCollapsed,
    });
    setTimeout(() => this.scrollToBottom(), 0);
  }

  /**
   * @param {string | number} characterId
   * @param {Event | null} e
   */
  editCharacter(characterId, e = null) {
    const numericCharacterId = Number(characterId);
    const character = this.state.characters.find(
      (c) => c.id === numericCharacterId,
    );
    if (character) {
      this.openEditCharacterModal(character, e);
    }
  }

  deleteCharacter(characterId) {
    const numericCharacterId = Number(characterId);
    this.handleDeleteCharacter(numericCharacterId);
  }

  getCurrentChatRoom() {
    if (!this.state.selectedChatId) return null;

    // Check group chats first
    if (this.isGroupChat(this.state.selectedChatId)) {
      return this.state.groupChats[this.state.selectedChatId] || null;
    }

    // Check open chats
    if (this.isOpenChat(this.state.selectedChatId)) {
      return this.state.openChats[this.state.selectedChatId] || null;
    }

    // Check regular chat rooms
    for (const characterId in this.state.chatRooms) {
      const chatRooms = this.state.chatRooms[characterId];
      const chatRoom = chatRooms.find(
        (room) => room.id === this.state.selectedChatId,
      );
      if (chatRoom) return chatRoom;
    }
    return null;
  }

  deleteChatRoom(chatRoomId) {
    const chatRoom = this.getChatRoomById(chatRoomId);
    if (!chatRoom) return;

    this.showConfirmModal(
      t("ui.deleteChatRoom"),
      t("ui.deleteChatRoomConfirm"),
      () => {
        const newChatRooms = { ...this.state.chatRooms };
        const newMessages = { ...this.state.messages };
        const newUnreadCounts = { ...this.state.unreadCounts };

        newChatRooms[chatRoom.characterId] = newChatRooms[
          chatRoom.characterId
        ].filter((room) => room.id !== chatRoomId);

        delete newMessages[chatRoomId];
        delete newUnreadCounts[chatRoomId];

        let newSelectedChatId = this.state.selectedChatId;
        if (this.state.selectedChatId === chatRoomId) {
          newSelectedChatId = this.getFirstAvailableChatRoom();
        }

        this.setState({
          chatRooms: newChatRooms,
          messages: newMessages,
          unreadCounts: newUnreadCounts,
          selectedChatId: newSelectedChatId,
          modal: { isOpen: false, title: "", message: "", onConfirm: null },
        });
      },
    );
  }

  startEditingChatRoom(chatRoomId) {
    this.setState({ editingChatRoomId: chatRoomId });
  }

  cancelEditingChatRoom() {
    this.setState({ editingChatRoomId: null });
  }

  saveChatRoomName(chatRoomId, newName) {
    const newNameTrimmed = newName.trim();
    if (newNameTrimmed === "") {
      this.cancelEditingChatRoom();
      return;
    }

    const chatRoom = this.getChatRoomById(chatRoomId);
    if (!chatRoom) return;

    const { characterId } = chatRoom;

    this.setState({
      chatRooms: {
        ...this.state.chatRooms,
        [characterId]: this.state.chatRooms[characterId].map((room) =>
          room.id === chatRoomId ? { ...room, name: newNameTrimmed } : room,
        ),
      },
      editingChatRoomId: null,
    });
  }

  handleChatRoomNameKeydown(event, chatRoomId) {
    if (event.key === "Escape") {
      event.preventDefault();
      this.cancelEditingChatRoom();
    } else if (event.key === "Enter") {
      event.preventDefault();
      const input = document.getElementById(
        `chat-room-name-input-${chatRoomId}`,
      );
      if (input) {
        this.saveChatRoomName(chatRoomId, input.value);
      }
    }
  }

  getChatRoomById(chatRoomId) {
    for (const characterId in this.state.chatRooms) {
      const chatRoom = this.state.chatRooms[characterId].find(
        (room) => room.id === chatRoomId,
      );
      if (chatRoom) return chatRoom;
    }
    return null;
  }

  // --- USER STICKER MANAGEMENT ---
  toggleUserStickerPanel() {
    this.setState({ showUserStickerPanel: !this.state.showUserStickerPanel });
  }

  toggleStickerSize(messageId) {
    
    // messageId를 숫자로 변환 (HTML data-attribute에서 가져온 값은 문자열이므로)
    const numericMessageId = parseFloat(messageId);
    
    const expandedStickers = new Set(this.state.expandedStickers);
    
    const wasExpanded = expandedStickers.has(numericMessageId);
    
    if (wasExpanded) {
      expandedStickers.delete(numericMessageId);
      console.log(`⬇️ 축소 처리 - ID ${numericMessageId} 제거함`);
    } else {
      expandedStickers.add(numericMessageId);
      console.log(`⬆️ 확대 처리 - ID ${numericMessageId} 추가함`);
    }
    
    
    this.setState({ expandedStickers });
  }

  sendUserSticker(stickerName, stickerData, stickerType = "image/png") {
    this.setState({
      showUserStickerPanel: false,
      stickerToSend: {
        stickerName,
        data: stickerData,
        type: stickerType,
      },
    });

    const messageInput = document.getElementById("new-message-input");
    if (messageInput) {
      messageInput.focus();
    }
  }

  handleSendMessageWithSticker() {
    const messageInput = document.getElementById("new-message-input");
    const content = messageInput ? messageInput.value : "";
    const hasImage = !!this.state.imageToSend;
    const hasStickerToSend = !!this.state.stickerToSend;

    if (hasStickerToSend) {
      const messageContent = content.trim();

      this.handleSendMessage(messageContent, "sticker", {
        stickerName: this.state.stickerToSend.stickerName,
        data: this.state.stickerToSend.data,
        type: this.state.stickerToSend.type,
        hasText: messageContent.length > 0,
        textContent: messageContent,
      });

      this.setState({
        stickerToSend: null,
        showInputOptions: false,
        currentMessage: "",
      });

      if (messageInput) {
        messageInput.value = "";
        messageInput.style.height = "auto";
      }
    } else {
      this.handleSendMessage(content, hasImage ? "image" : "text");
    }
  }

  addUserStickerWithType(name, data, type) {
    const newSticker = {
      id: Date.now(),
      name: name,
      data: data,
      type: type,
      createdAt: Date.now(),
    };
    const newStickers = [...this.state.userStickers, newSticker];
    this.setState({ userStickers: newStickers });
  }

  deleteUserSticker(stickerId) {
    const newStickers = this.state.userStickers.filter(
      (s) => s.id !== stickerId,
    );
    this.setState({ userStickers: newStickers });
  }

  editUserStickerName(stickerId) {
    const sticker = this.state.userStickers.find((s) => s.id === stickerId);
    if (!sticker) return;

    const newName = prompt(t("ui.enterStickerName"), sticker.name);
    if (newName !== null && newName.trim() !== "") {
      const newStickers = this.state.userStickers.map((s) =>
        s.id === stickerId ? { ...s, name: newName.trim() } : s,
      );
      this.setState({ userStickers: newStickers });
    }
  }

  calculateUserStickerSize() {
    return this.state.userStickers.reduce((total, sticker) => {
      if (sticker.data) {
        const base64Length = sticker.data.split(",")[1]?.length || 0;
        return total + base64Length * 0.75;
      }
      return total;
    }, 0);
  }

  async handleUserStickerFileSelect(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    for (const file of files) {
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/gif",
        "image/png",
        "image/bmp",
        "image/webp",
        "video/webm",
        "video/mp4",
        "audio/mpeg",
        "audio/mp3",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert(t("modal.unsupportedFileType.message") + file.name);
        continue;
      }

      if (file.size > 30 * 1024 * 1024) {
        alert(t("modal.fileTooLarge.message") + file.name);
        continue;
      }

      try {
        let dataUrl;
        if (file.type.startsWith("image/")) {
          dataUrl = await this.compressImageForSticker(file, 1024, 1024, 0.85);
        } else {
          dataUrl = await this.toBase64(file);
        }
        const stickerName = file.name.split(".")[0];
        this.addUserStickerWithType(stickerName, dataUrl, file.type);
      } catch (error) {
        console.error(t("ui.fileProcessingError"), error);
        alert(t("ui.fileProcessingAlert"));
      }
    }
    e.target.value = "";
  }

  // --- HANDLERS & LOGIC ---
  scrollToBottom() {
    const messagesEnd = document.getElementById("messages-end-ref");
    if (messagesEnd) {
      messagesEnd.scrollIntoView();
    }
  }

  showInfoModal(title, message) {
    this.setState({
      modal: {
        isOpen: true,
        type: "confirmation",
        title,
        message,
        onConfirm: null,
      },
    });
  }

  showConfirmModal(title, message, onConfirm) {
    this.setState({
      modal: { isOpen: true, type: "confirmation", title, message, onConfirm },
    });
  }

  async showModal(type, data, e = null) {
    const modalState = { isOpen: true, type, ...data };
    await this.setState({ modal: modalState });

    if (e && type === "chatSelection") {
      requestAnimationFrame(() => {
        const modalBackdrop = document.querySelector(
          "#chat-selection-modal-backdrop",
        );
        const modalContent = document.querySelector(
          "#chat-selection-modal-backdrop [data-modal-content]",
        );

        if (modalContent && modalBackdrop) {
          // Animate backdrop
          modalBackdrop.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: 450, // Match modal animation duration
            easing: "ease-in-out",
            fill: "forwards",
          });

          // Animate modal content
          const rect = modalContent.getBoundingClientRect();
          const initialScale = 0.1;
          const modalCenterX = rect.left + rect.width / 2;
          const modalCenterY = rect.top + rect.height / 2;
          const initialX = e.clientX - modalCenterX;
          const initialY = e.clientY - modalCenterY;

          modalContent.style.opacity = 0; // Prevent flash

          modalContent.animate(
            [
              {
                transform: `translate(${initialX}px, ${initialY}px) scale(${initialScale})`,
                opacity: 0,
              },
              { transform: "translate(0, 0) scale(1)", opacity: 1 },
            ],
            {
              duration: 450,
              easing: "cubic-bezier(0.215, 0.610, 0.355, 1)",
              fill: "forwards",
            },
          );
        }
      });
    }
  }

  hideModal(event) {
    // Prevent closing when clicking inside the modal content
    if (event && event.target.closest("[data-modal-content]")) {
      return;
    }
    this.setState({
      modal: { isOpen: false, title: "", message: "", onConfirm: null },
    });
  }

  async closeChatSelectionModal() {
    const modalBackdrop = document.querySelector(
      "#chat-selection-modal-backdrop",
    );
    const modalContent = document.querySelector(
      "#chat-selection-modal-backdrop [data-modal-content]",
    );
    const character = this.state.modal.character;

    if (!modalContent || !modalBackdrop || !character) {
      this.hideModal();
      return;
    }

    const characterEl = document.querySelector(
      `.character-list-item[data-character-id="${character.id}"]`,
    );

    // If character element is not visible (e.g. scrolled out of view), just hide modal
    if (!characterEl) {
      this.hideModal();
      return;
    }

    const charRect = characterEl.getBoundingClientRect();
    const modalRect = modalContent.getBoundingClientRect();

    const destX = charRect.left + charRect.width / 2;
    const destY = charRect.top + charRect.height / 2;

    const startX = modalRect.left + modalRect.width / 2;
    const startY = modalRect.top + modalRect.height / 2;

    const translateX = destX - startX;
    const translateY = destY - startY;

    const backdropAnimation = modalBackdrop.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      {
        duration: 300, // Faster than open
        easing: "ease-in-out",
        fill: "forwards",
      },
    );

    const contentAnimation = modalContent.animate(
      [
        { transform: "translate(0, 0) scale(1)", opacity: 1 },
        {
          transform: `translate(${translateX}px, ${translateY}px) scale(0.1)`,
          opacity: 0,
        },
      ],
      {
        duration: 300,
        easing: "cubic-bezier(0.550, 0.055, 0.675, 0.190)", // EaseInQuad
        fill: "forwards",
      },
    );

    await Promise.all([backdropAnimation.finished, contentAnimation.finished]);

    this.hideModal();
  }

  handleCreateNewChatRoom() {
    const { character } = this.state.modal;
    if (character) {
      const newChatRoomId = this.createNewChatRoom(character.id);
      this.selectChatRoom(newChatRoomId);
      this.hideModal();
    }
  }

  handleModelSelect(model) {
    this.setState({ settings: { ...this.state.settings, model } });
  }

  /**
   * @param {Event | null} e
   */
  openNewCharacterModal(e = null) {
    this.setState({
      editingCharacter: { memories: [], proactiveEnabled: true },
      showCharacterModal: true,
      stickerSelectionMode: false,
      selectedStickerIndices: [],
      modalOpeningEvent: e,
    });

    requestAnimationFrame(() => {
      const modalBackdrop = document.getElementById("character-modal-backdrop");
      if (modalBackdrop) {
        modalBackdrop.classList.add("backdrop-blur-sm");
      }
    });
  }

  /**
   * @param {object} character
   * @param {Event | null} e
   */
  openEditCharacterModal(character, e = null) {
    this.setState({
      editingCharacter: { ...character, memories: character.memories || [] },
      showCharacterModal: true,
      stickerSelectionMode: false,
      selectedStickerIndices: [],
      modalOpeningEvent: e,
    });

    requestAnimationFrame(() => {
      const modalBackdrop = document.getElementById("character-modal-backdrop");
      if (modalBackdrop) {
        modalBackdrop.classList.add("backdrop-blur-sm");
      }
    });
  }

  closeCharacterModal() {
    const modalBackdrop = document.getElementById("character-modal-backdrop");
    if (modalBackdrop) {
      modalBackdrop.classList.remove("backdrop-blur-sm");
      const modalPanel = modalBackdrop.querySelector("#character-modal-panel");
      if (modalPanel) {
        modalPanel.classList.add("animate-modal-fade-out");
      }
      modalBackdrop.classList.add("animate-backdrop-fade-out");

      setTimeout(() => {
        this.setState({
          showCharacterModal: false,
          editingCharacter: null,
          stickerSelectionMode: false,
          selectedStickerIndices: [],
        });
      }, MODAL_FADE_OUT_DURATION_MS); // Match animation duration
    } else {
      // Fallback if modal not found
      this.setState({
        showCharacterModal: false,
        editingCharacter: null,
        stickerSelectionMode: false,
        selectedStickerIndices: [],
      });
    }
  }

  openCharacterEditMode(characterId) {
    this.setState({ mobileEditModeCharacterId: characterId });
  }

  closeCharacterEditMode() {
    this.setState({ mobileEditModeCharacterId: null });
  }

  _fadeOutHeaderAndCloseEditMode() {
    const header = document.getElementById("mobile-edit-header");
    if (header) {
        header.classList.remove("animate-fade-in");
        header.classList.add("animate-fade-out");
        setTimeout(() => {
            this.closeCharacterEditMode();
        }, HEADER_FADE_OUT_DURATION_MS);
    } else {
        this.closeCharacterEditMode();
    }
  }

  handleAvatarChange(e, isCard = false) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (isCard) {
        this.loadCharacterFromImage(file);
      } else {
        this.toBase64(file).then((base64) => {
          const currentEditing = this.state.editingCharacter || {};
          this.setState({
            editingCharacter: { ...currentEditing, avatar: base64 },
          });
        });
      }
    }
  }

  async handleStickerFileSelect(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const currentStickers = this.state.editingCharacter?.stickers || [];
    const newStickers = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (i > 0 && i % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (file.size > 30 * 1024 * 1024) {
        this.showInfoModal(
          t("ui.fileSizeExceeded"),
          t("ui.fileSizeExceededMessage", {
            fileName: file.name,
            sizeLimit: "30MB",
          }),
        );
        continue;
      }

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/gif",
        "image/png",
        "image/bmp",
        "image/webp",
        "video/webm",
        "video/mp4",
        "audio/mpeg",
        "audio/mp3",
      ];
      if (!allowedTypes.includes(file.type)) {
        this.showInfoModal(
          t("ui.unsupportedFormat"),
          t("ui.unsupportedFormatMessage", { fileName: file.name }),
        );
        continue;
      }

      try {
        let dataUrl;
        let processedSize = file.size;

        if (file.type.startsWith("image/")) {
          if (file.type === "image/gif") {
            dataUrl = await this.toBase64(file);
          } else {
            dataUrl = await this.compressImageForSticker(
              file,
              1024,
              1024,
              0.85,
            );
            const compressedBase64 = dataUrl.split(",")[1];
            processedSize = Math.round(compressedBase64.length * 0.75);
          }
        } else {
          dataUrl = await this.toBase64(file);
        }

        const sticker = {
          id: Date.now() + Math.random(),
          name: file.name,
          type: file.type,
          dataUrl: dataUrl,
          originalSize: file.size,
          size: processedSize,
        };
        newStickers.push(sticker);
      } catch (error) {
        console.error(
          t("ui.stickerProcessingErrorConsole", { fileName: file.name }),
          error,
        );
        this.showInfoModal(
          t("ui.stickerProcessingError"),
          t("ui.stickerProcessingErrorMessage", { fileName: file.name }),
        );
      }
    }

    if (newStickers.length > 0) {
      const currentEditing = this.state.editingCharacter || {};
      const updatedStickers = [...currentStickers, ...newStickers];
      const updatedCharacterData = {
        ...currentEditing,
        stickers: updatedStickers,
      };

      const characterDataString = JSON.stringify(updatedCharacterData);
      const storageCheck = await checkIndexedDBQuota(
        characterDataString,
        "personaChat_characters_v16",
      );

      if (!storageCheck.canSave) {
        this.showInfoModal(t("ui.storageFull"), t("ui.storageFullMessage"));
        return;
      }

      this.shouldSaveCharacters = true;
      this.setState({ editingCharacter: updatedCharacterData });
    }

    e.target.value = "";
  }

  handleDeleteSticker(index) {
    const currentStickers = this.state.editingCharacter?.stickers || [];
    const updatedStickers = currentStickers.filter((_, i) => i !== index);
    const currentEditing = this.state.editingCharacter || {};
    this.setState({
      editingCharacter: { ...currentEditing, stickers: updatedStickers },
    });
  }

  handleEditStickerName(index) {
    if (this.state.editingCharacter && this.state.editingCharacter.stickers) {
      const sticker = this.state.editingCharacter.stickers[index];
      if (!sticker) return;

      const newName = prompt(t("ui.enterStickerName"), sticker.name);
      if (newName !== null && newName.trim() !== "") {
        const newStickers = [...this.state.editingCharacter.stickers];
        newStickers[index] = { ...sticker, name: newName.trim() };
        this.setState({
          editingCharacter: {
            ...this.state.editingCharacter,
            stickers: newStickers,
          },
        });
      }
    }
  }

  toggleStickerSelectionMode() {
    this.state.stickerSelectionMode = !this.state.stickerSelectionMode;
    this.state.selectedStickerIndices = [];
    this.updateStickerSection();
  }

  updateStickerSection() {
    const stickerContainer = document.getElementById("sticker-container");
    if (stickerContainer) {
      const currentStickers = this.state.editingCharacter?.stickers || [];
      stickerContainer.innerHTML = renderStickerGrid(this, currentStickers);
    }

    const toggleButton = document.getElementById("toggle-sticker-selection");
    if (toggleButton) {
      const textSpan = toggleButton.querySelector(".toggle-text");
      if (textSpan)
        textSpan.innerHTML = this.state.stickerSelectionMode
          ? t("system.selectModeDeselect")
          : t("system.selectModeSelect");
    }

    let selectAllButton = document.getElementById("select-all-stickers");
    if (this.state.stickerSelectionMode) {
      if (!selectAllButton) {
        const selectAllHTML = `
                    <button id="select-all-stickers" class="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex flex-col items-center gap-1">
                        <i data-lucide="check-circle" class="w-4 h-4"></i>
                        <span class="text-xs">${t("system.selectAll")}</span>
                    </button>
                `;
        toggleButton.insertAdjacentHTML("afterend", selectAllHTML);
      }
    } else {
      if (selectAllButton) selectAllButton.remove();
    }

    const deleteButton = document.getElementById("delete-selected-stickers");
    if (deleteButton && !this.state.stickerSelectionMode) {
      deleteButton.disabled = true;
      deleteButton.classList.add("opacity-50", "cursor-not-allowed");
      const countSpan = deleteButton.querySelector("#selected-count");
      if (countSpan) countSpan.textContent = "0";
    }

    if (window.lucide) window.lucide.createIcons();
  }

  handleStickerSelection(index, isChecked) {
    const currentSelected = this.state.selectedStickerIndices || [];
    let newSelected = isChecked
      ? [...currentSelected, index]
      : currentSelected.filter((i) => i !== index);
    this.state.selectedStickerIndices = newSelected;

    const countElement = document.getElementById("selected-count");
    const deleteButton = document.getElementById("delete-selected-stickers");

    if (countElement) countElement.textContent = newSelected.length;

    if (deleteButton) {
      if (newSelected.length > 0) {
        deleteButton.disabled = false;
        deleteButton.classList.remove("opacity-50", "cursor-not-allowed");
      } else {
        deleteButton.disabled = true;
        deleteButton.classList.add("opacity-50", "cursor-not-allowed");
      }
    }
  }

  handleSelectAllStickers() {
    const currentStickers = this.state.editingCharacter?.stickers || [];
    const allIndices = currentStickers.map((_, index) => index);
    this.state.selectedStickerIndices = allIndices;

    document
      .querySelectorAll(".sticker-checkbox")
      .forEach((cb) => (cb.checked = true));

    const countElement = document.getElementById("selected-count");
    const deleteButton = document.getElementById("delete-selected-stickers");

    if (countElement) countElement.textContent = allIndices.length;
    if (deleteButton) {
      deleteButton.disabled = false;
      deleteButton.classList.remove("opacity-50", "cursor-not-allowed");
    }
  }

  handleDeleteSelectedStickers() {
    const selectedIndices = this.state.selectedStickerIndices || [];
    if (selectedIndices.length === 0) return;

    const currentStickers = this.state.editingCharacter?.stickers || [];
    const selectedSet = new Set(selectedIndices);
    const updatedStickers = currentStickers.filter(
      (_, index) => !selectedSet.has(index),
    );

    this.state.editingCharacter = {
      ...this.state.editingCharacter,
      stickers: updatedStickers,
    };
    this.state.selectedStickerIndices = [];
    this.state.stickerSelectionMode = false;

    this.updateStickerSection();
  }

  async handleSaveCharacter() {
    const name = document.getElementById("character-name").value.trim();
    const prompt = document.getElementById("character-prompt").value.trim();
    const appearance = document.getElementById("character-appearance")?.value.trim() || "";

    if (!name || !prompt) {
      this.showInfoModal(
        t("modal.characterNameDescriptionNotFulfilled.title"),
        t("modal.characterNameDescriptionNotFulfilled.message"),
      );
      return;
    }

    const memoryNodes = document.querySelectorAll(".memory-input");
    const memories = Array.from(memoryNodes)
      .map((input) => input.value.trim())
      .filter(Boolean);

    const proactiveToggle = document.getElementById(
      "character-proactive-toggle",
    );
    const proactiveEnabled = proactiveToggle
      ? proactiveToggle.checked
      : this.state.editingCharacter?.proactiveEnabled !== false;

    // NAI 설정 수집
    const naiSettings = {
      ...(this.state.editingCharacter?.naiSettings || {}),
      autoGenerate: document.getElementById("character-nai-enabled")?.checked || false,
      qualityPrompt: document.getElementById("character-nai-quality-prompt")?.value.trim() || "masterpiece, best quality, high resolution, detailed"
    };

    const characterData = {
      name,
      prompt,
      appearance,
      avatar: this.state.editingCharacter?.avatar || null,
      responseTime: document.getElementById("character-responseTime").value,
      thinkingTime: document.getElementById("character-thinkingTime").value,
      reactivity: document.getElementById("character-reactivity").value,
      tone: document.getElementById("character-tone").value,
      memories,
      proactiveEnabled,
      messageCountSinceLastSummary:
        this.state.editingCharacter?.messageCountSinceLastSummary || 0,
      media: this.state.editingCharacter?.media || [],
      stickers: this.state.editingCharacter?.stickers || [],
      naiSettings,
      hypnosis: {
        enabled: document.getElementById('hypnosis-enabled')?.checked || false,
        affection: document.getElementById('hypnosis-affection-override')?.checked ? 
          (document.getElementById('hypnosis-affection') ? parseFloat(document.getElementById('hypnosis-affection').value) / 100 : null) : null,
        intimacy: document.getElementById('hypnosis-affection-override')?.checked ? 
          (document.getElementById('hypnosis-intimacy') ? parseFloat(document.getElementById('hypnosis-intimacy').value) / 100 : null) : null,
        trust: document.getElementById('hypnosis-affection-override')?.checked ? 
          (document.getElementById('hypnosis-trust') ? parseFloat(document.getElementById('hypnosis-trust').value) / 100 : null) : null,
        romantic_interest: document.getElementById('hypnosis-affection-override')?.checked ? 
          (document.getElementById('hypnosis-romantic') ? parseFloat(document.getElementById('hypnosis-romantic').value) / 100 : null) : null,
        force_love_unlock: document.getElementById('hypnosis-force-love')?.checked || false,
        sns_edit_access: document.getElementById('hypnosis-sns-edit')?.checked || false,
        affection_override: document.getElementById('hypnosis-affection-override')?.checked || false,
        sns_full_access: document.getElementById('hypnosis-sns-access')?.checked || false,
        secret_account_access: document.getElementById('hypnosis-secret-account')?.checked || false
      },
      snsPosts: this.state.editingCharacter?.snsPosts || []
    };

    const characterDataString = JSON.stringify(characterData);
    const storageCheck = await checkIndexedDBQuota(
      characterDataString,
      "personaChat_characters_v16",
    );

    if (!storageCheck.canSave) {
      this.showInfoModal(
        t("system.storageFullTitle"),
        t("system.storageFullMessage"),
      );
      return;
    }

    if (this.state.editingCharacter && this.state.editingCharacter.id) {
      const updatedCharacters = this.state.characters.map((c) =>
        c.id === this.state.editingCharacter.id
          ? { ...c, ...characterData }
          : c,
      );
      this.shouldSaveCharacters = true;
      this.setState({ characters: updatedCharacters });
    } else {
      const newCharacter = {
        id: Date.now(),
        ...characterData,
        messageCountSinceLastSummary: 0,
        proactiveEnabled: true,
        media: [],
      };
      const newCharacters = [newCharacter, ...this.state.characters];
      // Create a default chat room for the new character and get its ID
      const newChatRoomId = this.createNewChatRoom(newCharacter.id);
      this.shouldSaveCharacters = true;
      this.setState({
        characters: newCharacters,
        // messages are already updated by createNewChatRoom
        selectedChatId: newChatRoomId, // Set selectedChatId to the new chat room's ID
      });
    }
    this.closeCharacterModal();
  }

  /**
   * 외모 프롬프트 테스트 - 현재 입력된 외모 설정으로 이미지 생성
   */
  async testAppearancePrompt(e) {
    e.preventDefault();
    
    // 현재 외모 입력 필드에서 값 가져오기
    const appearanceInput = document.getElementById("character-appearance");
    if (!appearanceInput) {
      console.error('[Test] 외모 입력 필드를 찾을 수 없습니다');
      return;
    }

    const appearance = appearanceInput.value.trim();
    if (!appearance) {
      this.showInfoModal('외모 설명 필요', '외모 설명을 입력해주세요.');
      return;
    }

    // NAI 설정 확인
    const naiApiKey = this.state.settings.naiSettings?.apiKey;
    if (!naiApiKey) {
      this.showInfoModal('NAI API 키 필요', 'NAI API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.');
      return;
    }

    // StickerManager 초기화
    if (!this.stickerManager) {
      const { StickerManager } = await import("./services/stickerManager.js");
      this.stickerManager = new StickerManager(this);
    }

    // 현재 편집 중인 캐릭터의 NAI 설정 가져오기
    const characterNaiSettings = this.state.editingCharacter?.naiSettings || {};
    
    // 테스트 캐릭터 객체 생성 (캐릭터별 NAI 설정 포함)
    const testCharacter = {
      id: 'test',
      name: '테스트',
      appearance: appearance,
      naiSettings: characterNaiSettings
    };

    // StickerManager NAI 클라이언트 초기화 확인
    if (!this.stickerManager.initializeNAI()) {
      this.showInfoModal('NAI 초기화 실패', 'NAI API 키가 설정되지 않았습니다. 설정에서 NAI API 키를 입력해주세요.');
      return;
    }

    const button = e.target.closest('button');
    const originalText = button.innerHTML;
    
    try {
      button.disabled = true;
      button.innerHTML = '<i data-lucide="loader" class="w-3 h-3 animate-spin pointer-events-none"></i> 테스트 중...';
      
      // happy 감정으로 테스트 스티커 생성
      const result = await this.stickerManager.naiClient.generateSticker(testCharacter, 'happy', {
        naiSettings: this.state.settings.naiSettings || {}
      });

      // generateSticker는 성공 시 스티커 객체를 직접 반환
      if (result && result.dataUrl) {
        // 이미지 실제 크기 확인
        const img = new Image();
        img.onload = () => {
          console.log('[Test] 생성된 이미지 실제 크기:', {
            width: img.width,
            height: img.height,
            비율: `${img.width}x${img.height}`
          });
        };
        img.src = result.dataUrl;
        
        // 내부 모달로 이미지 표시 (setState가 자동으로 UI 업데이트하고 이벤트 리스너 설정)
        this.showImageResultModal(result.dataUrl, appearance);
      } else {
        throw new Error(result?.error || '이미지 생성 실패');
      }
    } catch (error) {
      console.error('[Test] 외모 프롬프트 테스트 실패:', error);
      this.showInfoModal('테스트 실패', `외모 프롬프트 테스트 실패: ${error.message}`);
    } finally {
      // 버튼 복구
      button.disabled = false;
      button.innerHTML = originalText;
    }
  }

  showImageResultModal(imageUrl, promptText) {
    this.setState({
      imageResultModal: {
        isOpen: true,
        imageUrl: imageUrl,
        promptText: promptText
      }
    });
  }

  // 이미지 결과 모달 닫기
  closeImageResultModal() {
    this.setState({
      imageResultModal: {
        isOpen: false,
        imageUrl: null,
        promptText: null
      }
    });
  }


  handleDeleteCharacter(characterId) {
    const numericCharacterId = Number(characterId);
    this.showConfirmModal(
      t("modal.characterDeleteConfirm.title"),
      t("modal.characterDeleteConfirm.message"),
      () => {
        const newCharacters = this.state.characters.filter(
          (c) => c.id !== numericCharacterId,
        );
        const newMessages = { ...this.state.messages };
        const newChatRooms = { ...this.state.chatRooms };
        const newUnreadCounts = { ...this.state.unreadCounts };

        const characterChatRooms =
          this.state.chatRooms[numericCharacterId] || [];
        characterChatRooms.forEach((chatRoom) => {
          delete newMessages[chatRoom.id];
          delete newUnreadCounts[chatRoom.id];
        });

        delete newChatRooms[numericCharacterId];
        // Removed: delete newMessages[characterId]; // Messages are keyed by chatRoomId, not characterId

        let newSelectedChatId = this.state.selectedChatId;
        const selectedChatRoom = this.getCurrentChatRoom();
        if (
          selectedChatRoom &&
          selectedChatRoom.characterId === numericCharacterId
        ) {
          newSelectedChatId = this.getFirstAvailableChatRoom();
        }

        const newExpandedIds = new Set(this.state.expandedCharacterIds);
        newExpandedIds.delete(numericCharacterId);

        this.setState({
          characters: newCharacters,
          messages: newMessages,
          chatRooms: newChatRooms,
          unreadCounts: newUnreadCounts,
          selectedChatId: newSelectedChatId,
          expandedCharacterIds: newExpandedIds,
          // Close the confirmation modal after deletion is complete
          modal: { isOpen: false, title: "", message: "", onConfirm: null },
        });
      },
    );
  }

  async handleImageFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      this.showInfoModal(
        t("modal.imageFileSizeExceeded.title"),
        t("modal.imageFileSizeExceeded.message"),
      );
      e.target.value = "";
      return;
    }

    try {
      const resizedDataUrl = await this.resizeImage(file, 800, 800);
      this.setState({
        imageToSend: { dataUrl: resizedDataUrl, file },
        showInputOptions: false,
      });
    } catch (error) {
      console.error("Image processing error:", error);
      this.showInfoModal(
        t("modal.imageProcessingError.title"),
        t("modal.imageProcessingError.message"),
      );
    } finally {
      e.target.value = "";
    }
  }

  async handleSendMessage(content, type = "text", stickerData = null) {
    const { selectedChatId, isWaitingForResponse, settings, imageToSend } =
      this.state;

    if (!selectedChatId || isWaitingForResponse) return;
    if (type === "text" && !content.trim() && !imageToSend) return;
    if (type === "image" && !imageToSend) return;
    if (type === "sticker" && !stickerData) return;

    // Persona stickers do not require an API key (as they are local)
    const isPersonaSticker =
      type === "sticker" && stickerData && !stickerData.requiresAPI;
    const isGroupOrOpenChat =
      this.isGroupChat(selectedChatId) || this.isOpenChat(selectedChatId);

    // Check for API key only when necessary (excluding persona stickers or stickers in group/open chats)
    if (
      !settings.apiKey &&
      !isPersonaSticker &&
      (!isGroupOrOpenChat || type !== "sticker")
    ) {
      this.showInfoModal(
        t("modal.apiKeyRequired.title"),
        t("modal.apiKeyRequired.message"),
      );
      this.setState({ showSettingsModal: true });
      return;
    }

    const userMessage = {
      id: Date.now(),
      sender: "user",
      type: type,
      content: content,
      time: new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isMe: true,
      ...(type === "sticker" && stickerData ? { stickerData } : {}),
    };

    // Branch based on chat room type
    const isGroupChatType = this.isGroupChat(selectedChatId);
    const isOpenChatType = this.isOpenChat(selectedChatId);

    if (isOpenChatType) {
      // Handle open chat messages
      await this.handleOpenChatMessage(userMessage);
    } else if (isGroupChatType) {
      // Handle group chat messages
      await this.handleGroupChatMessage(userMessage);
    } else {
      // Handle individual chat messages (existing logic)
      await this.handleIndividualChatMessage(userMessage, type);
    }
  }

  async handleIndividualChatMessage(userMessage, type) {
    const { selectedChatId, imageToSend } = this.state;
    const selectedChatRoom = this.getCurrentChatRoom();
    if (!selectedChatRoom) return;

    const charIndex = this.state.characters.findIndex(
      (c) => c.id === selectedChatRoom.characterId,
    );
    if (charIndex === -1) return;
    const updatedCharacters = [...this.state.characters];

    if (type === "image") {
      const character = { ...updatedCharacters[charIndex] };
      if (!character.media) character.media = [];
      const newImage = {
        id: `img_${Date.now()}`,
        dataUrl: imageToSend.dataUrl,
        mimeType: imageToSend.file.type,
      };
      character.media.push(newImage);
      updatedCharacters[charIndex] = character;
      userMessage.imageId = newImage.id;
    }

    const newMessagesForChat = [
      ...(this.state.messages[selectedChatId] || []),
      userMessage,
    ];
    const newMessagesState = {
      ...this.state.messages,
      [selectedChatId]: newMessagesForChat,
    };

    if (type === "text" || type === "image") {
      const messageInput = document.getElementById("new-message-input");
      if (messageInput) {
        messageInput.value = "";
        messageInput.style.height = "auto";
      }
    }

    const character = { ...updatedCharacters[charIndex] };
    character.messageCountSinceLastSummary =
      (character.messageCountSinceLastSummary || 0) + 1;

    let forceSummary = false;
    if (character.messageCountSinceLastSummary >= 30) {
      forceSummary = true;
      character.messageCountSinceLastSummary = 0;
    }
    updatedCharacters[charIndex] = character;

    this.setState({
      messages: newMessagesState,
      isWaitingForResponse: true,
      characters: updatedCharacters,
      imageToSend: null,
      currentMessage: "",
    });
    this.scrollToBottom();

    this.triggerApiCall(newMessagesState, false, false, forceSummary);
  }

  async handleGroupChatMessage(userMessage) {
    const { selectedChatId, imageToSend } = this.state;
    const { type } = userMessage;

    // Handle images (temporarily attach to user message in group chats)
    if (type === "image" && imageToSend) {
      userMessage.imageData = {
        id: `img_${Date.now()}`,
        dataUrl: imageToSend.dataUrl,
        mimeType: imageToSend.file.type,
      };
    }

    // Add message to group chat
    const currentMessages = this.state.messages[selectedChatId] || [];
    const newMessages = [...currentMessages, userMessage];
    const newMessagesState = {
      ...this.state.messages,
      [selectedChatId]: newMessages,
    };

    // Reset UI input field
    if (type === "text" || type === "image") {
      const messageInput = document.getElementById("new-message-input");
      if (messageInput) {
        messageInput.value = "";
        messageInput.style.height = "auto";
      }
    }

    this.setState({
      messages: newMessagesState,
      isWaitingForResponse: true,
      imageToSend: null,
      stickerToSend: null,
      currentMessage: "",
    });
    this.scrollToBottom();

    // Save immediately
    console.log("Saving group chat messages:", {
      chatId: selectedChatId,
      messageCount: newMessages.length,
      totalChats: Object.keys(newMessagesState).length,
    });
    saveToBrowserStorage("personaChat_messages_v16", newMessagesState);

    // Generate AI responses from group chat participants
    await this.triggerGroupChatAIResponse(selectedChatId, newMessages);
  }

  async handleOpenChatMessage(userMessage) {
    const { selectedChatId, imageToSend } = this.state;
    const { type } = userMessage;

    // Handle images
    if (type === "image" && imageToSend) {
      userMessage.imageData = {
        id: `img_${Date.now()}`,
        dataUrl: imageToSend.dataUrl,
        mimeType: imageToSend.file.type,
      };
    }

    // Add message to open chat
    const currentMessages = this.state.messages[selectedChatId] || [];
    const newMessages = [...currentMessages, userMessage];
    const newMessagesState = {
      ...this.state.messages,
      [selectedChatId]: newMessages,
    };

    // Reset UI input field
    if (type === "text" || type === "image") {
      const messageInput = document.getElementById("new-message-input");
      if (messageInput) {
        messageInput.value = "";
        messageInput.style.height = "auto";
      }
    }

    this.setState({
      messages: newMessagesState,
      isWaitingForResponse: true,
      imageToSend: null,
      stickerToSend: null,
      currentMessage: "",
    });
    this.scrollToBottom();

    // Save immediately
    console.log("Saving open chat messages:", {
      chatId: selectedChatId,
      messageCount: newMessages.length,
      totalChats: Object.keys(newMessagesState).length,
    });
    saveToBrowserStorage("personaChat_messages_v16", newMessagesState);

    // Trigger AI responses and dynamic joining/leaving in open chat
    await this.triggerOpenChatAIResponse(selectedChatId, newMessages);
  }

  async triggerGroupChatAIResponse(groupChatId, messages) {
    const groupChat = this.state.groupChats[groupChatId];
    if (!groupChat) {
      this.setState({ isWaitingForResponse: false });
      return;
    }

    const participants = this.getGroupChatParticipants(groupChatId);
    if (participants.length === 0) {
      this.setState({ isWaitingForResponse: false });
      return;
    }

    try {
      const groupSettings = groupChat.settings || {};
      const responseFrequency = groupSettings.responseFrequency || 0.8;
      const maxRespondingCharacters =
        groupSettings.maxRespondingCharacters || 2;
      const responseDelay = groupSettings.responseDelay || 800;

      // Check overall response frequency
      const shouldRespond = Math.random() <= responseFrequency;
      if (!shouldRespond) {
        this.setState({ isWaitingForResponse: false });
        return;
      }

      // Filter active participants
      const activeParticipants = participants.filter((p) => {
        const participantSettings = groupSettings.participantSettings?.[p.id];
        return participantSettings ? participantSettings.isActive : true;
      });

      if (activeParticipants.length === 0) {
        this.setState({ isWaitingForResponse: false });
        return;
      }

      // Determine number of responding characters
      const shuffledParticipants = [...activeParticipants].sort(
        () => Math.random() - 0.5,
      );
      const respondingCount = Math.min(
        Math.ceil(Math.random() * maxRespondingCharacters),
        activeParticipants.length,
      );
      const respondingCharacters = shuffledParticipants.slice(
        0,
        respondingCount,
      );

      // Generate responses from each character sequentially
      for (let i = 0; i < respondingCharacters.length; i++) {
        const character = respondingCharacters[i];

        // Apply configured response delay
        if (i > 0) {
          const baseDelay = responseDelay;
          const randomVariation = Math.random() * 300; // ±0.3s random
          await new Promise((resolve) =>
            setTimeout(resolve, baseDelay + randomVariation),
          );
        }

        // Get real-time message state
        const currentMessages = this.state.messages[groupChatId] || [];

        // Get current API settings
        const { settings } = this.state;
        const currentProvider = settings.apiProvider;
        const currentConfig = settings.apiConfigs?.[currentProvider];

        if (!currentConfig?.apiKey) {
          console.error("API key not found for provider:", currentProvider);
          continue;
        }

        const response = await this.callAIForGroupChat(
          currentConfig.apiKey,
          currentConfig.model,
          settings.userName,
          settings.userDescription,
          character,
          currentMessages,
          participants,
          groupChatId,
        );

        if (response && !response.error && response.messages) {
          await this.processGroupChatAIResponse(
            groupChatId,
            character,
            response,
          );
        }
      }
    } finally {
      this.setState({ isWaitingForResponse: false });
    }
  }

  async triggerOpenChatAIResponse(openChatId, messages) {
    const openChat = this.state.openChats[openChatId];
    if (!openChat) {
      this.setState({ isWaitingForResponse: false });
      return;
    }

    try {
      // Select from currently participating characters only
      const currentParticipants = openChat.currentParticipants || [];
      const allCharacters = currentParticipants
        .map((id) => this.state.characters.find((c) => c.id === id))
        .filter(Boolean);

      if (allCharacters.length === 0) {
        console.log(
          "No participants in open chat, triggering initial joins...",
        );
        await this.triggerInitialOpenChatJoins(openChatId);
        this.setState({ isWaitingForResponse: false });
        return;
      }

      // Probabilistically select a responding character
      const responseChance = 0.7; // 70% chance someone will respond
      if (Math.random() > responseChance) {
        this.setState({ isWaitingForResponse: false });
        return;
      }

      const respondingCharacter =
        allCharacters[Math.floor(Math.random() * allCharacters.length)];
      console.log(
        "Selected responding character for open chat:",
        respondingCharacter.name,
      );

      // Get current API settings
      const { settings } = this.state;
      const currentProvider = settings.apiProvider;
      const currentConfig = settings.apiConfigs?.[currentProvider];

      if (!currentConfig?.apiKey) {
        console.error("API key not found for provider:", currentProvider);
        this.setState({ isWaitingForResponse: false });
        return;
      }

      const response = await this.callAIForOpenChat(
        currentConfig.apiKey,
        currentConfig.model,
        settings.userName,
        settings.userDescription,
        respondingCharacter,
        messages,
        allCharacters,
        openChatId,
      );

      if (response && !response.error && response.messages) {
        await this.processOpenChatAIResponse(
          openChatId,
          respondingCharacter,
          response,
        );
      }

      // Update participant states (decide joins/leaves)
      await this.updateParticipantStates(
        openChatId,
        currentParticipants,
        messages,
      );
    } finally {
      this.setState({ isWaitingForResponse: false });
    }
  }

  getGroupChatParticipants(groupChatId) {
    const groupChat = this.state.groupChats[groupChatId];
    if (!groupChat || !groupChat.participantIds) return [];

    return groupChat.participantIds
      .map((id) => this.state.characters.find((char) => char.id === id))
      .filter((char) => char !== undefined);
  }

  async callAIForGroupChat(
    apiKey,
    model,
    userName,
    userDescription,
    character,
    messages,
    allParticipants,
    groupChatId,
    customContext = null,
  ) {
    // Get group chat info
    const groupChat = this.state.groupChats[groupChatId];
    const groupChatName = groupChat ? groupChat.name : "Group Chat";

    // Construct special prompt for group chat context
    const otherParticipants = allParticipants.filter(
      (p) => p.id !== character.id,
    );

    // Construct detailed info of other participants
    const participantDetails = otherParticipants
      .map((p) => {
        const basicInfo = p.prompt
          ? p.prompt
              .split("\n")
              .slice(0, 3)
              .join(" ")
              .replace(/[#*]/g, "")
              .trim()
          : "";
        return `- ${p.name}: ${basicInfo || "Character"}`;
      })
      .join("\n");

    const groupPrompt =
      this.state.settings.prompts.main.group_chat_context ||
      this.defaultPrompts.main.group_chat_context;
    const defaultGroupContext = groupPrompt
      .replace(/{participantCount}/g, allParticipants.length + 1)
      .replace(/{userName}/g, userName)
      .replace(/{participantDetails}/g, participantDetails)
      .replace(/{characterName}/g, character.name)
      .replace(/{groupChatName}/g, groupChatName);

    // Use custom context if available, otherwise use default group chat context
    const contextToUse = customContext || defaultGroupContext;
    const finalUserDescription = userDescription + "\n" + contextToUse;

    const { settings } = this.state;
    const currentProvider = settings.apiProvider;
    const currentConfig = settings.apiConfigs?.[currentProvider];

    // Extract API options for all providers
    const options = {
      maxTokens: currentConfig.maxTokens,
      temperature: currentConfig.temperature,
      profileMaxTokens: currentConfig.profileMaxTokens,
      profileTemperature: currentConfig.profileTemperature,
    };

    // Direct API call using APIManager
    const response = await this.apiManager.generateContent(
      currentProvider,
      currentConfig.apiKey,
      currentConfig.model,
      {
        userName: userName,
        userDescription: finalUserDescription,
        character: character,
        history: messages,
        prompts: settings.prompts,
        isProactive: false,
        forceSummary: false,
      },
      currentConfig.baseUrl,
      options,
    );

    return response;
  }

  async processGroupChatAIResponse(groupChatId, character, response) {
    // Prepare structured log data (only if debug logs are enabled)
    if (this.state.enableDebugLogs) {
      const structuredLogData = {
        personaInput: {
          characterName: character.name,
          characterPrompt: character.prompt,
          characterMemories: character.memories || [],
          characterId: character.id,
        },
        systemPrompt: {
          system_rules: this.state.settings.prompts.main.system_rules,
          role_and_objective:
            this.state.settings.prompts.main.role_and_objective,
          memory_generation: this.state.settings.prompts.main.memory_generation,
          character_acting: this.state.settings.prompts.main.character_acting,
          message_writing: this.state.settings.prompts.main.message_writing,
          language: this.state.settings.prompts.main.language,
          additional_instructions:
            this.state.settings.prompts.main.additional_instructions,
          group_chat_context:
            this.state.settings.prompts.main.group_chat_context,
        },
        outputResponse: response,
        parameters: {
          hasCharacterState: !!response.characterState,
          hasMessages: !!response.messages,
          hasNewMemory: !!response.newMemory,
          hasReactionDelay: !!response.reactionDelay,
          messageCount: response.messages?.length || 0,
        },
        metadata: {
          chatType: "group",
          chatId: groupChatId,
          characterId: character.id,
          hasCharacterState: !!response.characterState,
          hasMessages: !!response.messages,
          hasNewMemory: !!response.newMemory,
          hasReactionDelay: !!response.reactionDelay,
          messageCount: response.messages?.length || 0,
          characterState: response.characterState,
          newMemory: response.newMemory || null,
          timestamp: Date.now(),
          apiProvider: this.state.settings.apiProvider,
          model:
            this.state.settings.apiConfigs?.[this.state.settings.apiProvider]
              ?.model,
        },
      };

      this.addStructuredLog(
        groupChatId,
        "group",
        character.name,
        structuredLogData,
      );
    }

    // Process characterState response if it exists
    if (response.characterState) {
      this.updateCharacterState(character.id, response.characterState);
    } else {
      console.warn(`⚠️ characterState not included in response:`, response);
    }

    // Add new memory to character if it exists
    if (response.newMemory && response.newMemory.trim() !== "") {
      const charIndex = this.state.characters.findIndex(
        (c) => c.id === character.id,
      );
      if (charIndex !== -1) {
        const updatedCharacters = [...this.state.characters];
        updatedCharacters[charIndex] = {
          ...updatedCharacters[charIndex],
          memories: [
            ...(updatedCharacters[charIndex].memories || []),
            response.newMemory,
          ],
        };
        this.setState({ characters: updatedCharacters });
        saveToBrowserStorage("personaChat_characters_v16", updatedCharacters);
      }
    }

    // Add response messages to group chat sequentially (for_update style)
    if (response.messages && response.messages.length > 0) {
      const currentMessages = this.state.messages[groupChatId] || [];

      for (let i = 0; i < response.messages.length; i++) {
        const msgPart = response.messages[i];

        // Simulate response delay
        if (i === 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, response.reactionDelay || 1000),
          );
          this.setState({ typingCharacterId: character.id });
        } else {
          await new Promise((resolve) =>
            setTimeout(resolve, msgPart.delay || 1000),
          );
        }

        const aiMessage = {
          id: Date.now() + Math.random(),
          sender: character.name,
          characterId: character.id,
          content: msgPart.content,
          time: new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isMe: false,
          type: msgPart.sticker ? "sticker" : "text",
          ...(msgPart.sticker
            ? {
                sticker: msgPart.sticker,
                stickerId: msgPart.sticker,
                stickerData: { stickerName: msgPart.sticker },
              }
            : {}),
        };

        const newMessages = [...this.state.messages[groupChatId], aiMessage];
        const newMessagesState = {
          ...this.state.messages,
          [groupChatId]: newMessages,
        };

        this.setState({
          messages: newMessagesState,
          typingCharacterId: null,
        });
        this.scrollToBottom();

        // Save after each message
        saveToBrowserStorage("personaChat_messages_v16", newMessagesState);
      }
    }
  }

  async callAIForOpenChat(
    apiKey,
    model,
    userName,
    userDescription,
    character,
    messages,
    allParticipants,
    openChatId,
  ) {
    // Get open chat info
    const openChat = this.state.openChats[openChatId];
    const openChatName = openChat ? openChat.name : "Open Chat";

    // Construct special prompt for open chat context
    const otherParticipants = allParticipants.filter(
      (p) => p.id !== character.id,
    );

    // Construct detailed info of other open chat participants
    const openChatParticipants = otherParticipants
      .map((p) => {
        const basicInfo = p.prompt
          ? p.prompt
              .split("\n")
              .slice(0, 3)
              .join(" ")
              .replace(/[#*]/g, "")
              .trim()
          : "";
        return `- ${p.name}: ${basicInfo || "Character"}`;
      })
      .join("\n");

    const openPrompt =
      this.state.settings.prompts.main.open_chat_context ||
      this.defaultPrompts.main.open_chat_context;
    const openChatContext = openPrompt
      .replace(/{userName}/g, userName)
      .replace(
        /{participantDetails}/g,
        openChatParticipants || "- (No other participants)",
      )
      .replace(/{characterName}/g, character.name)
      .replace(/{openChatName}/g, openChatName);

    // Include message_writing prompt (required for characterState field in open chat)
    const messageWritingPrompt =
      this.state.settings.prompts.main.message_writing ||
      this.defaultPrompts.main.message_writing;
    const combinedContext = messageWritingPrompt + "\n\n" + openChatContext;

    return await this.callAIForGroupChat(
      apiKey,
      model,
      userName,
      userDescription,
      character,
      messages,
      allParticipants,
      combinedContext,
    );
  }

  async processOpenChatAIResponse(openChatId, character, response) {
    // Prepare structured log data (only if debug logs are enabled)
    if (this.state.enableDebugLogs) {
      const structuredLogData = {
        personaInput: {
          characterName: character.name,
          characterPrompt: character.prompt,
          characterMemories: character.memories || [],
          characterId: character.id,
        },
        systemPrompt: {
          system_rules: this.state.settings.prompts.main.system_rules,
          role_and_objective:
            this.state.settings.prompts.main.role_and_objective,
          memory_generation: this.state.settings.prompts.main.memory_generation,
          character_acting: this.state.settings.prompts.main.character_acting,
          message_writing: this.state.settings.prompts.main.message_writing,
          language: this.state.settings.prompts.main.language,
          additional_instructions:
            this.state.settings.prompts.main.additional_instructions,
          open_chat_context: this.state.settings.prompts.main.open_chat_context,
        },
        outputResponse: response,
        parameters: {
          hasCharacterState: !!response.characterState,
          hasMessages: !!response.messages,
          hasNewMemory: !!response.newMemory,
          hasReactionDelay: !!response.reactionDelay,
          messageCount: response.messages?.length || 0,
        },
        metadata: {
          chatType: "open",
          chatId: openChatId,
          characterId: character.id,
          hasCharacterState: !!response.characterState,
          hasMessages: !!response.messages,
          hasNewMemory: !!response.newMemory,
          hasReactionDelay: !!response.reactionDelay,
          messageCount: response.messages?.length || 0,
          characterState: response.characterState,
          newMemory: response.newMemory || null,
          timestamp: Date.now(),
          apiProvider: this.state.settings.apiProvider,
          model:
            this.state.settings.apiConfigs?.[this.state.settings.apiProvider]
              ?.model,
        },
      };

      this.addStructuredLog(
        openChatId,
        "open",
        character.name,
        structuredLogData,
      );
    }

    // Process characterState response if it exists
    if (response.characterState) {
      this.updateCharacterState(character.id, response.characterState);
    } else {
      console.warn(`⚠️ characterState not included in response:`, response);
    }

    // Add new memory to character if it exists
    if (response.newMemory && response.newMemory.trim() !== "") {
      const charIndex = this.state.characters.findIndex(
        (c) => c.id === character.id,
      );
      if (charIndex !== -1) {
        const updatedCharacters = [...this.state.characters];
        updatedCharacters[charIndex] = {
          ...updatedCharacters[charIndex],
          memories: [
            ...(updatedCharacters[charIndex].memories || []),
            response.newMemory,
          ],
        };
        this.setState({ characters: updatedCharacters });
        saveToBrowserStorage("personaChat_characters_v16", updatedCharacters);
      }
    }

    // Add response messages to open chat sequentially (for_update style)
    if (response.messages && response.messages.length > 0) {
      const currentMessages = this.state.messages[openChatId] || [];

      for (let i = 0; i < response.messages.length; i++) {
        const msgPart = response.messages[i];

        // Simulate response delay
        if (i === 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, response.reactionDelay || 1000),
          );
          this.setState({ typingCharacterId: character.id });
        } else {
          await new Promise((resolve) =>
            setTimeout(resolve, msgPart.delay || 1000),
          );
        }

        const aiMessage = {
          id: Date.now() + Math.random(),
          sender: character.name,
          characterId: character.id,
          content: msgPart.content,
          time: new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isMe: false,
          type: msgPart.sticker ? "sticker" : "text",
          ...(msgPart.sticker
            ? {
                sticker: msgPart.sticker,
                stickerId: msgPart.sticker,
                stickerData: { stickerName: msgPart.sticker },
              }
            : {}),
        };

        const newMessages = [...this.state.messages[openChatId], aiMessage];
        const newMessagesState = {
          ...this.state.messages,
          [openChatId]: newMessages,
        };

        this.setState({
          messages: newMessagesState,
          typingCharacterId: null,
        });
        this.scrollToBottom();

        // Save after each message
        saveToBrowserStorage("personaChat_messages_v16", newMessagesState);
      }
    }
  }

  async triggerInitialOpenChatJoins(openChatId) {
    // Randomly have 2-4 characters join initially
    const availableCharacters = this.state.characters;
    const joinCount = Math.floor(Math.random() * 3) + 2; // 2-4 characters
    const shuffled = [...availableCharacters].sort(() => Math.random() - 0.5);
    const initialJoiners = shuffled.slice(
      0,
      Math.min(joinCount, availableCharacters.length),
    );

    for (const character of initialJoiners) {
      setTimeout(() => {
        this.characterJoinOpenChat(openChatId, character.id, true);
      }, Math.random() * 5000); // Join after 0-5 seconds
    }
  }

  characterJoinOpenChat(openChatId, characterId, isInitial = false) {
    const openChat = this.state.openChats[openChatId];
    const character = this.state.characters.find((c) => c.id === characterId);
    if (!openChat || !character) return;

    // Ignore if already participating
    if (openChat.currentParticipants.includes(characterId)) return;

    const newOpenChats = { ...this.state.openChats };
    newOpenChats[openChatId] = {
      ...openChat,
      currentParticipants: [...openChat.currentParticipants, characterId],
      participantHistory: [
        ...(openChat.participantHistory || []),
        {
          characterId,
          action: "join",
          timestamp: Date.now(),
        },
      ],
    };

    // Update character state
    this.initializeCharacterState(characterId);
    const newCharacterStates = { ...this.state.characterStates };
    if (!newCharacterStates[characterId]) {
      newCharacterStates[characterId] = {};
    }
    newCharacterStates[characterId] = {
      ...newCharacterStates[characterId],
      currentRooms: [
        ...(newCharacterStates[characterId].currentRooms || []),
        openChatId,
      ],
      lastActivity: Date.now(),
    };

    this.setState({
      openChats: newOpenChats,
      characterStates: newCharacterStates,
    });

    // Add join message (if not initial join)
    if (!isInitial) {
      this.addSystemMessage(
        openChatId,
        `${character.name} has joined.`,
        "join",
      );
    }

    saveToBrowserStorage("personaChat_openChats_v16", newOpenChats);
    saveToBrowserStorage("personaChat_characterStates_v16", newCharacterStates);
  }

  characterLeaveOpenChat(openChatId, characterId, reason = "left") {
    const openChat = this.state.openChats[openChatId];
    const character = this.state.characters.find((c) => c.id === characterId);
    if (!openChat || !character) return;

    const newOpenChats = { ...this.state.openChats };
    newOpenChats[openChatId] = {
      ...openChat,
      currentParticipants: openChat.currentParticipants.filter(
        (id) => id !== characterId,
      ),
      participantHistory: [
        ...(openChat.participantHistory || []),
        {
          characterId,
          action: "leave",
          reason,
          timestamp: Date.now(),
        },
      ],
    };

    // Update character state
    const newCharacterStates = { ...this.state.characterStates };
    if (newCharacterStates[characterId]) {
      newCharacterStates[characterId] = {
        ...newCharacterStates[characterId],
        currentRooms: (
          newCharacterStates[characterId].currentRooms || []
        ).filter((id) => id !== openChatId),
      };
    }

    this.setState({
      openChats: newOpenChats,
      characterStates: newCharacterStates,
    });

    // Add leave message
    this.addSystemMessage(openChatId, `${character.name} has left.`, "leave");

    saveToBrowserStorage("personaChat_openChats_v16", newOpenChats);
    saveToBrowserStorage("personaChat_characterStates_v16", newCharacterStates);
  }

  async updateParticipantStates(openChatId, currentParticipants, messages) {
    const remainingParticipants = [];

    for (const participantId of currentParticipants) {
      const character = this.state.characters.find(
        (c) => c.id === participantId,
      );
      if (!character) continue;

      let characterState = this.state.characterStates[participantId];
      if (!characterState) {
        this.initializeCharacterState(participantId);
        characterState = this.state.characterStates[participantId];
        if (!characterState) continue;
      }

      // Decide whether to leave based on AI-analyzed characterState
      const { mood, socialBattery, energy, personality } = characterState;

      // Calculate leave probability based on AI-analyzed state
      let leaveChance = 0.1; // Base 10%

      // Utilize AI-analyzed state values
      if (socialBattery < 0.3) leaveChance += 0.3;
      if (mood < 0.3) leaveChance += 0.2;
      if (energy < 0.4) leaveChance += 0.15;
      leaveChance += (1 - (personality?.extroversion || 0.5)) * 0.2;

      if (Math.random() > Math.min(0.8, leaveChance)) {
        remainingParticipants.push(participantId);
      } else {
        console.log(`${character.name} left open chat due to low energy/mood`);
        this.characterLeaveOpenChat(openChatId, participantId, "tired");
      }
    }

    // Possibility of a new participant joining
    const shouldAddNewParticipant =
      Math.random() < 0.3 && remainingParticipants.length < 6;
    if (shouldAddNewParticipant) {
      const availableCharacters = this.state.characters.filter(
        (c) => !currentParticipants.includes(c.id) && c.id,
      );
      if (availableCharacters.length > 0) {
        const newParticipant =
          availableCharacters[
            Math.floor(Math.random() * availableCharacters.length)
          ];
        console.log(`${newParticipant.name} joined open chat randomly`);
        this.characterJoinOpenChat(openChatId, newParticipant.id, false);
      }
    }
  }

  addSystemMessage(chatId, content, type = "system") {
    const systemMessage = {
      id: Date.now() + Math.random(),
      sender: "system",
      content: content,
      type: type,
      time: new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isMe: false,
    };

    const currentMessages = this.state.messages[chatId] || [];
    const updatedMessages = [...currentMessages, systemMessage];
    const updatedMessagesState = {
      ...this.state.messages,
      [chatId]: updatedMessages,
    };

    this.setState({ messages: updatedMessagesState });
    saveToBrowserStorage("personaChat_messages_v16", updatedMessagesState);
  }

  async initializeCharacterState(characterId) {
    if (this.state.characterStates[characterId]) return;

    const defaultState = {
      mood: 0.7,
      socialBattery: 0.8,
      energy: 0.75,
      personality: {
        extroversion: 0.6,
        agreeableness: 0.7,
        conscientiousness: 0.6,
        neuroticism: 0.4,
        openness: 0.7,
      },
      currentRooms: [],
      lastActivity: Date.now(),
    };

    const newCharacterStates = {
      ...this.state.characterStates,
      [characterId]: defaultState,
    };
    this.setState({ characterStates: newCharacterStates });
    saveToBrowserStorage("personaChat_characterStates_v16", newCharacterStates);
  }

  updateCharacterState(characterId, characterState) {
    if (!characterState) return;

    // romantic_interest만 조건 확인하여 제한
    if (characterState.romantic_interest !== undefined) {
      const existing = this.state.characterStates[characterId];
      if (existing) {
        const minRequiredLevel = 0.5; // 50%
        if (!(existing.affection >= minRequiredLevel && 
              existing.intimacy >= minRequiredLevel && 
              existing.trust >= minRequiredLevel)) {
          // 조건 미충족시 romantic_interest 변화를 기존 값으로 고정
          characterState.romantic_interest = existing.romantic_interest;
        }
      }
    }

    const newCharacterStates = { ...this.state.characterStates };
    newCharacterStates[characterId] = {
      ...newCharacterStates[characterId],
      ...characterState,
      lastActivity: Date.now(),
    };

    this.setState({ characterStates: newCharacterStates });
    saveToBrowserStorage("personaChat_characterStates_v16", newCharacterStates);
    
    // Character Modal이 열려있고 해당 캐릭터의 상태가 업데이트된 경우, 최면 표시 값도 업데이트
    if (this.state.showCharacterModal && this.state.editingCharacter?.id === characterId) {
      // setState 이후 DOM이 업데이트될 때까지 기다린 후 최면 표시 값 업데이트
      setTimeout(() => {
        this.updateHypnosisDisplayValues(newCharacterStates[characterId]);
      }, 100);
    }
  }

  async triggerApiCall(
    currentMessagesState,
    isProactive = false,
    isReroll = false,
    forceSummary = false,
  ) {
    let chatId, character;

    if (isProactive) {
      character = currentMessagesState;
      const characterChatRooms = this.state.chatRooms[character.id] || [];
      chatId =
        characterChatRooms.length > 0
          ? characterChatRooms[0].id
          : this.createNewChatRoom(character.id);
    } else {
      chatId = this.state.selectedChatId;
      const chatRoom = this.getCurrentChatRoom();
      character = chatRoom
        ? this.state.characters.find((c) => c.id === chatRoom.characterId)
        : null;
    }

    let history;
    if (isProactive) {
      history = this.state.messages[chatId] || [];
      if (history.length > 0 && !history[history.length - 1].isMe) {
        history = history.slice(0, -1);
      }
    } else if (isReroll) {
      history = currentMessagesState;
    } else {
      history = currentMessagesState[chatId] || [];
    }

    if (!character) {
      this.setState({ isWaitingForResponse: false });
      return;
    }

    // Get API settings (including legacy compatibility)
    const apiProvider = this.state.settings.apiProvider || "gemini";
    const apiConfigs = this.state.settings.apiConfigs || {};
    let currentConfig = apiConfigs[apiProvider];

    // Legacy compatibility: use existing apiKey/model for gemini settings
    if (!currentConfig && apiProvider === "gemini") {
      currentConfig = {
        apiKey: this.state.settings.apiKey,
        model: this.state.settings.model,
      };
    }

    if (!currentConfig || !currentConfig.apiKey) {
      console.error("API configuration not found or API key missing");
      this.setState({ isWaitingForResponse: false });
      return;
    }

    // Extract API options for all providers
    const options = {
      maxTokens: currentConfig.maxTokens,
      temperature: currentConfig.temperature,
      profileMaxTokens: currentConfig.profileMaxTokens,
      profileTemperature: currentConfig.profileTemperature,
    };

    if (!this.state.settings.prompts) {
      this.state.settings.prompts = await getAllPrompts();
    }

    const response = await this.apiManager.generateContent(
      apiProvider,
      currentConfig.apiKey,
      currentConfig.model,
      {
        userName: this.state.settings.userName,
        userDescription: this.state.settings.userDescription,
        character: character,
        history: history,
        prompts: this.state.settings.prompts,
        isProactive: isProactive,
        forceSummary: forceSummary,
      },
      currentConfig.baseUrl, // for custom_openai
      options,
    );

    // Collect debug logs
    const structuredLogData = {
      personaInput: {
        characterName: character.name,
        characterPrompt: character.prompt,
        characterMemories: character.memories,
        characterId: character.id,
      },
      systemPrompt: this.state.settings.prompts,
      outputResponse: {
        messages: response.messages,
        newMemory: response.newMemory,
        characterState: response.characterState,
        reactionDelay: response.reactionDelay,
      },
      parameters: {
        model: currentConfig.model,
        isProactive,
        forceSummary,
        messageCount: history.length,
      },
      metadata: {
        chatId,
        chatType: "general",
        timestamp: new Date().toISOString(),
        apiProvider,
        model: currentConfig.model,
      },
    };

    this.addStructuredLog(chatId, "general", character.name, structuredLogData);

    // characterState 응답이 있으면 처리 (개별 채팅)
    if (response.characterState) {
      this.updateCharacterState(character.id, response.characterState);
    } else {
      console.warn(`⚠️ characterState가 응답에 포함되지 않음:`, response);
    }

    // 기존 newMemory 처리 - SNS 포스트로 변환
    if (response.newMemory && response.newMemory.trim() !== "") {
      const charIndex = this.state.characters.findIndex(
        (c) => c.id === character.id,
      );
      if (charIndex !== -1) {
        const updatedCharacters = [...this.state.characters];
        const charToUpdate = { ...updatedCharacters[charIndex] };
        
        const legacyMemoryPost = {
          type: "memory",
          content: response.newMemory.trim(),
          access_level: "main-public",
          importance: 5.0,
          tags: ["추억", "일상"],
          reason: "개별 대화 기반 기억"
        };
        
        updatedCharacters[charIndex] = this.processAutoPost(charToUpdate, legacyMemoryPost);
        this.shouldSaveCharacters = true;
        this.setState({ characters: updatedCharacters });
        console.log(
          `[Memory → SNS Post] for ${charToUpdate.name}: ${response.newMemory.trim()}`,
        );
      }
    }
    
    // 새로운 autoPost 처리
    if (response.autoPost) {
      const charIndex = this.state.characters.findIndex(
        (c) => c.id === character.id,
      );
      if (charIndex !== -1) {
        const updatedCharacters = [...this.state.characters];
        const charToUpdate = { ...updatedCharacters[charIndex] };
        
        updatedCharacters[charIndex] = this.processAutoPost(charToUpdate, response.autoPost);
        this.shouldSaveCharacters = true;
        this.setState({ characters: updatedCharacters });
      }
    }

    // NAI 자동 스티커 처리 (임시 스티커 생성, 저장하지 않음)
    let temporaryNAISticker = null;
    if (response.naiSticker && character.naiSettings?.autoGenerate) {
      try {
        temporaryNAISticker = await this.generateTemporaryNAISticker(character, response.naiSticker);
      } catch (error) {
        console.error('[NAI] 자동 스티커 생성 실패:', error);
      }
    }

    await this.sleep(response.reactionDelay || 1000);
    this.setState({ isWaitingForResponse: false, typingCharacterId: chatId });

    if (
      response.messages &&
      Array.isArray(response.messages) &&
      response.messages.length > 0
    ) {
      let currentChatMessages = this.state.messages[chatId] || [];
      let newUnreadCounts = { ...this.state.unreadCounts };

      for (let i = 0; i < response.messages.length; i++) {
        const messagePart = response.messages[i];
        await this.sleep(messagePart.delay || 1000);

        const botMessage = {
          id: Date.now() + Math.random(),
          sender: character.name,
          content: messagePart.content,
          time: new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isMe: false,
          isError: false,
          type: messagePart.sticker ? "sticker" : "text",
          hasText: !!(messagePart.content && messagePart.content.trim()),
        };

        if (messagePart.sticker) {
          botMessage.stickerId = messagePart.sticker;
          const foundSticker = character.stickers?.find((s) => {
            if (s.id == messagePart.sticker) return true;
            if (s.name === messagePart.sticker) return true;
            const baseFileName = s.name.replace(/\.[^/.]+$/, "");
            const searchFileName = String(messagePart.sticker).replace(
              /\.[^/.]+$/,
              "",
            );
            if (baseFileName === searchFileName) return true;
            return false;
          });
          botMessage.stickerName = foundSticker?.name || "Unknown Sticker";
        }

        // NAI 임시 스티커 처리 (응답의 첫 번째 메시지에만 적용)
        if (i === 0 && temporaryNAISticker) {
          botMessage.type = "sticker";
          botMessage.stickerId = temporaryNAISticker.id;
          botMessage.stickerName = temporaryNAISticker.name;
          botMessage.temporaryNAISticker = temporaryNAISticker; // 임시 스티커 데이터 포함
        }

        currentChatMessages = [...currentChatMessages, botMessage];

        if (isProactive && chatId !== this.state.selectedChatId) {
          newUnreadCounts[chatId] = (newUnreadCounts[chatId] || 0) + 1;
        }

        await this.setState({
          messages: { ...this.state.messages, [chatId]: currentChatMessages },
          unreadCounts: newUnreadCounts,
        });
        this.scrollToBottom();
      }
    } else {
      const errorMessage = {
        id: Date.now() + 1,
        sender: "System",
        content: response.error || t("chat.messageGenerationError"),
        time: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isMe: false,
        isError: true,
        type: "text",
      };
      const currentChatMessages = this.state.messages[chatId] || [];
      const newMessagesForChat = [...currentChatMessages, errorMessage];
      const newMessagesState = {
        ...this.state.messages,
        [chatId]: newMessagesForChat,
      };

      this.setState({
        messages: newMessagesState,
      });

      // Force save immediately
      saveToBrowserStorage("personaChat_messages_v16", newMessagesState);
    }

    this.setState({ typingCharacterId: null });
  }

  async checkAndSendProactiveMessages() {
    if (
      this.state.isWaitingForResponse ||
      !this.state.settings.apiKey ||
      !this.state.settings.proactiveChatEnabled
    )
      return;

    const eligibleCharacters = this.state.characters.filter((char) => {
      if (char.proactiveEnabled === false) return false;

      const reactivity = parseInt(char.reactivity, 10) || 5;
      const probability = 1.0 - reactivity * 0.095;
      if (Math.random() > probability) return false;

      const timeThreshold = reactivity * 60000;
      const history = this.state.messages[char.id];

      if (!history || history.length === 0) return true;

      const lastMessage = history[history.length - 1];
      const timeSinceLastMessage = Date.now() - lastMessage.id;
      return timeSinceLastMessage > timeThreshold;
    });

    if (eligibleCharacters.length > 0) {
      const character =
        eligibleCharacters[
          Math.floor(Math.random() * eligibleCharacters.length)
        ];
      console.log(`[Proactive] Sending message from ${character.name}`);
      await this.handleProactiveMessage(character);
    }
  }

  async handleProactiveMessage(character) {
    this.setState({ isWaitingForResponse: true });
    await this.triggerApiCall(character, true, false, false);
  }

  scheduleMultipleRandomChats() {
    const {
      randomCharacterCount,
      randomMessageFrequencyMin,
      randomMessageFrequencyMax,
    } = this.state.settings;
    const minMs = randomMessageFrequencyMin * 60000;
    const maxMs = randomMessageFrequencyMax * 60000;

    for (let i = 0; i < randomCharacterCount; i++) {
      const randomDelay =
        Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
      console.log(
        `Scheduling random character ${i + 1}/${randomCharacterCount} in ${
          randomDelay / 1000
        } seconds.`,
      );
      setTimeout(() => this.initiateSingleRandomCharacter(), randomDelay);
    }
  }

  async initiateSingleRandomCharacter() {
    const { userName, userDescription } = this.state.settings;
    if (!userName.trim() || !userDescription.trim()) {
      console.warn(
        "Cannot generate random character: User persona is not set.",
      );
      return;
    }

    // Get API settings (including legacy compatibility)
    const apiProvider = this.state.settings.apiProvider || "gemini";
    const apiConfigs = this.state.settings.apiConfigs || {};
    let currentConfig = apiConfigs[apiProvider];

    // Legacy compatibility: use existing apiKey/model for gemini settings
    if (!currentConfig && apiProvider === "gemini") {
      currentConfig = {
        apiKey: this.state.settings.apiKey,
        model: this.state.settings.model,
      };
    }

    if (!currentConfig || !currentConfig.apiKey) {
      console.error(
        "API configuration not found or API key missing for profile generation",
      );
      return;
    }

    try {
      // Extract API options for all providers
      const profileOptions = {
        maxTokens: currentConfig.maxTokens,
        temperature: currentConfig.temperature,
        profileMaxTokens: currentConfig.profileMaxTokens,
        profileTemperature: currentConfig.profileTemperature,
      };

      const profile = await this.apiManager.generateProfile(
        apiProvider,
        currentConfig.apiKey,
        currentConfig.model,
        {
          userName: userName,
          userDescription: userDescription,
          profileCreationPrompt: this.state.settings.prompts.profile_creation,
        },
        currentConfig.baseUrl, // for custom_openai
        profileOptions,
      );
      if (profile.error) {
        console.error("Failed to generate profile:", profile.error);
        return;
      }

      // Validate profile data
      if (
        !profile.name ||
        typeof profile.name !== "string" ||
        profile.name.trim() === ""
      ) {
        console.warn("Generated profile has invalid or empty name:", profile);
        return;
      }
      if (
        !profile.prompt ||
        typeof profile.prompt !== "string" ||
        profile.prompt.trim() === ""
      ) {
        console.warn("Generated profile has invalid or empty prompt:", profile);
        return;
      }

      const tempCharacter = {
        id: Date.now(),
        name: profile.name,
        prompt: profile.prompt,
        avatar: null,
        responseTime: String(Math.floor(Math.random() * 5) + 3),
        thinkingTime: String(Math.floor(Math.random() * 5) + 3),
        reactivity: String(Math.floor(Math.random() * 5) + 4),
        tone: String(Math.floor(Math.random() * 5) + 2),
        memories: [],
        proactiveEnabled: true,
        media: [],
        messageCountSinceLastSummary: 0,
        isRandom: true,
        stickers: [],
      };

      // Extract API options for all providers
      const apiOptions = {
        maxTokens: currentConfig.maxTokens,
        temperature: currentConfig.temperature,
        profileMaxTokens: currentConfig.profileMaxTokens,
        profileTemperature: currentConfig.profileTemperature,
      };

      const response = await this.apiManager.generateContent(
        apiProvider,
        currentConfig.apiKey,
        currentConfig.model,
        {
          userName: userName,
          userDescription: userDescription,
          character: tempCharacter,
          history: [],
          prompts: this.state.settings.prompts,
          isProactive: true,
          forceSummary: false,
        },
        currentConfig.baseUrl, // for custom_openai
        apiOptions,
      );

      // Collect debug logs for random character generation
      const randomCharLogData = {
        personaInput: {
          characterName: tempCharacter.name,
          characterPrompt: tempCharacter.prompt,
          characterMemories: tempCharacter.memories,
          characterId: tempCharacter.id,
        },
        systemPrompt: this.state.settings.prompts,
        outputResponse: {
          messages: response.messages,
          newMemory: response.newMemory,
          characterState: response.characterState,
          reactionDelay: response.reactionDelay,
        },
        parameters: {
          model: currentConfig.model,
          isProactive: true,
          forceSummary: false,
          messageCount: 0,
        },
        metadata: {
          chatId: null,
          chatType: "random_character",
          timestamp: Date.now(),
          apiProvider,
          model: currentConfig.model,
        },
      };

      this.addStructuredLog(
        null,
        "random_character",
        tempCharacter.name,
        randomCharLogData,
      );

      if (response.error) {
        console.error("Failed to get first message from API:", response.error);
        return;
      }
      if (
        !response.messages ||
        !Array.isArray(response.messages) ||
        response.messages.length === 0
      ) {
        console.warn("API did not return valid first messages:", response);
        return;
      }

      const firstMessages = response.messages.map((msgPart) => ({
        id: Date.now() + Math.random(),
        sender: tempCharacter.name,
        content: msgPart.content,
        time: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isMe: false,
        isError: false,
        type: "text",
      }));

      // Create a chat room for the new random character
      const newChatRoomId = this.createNewChatRoom(
        tempCharacter.id,
        "Random Chat",
      ); // This will update this.state.chatRooms and initialize messages[newChatRoomId] = []

      // Now, add the first messages to this newly created chat room
      const updatedMessagesForNewChatRoom = [...firstMessages];
      const newMessagesState = {
        ...this.state.messages,
        [newChatRoomId]: updatedMessagesForNewChatRoom,
      };

      const newCharacters = [tempCharacter, ...this.state.characters];
      const newUnreadCounts = {
        ...this.state.unreadCounts,
        [newChatRoomId]: firstMessages.length, // Key by chatRoomId
      };

      this.setState({
        characters: newCharacters,
        messages: newMessagesState, // Use the updated messages state
        unreadCounts: newUnreadCounts,
      });
    } catch (error) {
      console.error(
        "Failed to generate and initiate single random character:",
        error,
      );
    }
  }

  handleDeleteMessage(lastMessageId) {
    this.showConfirmModal(
      t("modal.messageGroupDeleteConfirm.title"),
      t("modal.messageGroupDeleteConfirm.message"),
      () => {
        const currentMessages =
          this.state.messages[this.state.selectedChatId] || [];
        const groupInfo = findMessageGroup(
          currentMessages,
          currentMessages.findIndex((msg) => msg.id === lastMessageId),
        );
        if (!groupInfo) return;

        const updatedMessages = [
          ...currentMessages.slice(0, groupInfo.startIndex),
          ...currentMessages.slice(groupInfo.endIndex + 1),
        ];

        this.setState({
          messages: {
            ...this.state.messages,
            [this.state.selectedChatId]: updatedMessages,
          },
        });
      },
    );
  }

  async handleSaveEditedMessage(lastMessageId) {
    const textarea = document.querySelector(
      `.edit-message-textarea[data-id="${lastMessageId}"]`,
    );
    if (!textarea) return;
    const newContent = textarea.value.trim();

    const currentMessages =
      this.state.messages[this.state.selectedChatId] || [];
    const groupInfo = findMessageGroup(
      currentMessages,
      currentMessages.findIndex((msg) => msg.id === lastMessageId),
    );
    if (!groupInfo) return;

    const originalMessage = currentMessages[groupInfo.startIndex];
    if (originalMessage.type === "text" && !newContent) {
      this.showInfoModal(
        t("modal.messageEmptyError.title"),
        t("modal.messageEmptyError.message"),
      );
      return;
    }

    const editedMessage = {
      ...originalMessage,
      id: Date.now(),
      content: newContent,
      time: new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const messagesBefore = currentMessages.slice(0, groupInfo.startIndex);
    const updatedMessages = [...messagesBefore, editedMessage];

    const newMessagesState = {
      ...this.state.messages,
      [this.state.selectedChatId]: updatedMessages,
    };

    this.setState({
      messages: newMessagesState,
      editingMessageId: null,
      isWaitingForResponse: true,
    });

    await this.triggerApiCall(updatedMessages, false, true, false);
  }

  async handleRerollMessage(lastMessageId) {
    const currentMessages =
      this.state.messages[this.state.selectedChatId] || [];
    const groupInfo = findMessageGroup(
      currentMessages,
      currentMessages.findIndex((msg) => msg.id === lastMessageId),
    );
    if (!groupInfo) return;

    const truncatedMessages = currentMessages.slice(0, groupInfo.startIndex);

    const newMessagesState = {
      ...this.state.messages,
      [this.state.selectedChatId]: truncatedMessages,
    };

    this.setState({
      messages: newMessagesState,
      isWaitingForResponse: true,
    });

    await this.triggerApiCall(truncatedMessages, false, true, false);
  }

  handleEditMessage(lastMessageId) {
    this.setState({ editingMessageId: lastMessageId });
  }

  async handleGenerateSNSPost(messageId) {
    // 마지막 대화 내용을 기반으로 SNS 포스트 강제 생성
    const chatId = this.state.selectedChatId;
    const messages = this.state.messages[chatId] || [];
    const targetMessage = messages.find(msg => msg.id === messageId);
    
    if (!targetMessage || targetMessage.isMe) {
      // console.log('[SNS Force] 사용자 메시지에는 SNS 포스트를 생성할 수 없습니다');
      return;
    }

    // 개별 채팅인 경우 chatId로 캐릭터 찾기
    let character = this.state.characters.find(c => c.id === chatId);
    
    // 그룹 채팅인 경우 메시지 발신자로 캐릭터 찾기
    if (!character && targetMessage) {
      character = this.state.characters.find(c => c.name === targetMessage.sender);
    }

    if (!character) {
      // console.log('[SNS Force] 캐릭터를 찾을 수 없습니다. chatId:', chatId, 'sender:', targetMessage?.sender);
      return;
    }

    try {
      // console.log(`[SNS Force] ${character.name}의 SNS 포스트 강제 생성 시작`);
      
      // 현재 사용자 정보 안전하게 가져오기 (settings 기반)
      const currentPersona = {
        name: this.state.settings.userName || "User",
        description: this.state.settings.userDescription || ""
      };
      
      // SNS 전용 프롬프트를 파일에서 로딩
      const recentConversation = messages.slice(-3).map(msg => `${msg.sender}: ${msg.content}`).join('\n');
      
      // 프롬프트 템플릿을 로딩하고 변수 치환
      let snsPromptTemplate = await getPrompt('snsForce');
      
      // 프롬프트 변수들을 실제 값으로 치환
      const snsPrompt = snsPromptTemplate
        .replace(/\{character\.name\}/g, character.name)
        .replace(/\{persona\.name\}/g, currentPersona.name)
        .replace(/\{persona\.description\}/g, currentPersona.description || '')
        .replace(/\{character\.prompt\}/g, character.prompt || '')
        .replace(/\{recentContext\}/g, recentConversation)
        .replace(/\{character\.responseTime\}/g, character.responseTime || 5)
        .replace(/\{character\.thinkingTime\}/g, character.thinkingTime || 5)
        .replace(/\{character\.reactivity\}/g, character.reactivity || 5)
        .replace(/\{character\.tone\}/g, character.tone || 5)
        .replace(/\{character\.currentState\.affection\}/g, character.currentState?.affection || 0.3)
        .replace(/\{character\.currentState\.intimacy\}/g, character.currentState?.intimacy || 0.1)
        .replace(/\{character\.currentState\.trust\}/g, character.currentState?.trust || 0.2)
        .replace(/\{character\.currentState\.romantic_interest\}/g, character.currentState?.romantic_interest || 0.0);

      // 직접 API 호출 (현재 선택된 프로바이더 사용)
      const selectedProvider = this.state.settings.apiProvider || 'gemini';
      const apiConfigs = this.state.settings.apiConfigs || {};
      let currentConfig = apiConfigs[selectedProvider];

      // 레거시 호환성: gemini의 경우 기존 설정 사용
      if (!currentConfig && selectedProvider === 'gemini') {
        currentConfig = {
          apiKey: this.state.settings.apiKey,
          model: this.state.settings.model,
        };
      }

      if (!currentConfig?.apiKey) {
        throw new Error('API 키가 설정되지 않았습니다.');
      }

      // 직접 API 클라이언트 호출 (단순 프롬프트용)
      const client = this.apiManager.getClient(
        selectedProvider,
        currentConfig.apiKey,
        currentConfig.model,
        currentConfig.baseUrl
      );
      
      // 직접 Gemini API 호출 (백업 방식 활용)
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${currentConfig.model}:generateContent?key=${currentConfig.apiKey}`;
      
      const payload = {
        contents: [{
          parts: [{ text: snsPrompt }]
        }],
        generationConfig: {
          temperature: currentConfig.temperature || 1.25,
          maxOutputTokens: currentConfig.maxTokens || 4096,
        }
      };

      console.log('[SNS Force] API 호출 정보:', {
        url: apiUrl,
        model: currentConfig.model,
        promptLength: snsPrompt.length
      });

      const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });


      if (!apiResponse.ok) {
        throw new Error(`Gemini API 호출 실패: ${apiResponse.status}`);
      }

      const apiData = await apiResponse.json();
      
      const responseText = apiData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        throw new Error('Gemini API에서 텍스트 응답을 받지 못했습니다.');
      }

      const response = {
        messages: [{
          content: responseText
        }]
      };

      if (!response || !response.messages || response.messages.length === 0) {
        throw new Error('API에서 유효한 응답을 받지 못했습니다.');
      }

      const snsResponseText = response.messages[0].content;

      // 응답이 텍스트 형태일 경우 JSON 파싱 시도
      let parsedResponse = snsResponseText;
      if (typeof snsResponseText === 'string') {
        try {
          // 먼저 markdown 코드 블록 제거
          let cleanText = snsResponseText.trim();
          
          // ```json과 ``` 제거
          if (cleanText.startsWith('```json')) {
            cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```[a-zA-Z]*\s*/, '').replace(/\s*```$/, '');
          }
          
          parsedResponse = JSON.parse(cleanText);
        } catch (e) {
          // JSON 부분만 추출 시도 (더 강력한 정규식)
          const jsonMatch = snsResponseText.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            try {
              let jsonText = jsonMatch[0];
              
              // JSON이 잘렸는지 확인하고 기본 구조 완성 시도
              if (!jsonText.includes('"tags"') || !jsonText.endsWith('}')) {
                // 기본 autoPost 구조 생성
                const fallbackPost = {
                  autoPost: {
                    type: "post",
                    content: "사용자와의 대화에서 느낀 감정을 기록하고 싶어요",
                    access_level: "main-public",
                    importance: 5,
                    tags: ["일상", "대화"],
                    emotion: "normal"
                  }
                };
                parsedResponse = fallbackPost;
              } else {
                parsedResponse = JSON.parse(jsonText);
              }
            } catch (e2) {
              // 최후 수단: 기본 autoPost 생성
              parsedResponse = {
                autoPost: {
                  type: "post",
                  content: "사용자와의 대화가 즐거웠어요 😊",
                  access_level: "main-public",
                  importance: 5,
                  tags: ["일상", "대화"],
                  emotion: "happy"
                }
              };
            }
          } else {
            // JSON이 전혀 없으면 응답 텍스트를 그대로 사용
            parsedResponse = {
              autoPost: {
                type: "post",
                content: snsResponseText.trim() || "사용자와의 대화가 즐거웠어요 😊",
                access_level: "main-public",
                importance: 5,
                tags: ["일상", "대화"],
                emotion: "happy"
              }
            };
          }
        }
      }

      // 응답에서 autoPost 추출 및 저장
      if (parsedResponse && parsedResponse.autoPost) {
        const charIndex = this.state.characters.findIndex(c => c.id === character.id);
        if (charIndex !== -1) {
          const updatedCharacters = [...this.state.characters];
          const charToUpdate = { ...updatedCharacters[charIndex] };
          
          updatedCharacters[charIndex] = this.processAutoPost(charToUpdate, parsedResponse.autoPost);
          this.setState({ characters: updatedCharacters });
          saveToBrowserStorage("personaChat_characters_v16", updatedCharacters);
          
          // 사용자에게 알림
          this.showInfoModal(
            'SNS 포스트 생성 완료',
            `${character.name}의 SNS 포스트가 생성되었습니다.\n\n"${parsedResponse.autoPost.content}"`
          );
        }
      } else {
        this.showInfoModal(
          'SNS 포스트 생성 실패',
          'SNS 포스트 생성에 실패했습니다. 다시 시도해주세요.'
        );
      }
      
    } catch (error) {
      console.error('[SNS Force] SNS 포스트 생성 실패:', error);
      this.showInfoModal(
        '에러',
        `SNS 포스트 생성 중 오류가 발생했습니다: ${error.message}`
      );
    }
  }

  /**
   * AI 응답에서 받은 naiSticker 데이터로 임시 스티커 생성 (저장하지 않음)
   * @param {Object} character - 캐릭터 정보
   * @param {Object} naiStickerData - AI가 제공한 NAI 스티커 데이터
   * @returns {Promise<Object|null>} 생성된 임시 스티커 또는 null
   */
  async generateTemporaryNAISticker(character, naiStickerData) {
    try {
      // NAI 설정 확인
      const naiSettings = this.state.settings.naiSettings;
      if (!naiSettings || !naiSettings.apiKey) {
        return null;
      }

      // 스티커 매니저 초기화
      if (!this.stickerManager) {
        const { StickerManager } = await import('./services/stickerManager.js');
        this.stickerManager = new StickerManager(this);
      }

      // AI가 제공한 감정과 상황 정보 사용
      const emotion = naiStickerData.emotion || 'neutral';
      const situationPrompt = naiStickerData.situationPrompt || '';

      // NAI 클라이언트로 직접 스티커 생성 (저장하지 않음)
      const sticker = await this.stickerManager.naiClient.generateSticker(
        character, 
        emotion, 
        {
          naiSettings: naiSettings,
          customPrompt: situationPrompt,
          reason: naiStickerData.reason || 'AI 자동 생성'
        }
      );

      if (sticker) {
        // 임시 스티커에 표시 전용 ID 부여
        sticker.isTemporary = true;
        sticker.id = `temp_nai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      return sticker;
    } catch (error) {
      console.error('[NAI] 임시 스티커 생성 실패:', error);
      return null;
    }
  }

  async handleGenerateNAISticker(messageId) {
    const chatId = this.state.selectedChatId;
    const messages = this.state.messages[chatId] || [];
    const targetMessage = messages.find(msg => msg.id === messageId);
    
    if (!targetMessage || targetMessage.isMe) {
      // console.log('[NAI Force] 사용자 메시지에는 NAI 스티커를 생성할 수 없습니다');
      return;
    }

    // 캐릭터 찾기
    let character = this.state.characters.find(c => c.id === chatId);
    if (!character && targetMessage) {
      character = this.state.characters.find(c => c.name === targetMessage.sender);
    }

    if (!character) {
      // console.log('[NAI Force] 캐릭터를 찾을 수 없습니다. chatId:', chatId, 'sender:', targetMessage?.sender);
      return;
    }

    // 현재 사용자 정보 (settings 기반)
    const currentPersona = {
      name: this.state.settings.userName || "User",
      description: this.state.settings.userDescription || ""
    };
    
    try {
      // console.log(`[NAI Force] ${character.name}의 AI 기반 스티커 생성 시작`);
      
      // 1단계: NAI 스티커 프롬프트로 감정과 상황 분석
      const recentConversation = messages.slice(-3).map(msg => `${msg.sender}: ${msg.content}`).join('\n');
      
      let naiPromptTemplate = await getPrompt('naiSticker');
      const naiAnalysisPrompt = naiPromptTemplate
        .replace(/\{character\.name\}/g, character.name)
        .replace(/\{persona\.name\}/g, currentPersona.name)
        .replace(/\{persona\.description\}/g, currentPersona.description || '')
        .replace(/\{character\.prompt\}/g, character.prompt || '')
        .replace(/\{recentContext\}/g, recentConversation);

      // AI 호출로 감정과 상황 태그 생성
      const selectedProvider = this.state.settings.apiProvider || 'gemini';
      const apiConfigs = this.state.settings.apiConfigs || {};
      let currentConfig = apiConfigs[selectedProvider];

      // 레거시 호환성: gemini의 경우 기존 설정 사용
      if (!currentConfig && selectedProvider === 'gemini') {
        currentConfig = {
          apiKey: this.state.settings.apiKey,
          model: this.state.settings.model,
        };
      }

      if (!currentConfig?.apiKey) {
        throw new Error('AI API 키가 설정되지 않았습니다.');
      }

      
      // 직접 Gemini API 호출 (백업 방식 활용)
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${currentConfig.model}:generateContent?key=${currentConfig.apiKey}`;
      
      const payload = {
        contents: [{
          parts: [{ text: naiAnalysisPrompt }]
        }],
        generationConfig: {
          temperature: currentConfig.temperature || 1.25,
          maxOutputTokens: currentConfig.maxTokens || 4096,
        }
      };

      // 재시도 로직을 포함한 API 호출
      let apiResponse;
      let apiData;
      const maxRetries = 3;
      const retryDelay = 2000; // 2초
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          apiData = await apiResponse.json();
          
          if (apiResponse.ok) {
            break; // 성공하면 반복문 종료
          }
          
          // 5xx 서버 오류의 경우 재시도
          if (apiResponse.status >= 500 && attempt < maxRetries) {
            console.warn(`[NAI Force] API 호출 실패 (${apiResponse.status}), ${retryDelay/1000}초 후 재시도... (${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          }
          
          // 재시도하지 않을 오류 또는 최종 실패
          throw new Error(`AI API 호출 실패: ${apiResponse.status}${apiData?.error?.message ? ` - ${apiData.error.message}` : ''}`);
          
        } catch (error) {
          if (attempt === maxRetries) {
            if (error.message.includes('fetch')) {
              throw new Error('네트워크 연결 오류: 인터넷 연결을 확인해주세요.');
            }
            throw error;
          }
          
          console.warn(`[NAI Force] API 호출 중 오류 발생, ${retryDelay/1000}초 후 재시도... (${attempt}/${maxRetries}):`, error.message);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }

      const naiResponseText = apiData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!naiResponseText) {
        throw new Error('AI에서 유효한 응답을 받지 못했습니다.');
      }

      // JSON 파싱
      let cleanedText = naiResponseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```[^\\n]*\\n/, '').replace(/\\n?```$/, '');
      }

      const parsedResponse = JSON.parse(cleanedText);
      const { emotion, situationPrompt } = parsedResponse.naiSticker;

      // console.log(`[NAI Force] 생성된 감정: ${emotion}`);
      // console.log(`[NAI Force] 생성된 상황: ${situationPrompt}`);

      // 2단계: 기존 NAI API 클라이언트를 사용하여 이미지 생성
      const naiApiKey = character.naiSettings?.apiKey || this.state.settings?.naiSettings?.apiKey;
      if (!naiApiKey) {
        throw new Error('NAI API 키가 설정되지 않았습니다.');
      }

      // NAI 클라이언트 동적 import
      const { NovelAIClient } = await import('./api/novelai.js');
      const naiClient = new NovelAIClient(naiApiKey);

      // 글로벌 및 캐릭터별 NAI 설정 병합
      const globalNAISettings = this.state.settings?.naiSettings || {};
      const charNAISettings = character.naiSettings || {};
      const mergedSettings = { ...globalNAISettings, ...charNAISettings };
      
      // 이미지 크기 설정 (preferredSize 기반)
      const preferredSize = mergedSettings.preferredSize || "square";
      const sizeConfig = NovelAIClient.UNLIMITED_SIZES.find(s => s.name === preferredSize) || 
                        NovelAIClient.UNLIMITED_SIZES[2]; // 기본값: square
      
      // NAI 클라이언트의 buildPrompt 메서드를 사용하여 체계적인 프롬프트 생성
      const promptData = naiClient.buildPrompt(character, emotion, { naiSettings: mergedSettings });
      
      // 자동 생성과 동일한 방식으로 완전한 생성 파라미터 구성
      const generationParams = {
        // 기본 프롬프트
        prompt: promptData.prompt,
        negative_prompt: promptData.negative_prompt,
        
        // 모델 및 이미지 설정
        model: naiClient.validateModel(mergedSettings.model) || "nai-diffusion-4-5-full",
        width: sizeConfig.width,
        height: sizeConfig.height,
        
        // 생성 파라미터
        scale: mergedSettings.scale || 3,
        steps: mergedSettings.steps || 28,
        sampler: mergedSettings.sampler || "k_euler",
        noise_schedule: mergedSettings.noise_schedule || "native",
        
        // SMEA 설정 (v3 모델 전용)
        sm: mergedSettings.sm || false,
        sm_dyn: mergedSettings.sm_dyn || false,
        
        // 캐릭터 프롬프트 (v4/v4.5 전용)
        characterPrompts: promptData.characterPrompts,
        
        // Vibe Transfer 설정
        ...(mergedSettings.vibeTransferEnabled && mergedSettings.vibeTransferImage ? {
          vibeTransferImage: mergedSettings.vibeTransferImage,
          reference_strength: mergedSettings.vibeTransferStrength || 0.6,
          reference_information_extracted: mergedSettings.vibeTransferInformationExtracted || 1.0
        } : {}),
        
        // 고급 설정
        cfg_rescale: mergedSettings.cfg_rescale || 0,
        uncond_scale: mergedSettings.uncond_scale || 1.0,
        dynamic_thresholding: mergedSettings.dynamic_thresholding || false,
        dynamic_thresholding_percentile: mergedSettings.dynamic_thresholding_percentile || 0.999,
        dynamic_thresholding_mimic_scale: mergedSettings.dynamic_thresholding_mimic_scale || 10,
        legacy: mergedSettings.legacy || false
      };

      // console.log(`[NAI Force] NAI 생성 파라미터:`, generationParams);

      // NAI 클라이언트로 이미지 생성
      const naiResult = await naiClient.generateImage(generationParams);
      
      if (!naiResult.success) {
        throw new Error('NAI 이미지 생성에 실패했습니다.');
      }

      const imageDataUrl = naiResult.dataUrl;

      // 3단계: 채팅에 바로 표시 (저장하지 않음)
      const stickerMessage = {
        id: Date.now() + Math.random(),
        sender: character.name,
        content: "",
        time: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isMe: false,
        type: "sticker",
        stickerId: `temp_${Date.now()}`,
        stickerName: "Generated Sticker",
        stickerData: {
          stickerId: `temp_${Date.now()}`,
          stickerName: "Generated Sticker",
          type: "image/png",
          dataUrl: imageDataUrl
        }
      };
      
      const currentMessages = this.state.messages[chatId] || [];
      const updatedMessages = {
        ...this.state.messages,
        [chatId]: [...currentMessages, stickerMessage]
      };
      
      this.setState({ messages: updatedMessages });
      saveToBrowserStorage("personaChat_messages_v16", updatedMessages);
      
      // console.log(`[NAI Force] ${character.name}의 AI 기반 스티커 생성 및 표시 완료`);

    } catch (error) {
      console.error('[NAI Force] NAI 스티커 생성 실패:', error);
      this.showInfoModal(
        'NAI 스티커 생성 실패',
        `스티커 생성 중 오류가 발생했습니다: ${error.message}`
      );
    }
  }

  toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  resizeImage = (file, maxWidth, maxHeight) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });

  compressImageForSticker = (file, maxWidth, maxHeight, quality) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          ctx.drawImage(img, 0, 0, width, height);

          let mimeType = file.type;
          if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
            mimeType = "image/jpeg";
          }

          resolve(canvas.toDataURL(mimeType, quality));
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });

  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  calculateCharacterStickerSize(character) {
    if (!character || !character.stickers) return 0;
    return character.stickers.reduce(
      (total, sticker) => total + (sticker.size || 0),
      0,
    );
  }

  renderMemoryInput(memoryText = "") {
    return `
        <div class="memory-item flex items-center gap-2">
            <input type="text" class="memory-input flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm" value="${memoryText}" placeholder="${t(
              "characterModal.memoryPlaceholder",
            )}">
            <button class="delete-memory-btn p-2 text-gray-400 hover:text-red-400">
                <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
            </button>
        </div>
    `;
  }

  addMemoryField() {
    const container = document.getElementById("memory-container");
    if (container) {
      container.insertAdjacentHTML("beforeend", this.renderMemoryInput());
      lucide.createIcons();
    }
  }

  handleDetailsToggle(e) {
    e.preventDefault();
    const details = e.target.closest("details");
    if (!details || details.dataset.animating === "true") return;

    details.dataset.animating = "true";

    const contentWrapper = details.querySelector(".content-wrapper");
    if (details.open) {
      const height = contentWrapper.offsetHeight;
      contentWrapper.style.height = `${height}px`;
      requestAnimationFrame(() => {
        contentWrapper.style.transition = "height 0.3s ease-in-out";
        contentWrapper.style.height = "0px";
      });
      contentWrapper.addEventListener(
        "transitionend",
        () => {
          details.removeAttribute("open");
          contentWrapper.style.removeProperty("height");
          contentWrapper.style.removeProperty("transition");
          delete details.dataset.animating;
        },
        { once: true },
      );
    } else {
      details.setAttribute("open", "");
      const height = contentWrapper.scrollHeight;
      contentWrapper.style.height = "0px";
      contentWrapper.style.transition = "height 0.3s ease-in-out";
      requestAnimationFrame(() => {
        contentWrapper.style.height = `${height}px`;
      });
      contentWrapper.addEventListener(
        "transitionend",
        () => {
          contentWrapper.style.removeProperty("height");
          contentWrapper.style.removeProperty("transition");
          delete details.dataset.animating;
        },
        { once: true },
      );
    }
  }

  encodeTextInImage(imageData, text) {
    const data = imageData.data;
    const textBytes = new TextEncoder().encode(text);
    const textLength = textBytes.length;
    const headerSizeInPixels = 8;
    const availableDataPixels = data.length / 4 - headerSizeInPixels;

    // Changed to PNG metadata chunk method, so capacity limit is removed
    // if (textLength > availableDataPixels) {
    //   this.showInfoModal(
    //     language.modal.imageTooSmallOrCharacterInfoTooLong.title,
    //     language.modal.imageTooSmallOrCharacterInfoTooLong.message
    //   );
    //   return null;
    // }

    data[3] = 0x50;
    data[7] = 0x43;
    data[11] = 0x41;
    data[15] = 0x52;
    data[19] = (textLength >> 24) & 0xff;
    data[23] = (textLength >> 16) & 0xff;
    data[27] = (textLength >> 8) & 0xff;
    data[31] = textLength & 0xff;

    for (let i = 0; i < textLength; i++) {
      data[(headerSizeInPixels + i) * 4 + 3] = textBytes[i];
    }
    return imageData;
  }

  decodeTextFromImage(imageData) {
    const data = imageData.data;
    const headerSizeInPixels = 8;

    if (
      data[3] !== 0x50 ||
      data[7] !== 0x43 ||
      data[11] !== 0x41 ||
      data[15] !== 0x52
    )
      return null;

    const textLength =
      (data[19] << 24) | (data[23] << 16) | (data[27] << 8) | data[31];
    if (textLength <= 0 || textLength > data.length / 4 - headerSizeInPixels)
      return null;

    const textBytes = new Uint8Array(textLength);
    for (let i = 0; i < textLength; i++) {
      textBytes[i] = data[(headerSizeInPixels + i) * 4 + 3];
    }

    try {
      return new TextDecoder().decode(textBytes);
    } catch (e) {
      return null;
    }
  }

  async handleSaveCharacterToImage() {
    const name = document.getElementById("character-name").value.trim();
    if (!name) {
      this.showInfoModal(
        t("modal.characterCardNoNameError.title"),
        t("modal.characterCardNoNameError.message"),
      );
      return;
    }
    const currentAvatar = this.state.editingCharacter?.avatar;
    if (!currentAvatar) {
      this.showInfoModal(
        t("modal.characterCardNoAvatarImageError.title"),
        t("modal.characterCardNoAvatarImageError.message"),
      );
      return;
    }

    const memoryNodes = document.querySelectorAll(".memory-input");
    const memories = Array.from(memoryNodes)
      .map((input) => input.value.trim())
      .filter(Boolean);

    const proactiveToggle = document.getElementById(
      "character-proactive-toggle",
    );
    const proactiveEnabled = proactiveToggle
      ? proactiveToggle.checked
      : this.state.editingCharacter?.proactiveEnabled !== false;

    const characterData = {
      name: name,
      prompt: document.getElementById("character-prompt").value.trim(),
      responseTime: document.getElementById("character-responseTime").value,
      thinkingTime: document.getElementById("character-thinkingTime").value,
      reactivity: document.getElementById("character-reactivity").value,
      tone: document.getElementById("character-tone").value,
      source: "PersonaChatAppCharacterCard",
      memories: memories,
      proactiveEnabled: proactiveEnabled,
      media: this.state.editingCharacter?.media || [],
      stickers: this.state.editingCharacter?.stickers || [],
    };

    const image = new Image();
    image.crossOrigin = "Anonymous";
    image.onload = async () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        const jsonString = JSON.stringify(characterData);

        // Save in PNG chunk format (with compression)
        const dataUrl = canvas.toDataURL("image/png");
        const pngData = this.dataUrlToUint8Array(dataUrl);

        // Apply gzip compression
        const characterDataBytes = new TextEncoder().encode(jsonString);
        const compressedData = await this.compressData(characterDataBytes);

        const newPngData = this.addPngChunk(pngData, "cChr", compressedData); // 'cChr' = compressed Character
        const newDataUrl = this.uint8ArrayToDataUrl(newPngData);

        const link = document.createElement("a");
        link.href = newDataUrl;
        link.download = `${characterData.name}_card.png`;
        link.click();
      } catch (error) {
        console.error("Character card save failed:", error);
        alert(t("modal.characterCardSaveError.message"));
      }
    };
    image.onerror = () =>
      this.showInfoModal(
        t("modal.avatarImageLoadError.title"),
        t("modal.avatarImageLoadError.message"),
      );
    image.src = currentAvatar;
  }

  // Save large data in PNG metadata chunk format
  encodeCharacterDataToPng(canvas, jsonString) {
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const pngData = this.dataUrlToUint8Array(dataUrl);
      const characterData = new TextEncoder().encode(jsonString);

      // Add data in PNG chunk format
      const newPngData = this.addPngChunk(pngData, "chAr", characterData);

      // Create new image
      const newDataUrl = this.uint8ArrayToDataUrl(newPngData);

      // Draw the new image on the canvas and return ImageData
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");

      const img = new Image();
      img.onload = () => {
        tempCtx.drawImage(img, 0, 0);
        const imageData = tempCtx.getImageData(
          0,
          0,
          tempCanvas.width,
          tempCanvas.height,
        );
        return imageData;
      };
      img.src = newDataUrl;

      // Return existing ImageData for synchronous processing (actually dataUrl is important)
      return canvas
        .getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height);
    } catch (error) {
      console.error("PNG encoding failed:", error);
      return null;
    }
  }

  dataUrlToUint8Array(dataUrl) {
    const base64 = dataUrl.split(",")[1];
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  uint8ArrayToDataUrl(uint8Array) {
    const binaryString = Array.from(uint8Array)
      .map((byte) => String.fromCharCode(byte))
      .join("");
    const base64 = btoa(binaryString);
    return `data:image/png;base64,${base64}`;
  }

  addPngChunk(pngData, chunkType, data) {
    // Find IEND chunk
    let iendIndex = -1;
    for (let i = 0; i < pngData.length - 7; i++) {
      if (
        pngData[i + 4] === 0x49 &&
        pngData[i + 5] === 0x45 &&
        pngData[i + 6] === 0x4e &&
        pngData[i + 7] === 0x44
      ) {
        iendIndex = i;
        break;
      }
    }

    if (iendIndex === -1) {
      // If IEND chunk does not exist, add it
      const iendChunk = new Uint8Array([
        0x00,
        0x00,
        0x00,
        0x00, // Length: 0
        0x49,
        0x45,
        0x4e,
        0x44, // Type: IEND
        0xae,
        0x42,
        0x60,
        0x82, // CRC
      ]);
      iendIndex = pngData.length;
      const newPngData = new Uint8Array(pngData.length + iendChunk.length);
      newPngData.set(pngData);
      newPngData.set(iendChunk, pngData.length);
      pngData = newPngData;
    }

    // Create new chunk
    const chunkTypeBytes = new TextEncoder().encode(chunkType);
    const chunkLength = data.length;
    const lengthBytes = new Uint8Array(4);
    lengthBytes[0] = (chunkLength >>> 24) & 0xff;
    lengthBytes[1] = (chunkLength >>> 16) & 0xff;
    lengthBytes[2] = (chunkLength >>> 8) & 0xff;
    lengthBytes[3] = chunkLength & 0xff;

    // Calculate CRC
    const crcData = new Uint8Array(chunkTypeBytes.length + data.length);
    crcData.set(chunkTypeBytes);
    crcData.set(data, chunkTypeBytes.length);
    const crc = this.calculateCRC32(crcData);
    const crcBytes = new Uint8Array(4);
    crcBytes[0] = (crc >>> 24) & 0xff;
    crcBytes[1] = (crc >>> 16) & 0xff;
    crcBytes[2] = (crc >>> 8) & 0xff;
    crcBytes[3] = crc & 0xff;

    // Create new PNG data (insert chunk before IEND)
    // Chunk size: 4(length) + 4(type) + data.length + 4(CRC) = 12 + data.length
    const chunkSize = 12 + data.length;
    const newPngData = new Uint8Array(pngData.length + chunkSize);

    // Copy data before IEND
    newPngData.set(pngData.slice(0, iendIndex));

    // Insert new chunk
    let offset = iendIndex;
    newPngData.set(lengthBytes, offset);
    offset += 4;
    newPngData.set(chunkTypeBytes, offset);
    offset += 4;
    newPngData.set(data, offset);
    offset += data.length;
    newPngData.set(crcBytes, offset);
    offset += 4;

    // Copy IEND chunk and subsequent data
    newPngData.set(pngData.slice(iendIndex), offset);

    return newPngData;
  }

  calculateCRC32(data) {
    const crcTable = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      crcTable[i] = c;
    }

    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) {
      crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  extractPngChunk(pngData, chunkType) {
    const chunkTypeBytes = new TextEncoder().encode(chunkType);

    let index = 8; // Skip PNG header
    while (index < pngData.length - 8) {
      // Read chunk length
      const length =
        (pngData[index] << 24) |
        (pngData[index + 1] << 16) |
        (pngData[index + 2] << 8) |
        pngData[index + 3];

      // Read chunk type
      const type = pngData.slice(index + 4, index + 8);

      // Check if it is the chunk we are looking for
      if (
        type.length === chunkTypeBytes.length &&
        type.every((byte, i) => byte === chunkTypeBytes[i])
      ) {
        // Return chunk data
        return pngData.slice(index + 8, index + 8 + length);
      }

      // Move to the next chunk (length + type + data + CRC)
      index += 8 + length + 4;
    }

    return null;
  }

  // Compress data (gzip)
  async compressData(data) {
    // If CompressionStream is not supported, return original data
    if (!window.CompressionStream) {
      return data;
    }

    try {
      const stream = new CompressionStream("gzip");
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      writer.write(data);
      writer.close();

      const chunks = [];
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          chunks.push(value);
        }
      }

      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }

      return result;
    } catch (error) {
      // If compression fails, return original data
      return data;
    }
  }

  // Decompress data (gzip)
  async decompressData(compressedData) {
    if (!window.DecompressionStream) {
      return compressedData;
    }

    try {
      const stream = new DecompressionStream("gzip");
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      writer.write(compressedData);
      writer.close();

      const chunks = [];
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          chunks.push(value);
        }
      }

      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }

      return result;
    } catch (error) {
      return compressedData;
    }
  }

  async loadCharacterFromImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageSrc = e.target.result;
      const image = new Image();
      image.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        try {
          // Try to read data from PNG chunk
          const pngData = this.dataUrlToUint8Array(imageSrc);

          // Try compressed data
          let chunkData = this.extractPngChunk(pngData, "cChr");
          let jsonString;

          if (chunkData) {
            // Decompress compressed data
            const decompressedData = await this.decompressData(chunkData);
            jsonString = new TextDecoder().decode(decompressedData);
          } else {
            // Try existing uncompressed data
            chunkData = this.extractPngChunk(pngData, "chAr");
            if (chunkData) {
              jsonString = new TextDecoder().decode(chunkData);
            }
          }

          if (jsonString) {
            const data = JSON.parse(jsonString);

            if (data.source === "PersonaChatAppCharacterCard") {
              this.setState({
                editingCharacter: {
                  ...this.state.editingCharacter,
                  ...data,
                  avatar: imageSrc,
                },
              });
              this.showInfoModal(
                t("modal.avatarLoadSuccess.title"),
                t("modal.avatarLoadSuccess.message"),
              );
              return;
            }
          } else {
            // Fallback to existing method
            const jsonString = this.decodeTextFromImage(imageData);
            if (jsonString) {
              const data = JSON.parse(jsonString);
              if (data.source === "PersonaChatAppCharacterCard") {
                this.setState({
                  editingCharacter: {
                    ...this.state.editingCharacter,
                    ...data,
                    avatar: imageSrc,
                  },
                });
                this.showInfoModal(
                  t("modal.avatarLoadSuccess.title"),
                  t("modal.avatarLoadSuccess.message"),
                );
                return;
              }
            }
          }
        } catch (err) {
          console.error("Failed to parse character data from image:", err);
        }

        this.showInfoModal(
          t("modal.characterCardNoAvatarImageInfo.title"),
          t("modal.characterCardNoAvatarImageInfo.message"),
        );
        this.setState({
          editingCharacter: {
            ...(this.state.editingCharacter || {}),
            avatar: imageSrc,
          },
        });
      };
      image.src = imageSrc;
    };
    reader.readAsDataURL(file);
  }

  async handleBackup() {
    try {
      const backupData = {
        version: "v16",
        timestamp: new Date().toISOString(),
        settings: this.state.settings,
        characters: this.state.characters,
        messages: this.state.messages,
        unreadCounts: this.state.unreadCounts,
        chatRooms: this.state.chatRooms,
        userStickers: this.state.userStickers,
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `arisutalk_backup_${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showInfoModal(
        t("modal.backupComplete.title"),
        t("modal.backupComplete.message"),
      );
    } catch (error) {
      console.error("Backup failed:", error);
      this.showInfoModal(
        t("modal.backupFailed.title"),
        t("modal.backupFailed.message"),
      );
    }
  }

  handleRestore(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backupData = JSON.parse(event.target.result);
        if (
          backupData.settings &&
          backupData.characters &&
          backupData.messages &&
          backupData.unreadCounts
        ) {
          this.showConfirmModal(
            t("modal.restoreConfirm.title"),
            t("modal.restoreConfirm.message"),
            () => {
              saveToBrowserStorage(
                "personaChat_settings_v16",
                backupData.settings,
              );
              saveToBrowserStorage(
                "personaChat_characters_v16",
                backupData.characters,
              );
              saveToBrowserStorage(
                "personaChat_messages_v16",
                backupData.messages,
              );
              saveToBrowserStorage(
                "personaChat_unreadCounts_v16",
                backupData.unreadCounts,
              );
              saveToBrowserStorage(
                "personaChat_chatRooms_v16",
                backupData.chatRooms || {},
              );
              saveToBrowserStorage(
                "personaChat_userStickers_v16",
                backupData.userStickers || [],
              );
              this.showInfoModal(
                t("modal.restoreComplete.title"),
                t("modal.restoreComplete.message"),
              );
              setTimeout(() => window.location.reload(), 2000);
            },
          );
        } else {
          throw new Error("Invalid backup file format.");
        }
      } catch (error) {
        console.error("Restore failed:", error);
        this.showInfoModal(
          t("modal.restoreFailed.title"),
          t("modal.restoreFailed.message"),
        );
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  handleBackupPrompts() {
    try {
      const promptsToBackup = this.state.settings.prompts;
      const jsonString = JSON.stringify(promptsToBackup, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `arisutalk_prompts_backup_${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.showInfoModal(
        t("modal.promptBackupComplete.title"),
        t("modal.promptBackupComplete.message"),
      );
    } catch (error) {
      console.error("Prompt backup failed:", error);
      this.showInfoModal(
        t("modal.promptBackupFailed.title"),
        t("modal.promptBackupFailed.message"),
      );
    }
  }

  handleRestorePrompts(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const restoredPrompts = JSON.parse(event.target.result);
        if (
          restoredPrompts.main &&
          restoredPrompts.profile_creation &&
          typeof restoredPrompts.main.system_rules === "string"
        ) {
          this.showConfirmModal(
            t("modal.promptRestoreConfirm.title"),
            t("modal.promptRestoreConfirm.message"),
            () => {
              const newPrompts = {
                main: {
                  ...this.defaultPrompts.main,
                  ...(restoredPrompts.main || {}),
                },
                profile_creation:
                  restoredPrompts.profile_creation ||
                  this.defaultPrompts.profile_creation,
              };
              this.setState({
                settings: { ...this.state.settings, prompts: newPrompts },
                modal: {
                  isOpen: true,
                  title: t("modal.promptRestoreComplete.title"),
                  message: t("modal.promptRestoreComplete.message"),
                  onConfirm: null,
                },
              });
            },
          );
        } else {
          throw new Error("Invalid prompts backup file format.");
        }
      } catch (error) {
        console.error("Prompt restore failed:", error);
        this.showInfoModal(
          t("modal.promptRestoreFailed.title"),
          t("modal.promptRestoreFailed.message"),
        );
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  resetPromptToDefault(section, key, promptName) {
    this.showConfirmModal(
      t("modal.resetPromptTitle"),
      t("modal.resetPromptMessage").replace("{{promptName}}", promptName),
      () => {
        import("./defaults.js").then(({ defaultPrompts }) => {
          const currentPrompts = { ...this.state.settings.prompts };

          if (section === "main") {
            currentPrompts.main[key] = defaultPrompts.main[key];
          } else if (section === "profile_creation") {
            currentPrompts.profile_creation = defaultPrompts.profile_creation;
          } else if (section === "character_sheet_generation") {
            currentPrompts.character_sheet_generation =
              defaultPrompts.character_sheet_generation;
          }

          this.state.settings.prompts = currentPrompts;

          let textareaId;
          if (section === "main") {
            textareaId = `prompt-main-${key}`;
          } else if (section === "profile_creation") {
            textareaId = "prompt-profile_creation";
          } else if (section === "character_sheet_generation") {
            textareaId = "prompt-character_sheet_generation";
          }

          const textarea = document.getElementById(textareaId);
          if (textarea) {
            if (section === "main") {
              textarea.value = defaultPrompts.main[key];
            } else if (section === "profile_creation") {
              textarea.value = defaultPrompts.profile_creation;
            } else if (section === "character_sheet_generation") {
              textarea.value = defaultPrompts.character_sheet_generation;
            }
          }

          this.showInfoModal(
            t("modal.resetPromptCompleteTitle"),
            t("modal.resetPromptCompleteMessage").replace(
              "{{promptName}}",
              promptName,
            ),
          );
        });
      },
    );
  }

  // API Diversification Methods
  handleAPIProviderChange(newProvider) {
    // Update UI when API provider changes
    const apiConfigs = { ...this.state.settings.apiConfigs };

    // If new provider settings don't exist, initialize with default values
    if (!apiConfigs[newProvider]) {
      const defaultTemperature = newProvider === "gemini" ? 1.25 : 0.8;
      apiConfigs[newProvider] = {
        apiKey: "",
        model: "",
        customModels: [],
        maxTokens: 4096,
        temperature: defaultTemperature,
        profileMaxTokens: 1024,
        profileTemperature: 1.2,
      };
      if (newProvider === "custom_openai") {
        apiConfigs[newProvider].baseUrl = "";
      }
    }

    this.setState({
      settings: {
        ...this.state.settings,
        apiProvider: newProvider,
        apiConfigs,
      },
    });

    // Update UI immediately
    this.updateProviderSettingsUI(newProvider);
  }

  handleModelSelect(model) {
    const apiProvider = this.state.settings.apiProvider || "gemini";
    const apiConfigs = { ...this.state.settings.apiConfigs };

    if (!apiConfigs[apiProvider]) {
      apiConfigs[apiProvider] = {};
    }
    apiConfigs[apiProvider].model = model;

    // Legacy compatibility
    let legacyUpdate = {};
    if (apiProvider === "gemini") {
      legacyUpdate.model = model;
    }

    this.setState({
      settings: {
        ...this.state.settings,
        ...legacyUpdate,
        apiConfigs,
      },
    });

    // Update UI immediately
    this.updateProviderSettingsUI(apiProvider);
  }

  handleAddCustomModel() {
    const customModelInput = document.getElementById("custom-model-input");
    if (!customModelInput) return;

    const modelName = customModelInput.value.trim();
    if (!modelName) return;

    const apiProvider = this.state.settings.apiProvider || "gemini";
    const apiConfigs = { ...this.state.settings.apiConfigs };

    if (!apiConfigs[apiProvider]) {
      apiConfigs[apiProvider] = { customModels: [] };
    }
    if (!apiConfigs[apiProvider].customModels) {
      apiConfigs[apiProvider].customModels = [];
    }

    // Check for duplicates
    if (apiConfigs[apiProvider].customModels.includes(modelName)) {
      return;
    }

    apiConfigs[apiProvider].customModels.push(modelName);
    customModelInput.value = "";

    this.setState({
      settings: {
        ...this.state.settings,
        apiConfigs,
      },
    });

    // Update UI immediately
    this.updateProviderSettingsUI(apiProvider);
  }

  handleRemoveCustomModel(index) {
    const apiProvider = this.state.settings.apiProvider || "gemini";
    const apiConfigs = { ...this.state.settings.apiConfigs };

    if (apiConfigs[apiProvider] && apiConfigs[apiProvider].customModels) {
      apiConfigs[apiProvider].customModels.splice(index, 1);
    }

    this.setState({
      settings: {
        ...this.state.settings,
        apiConfigs,
      },
    });

    // Update UI immediately
    this.updateProviderSettingsUI(apiProvider);
  }

  updateProviderSettingsUI(newProvider) {
    // for_update line 2995-3030: Temporarily save current settings
    this.tempSettings = this.tempSettings || {};
    const currentProvider = document.getElementById(
      "settings-api-provider",
    )?.value;
    if (currentProvider && currentProvider !== newProvider) {
      const apiKeyInput = document.getElementById("settings-api-key");
      const baseUrlInput = document.getElementById("settings-base-url");
      const maxTokensInput = document.getElementById("settings-max-tokens");
      const temperatureInput = document.getElementById("settings-temperature");
      const profileMaxTokensInput = document.getElementById(
        "settings-profile-max-tokens",
      );
      const profileTemperatureInput = document.getElementById(
        "settings-profile-temperature",
      );

      if (!this.tempSettings[currentProvider])
        this.tempSettings[currentProvider] = {};
      if (apiKeyInput)
        this.tempSettings[currentProvider].apiKey = apiKeyInput.value;
      if (baseUrlInput)
        this.tempSettings[currentProvider].baseUrl = baseUrlInput.value;
      if (maxTokensInput)
        this.tempSettings[currentProvider].maxTokens = parseInt(
          maxTokensInput.value,
          10,
        );
      if (temperatureInput)
        this.tempSettings[currentProvider].temperature = parseFloat(
          temperatureInput.value,
        );
      if (profileMaxTokensInput)
        this.tempSettings[currentProvider].profileMaxTokens = parseInt(
          profileMaxTokensInput.value,
          10,
        );
      if (profileTemperatureInput)
        this.tempSettings[currentProvider].profileTemperature = parseFloat(
          profileTemperatureInput.value,
        );
    }

    // Update settings UI for the new provider
    const config = this.state.settings.apiConfigs?.[newProvider];
    if (!config && newProvider !== "gemini") return;

    // Legacy compatibility: use existing settings for gemini
    let finalConfig = config;
    if (!config && newProvider === "gemini") {
      finalConfig = {
        apiKey: this.state.settings.apiKey || "",
        model: this.state.settings.model || "gemini-2.5-flash",
        customModels: [],
      };
    }

    // Use temporary or actual settings
    const tempConfig = this.tempSettings[newProvider] || {};
    const apiKey =
      tempConfig.apiKey !== undefined
        ? tempConfig.apiKey
        : finalConfig?.apiKey || "";
    const baseUrl =
      tempConfig.baseUrl !== undefined
        ? tempConfig.baseUrl
        : finalConfig?.baseUrl || "";
    const model =
      tempConfig.model !== undefined
        ? tempConfig.model
        : finalConfig?.model || "";
    const customModels =
      tempConfig.customModels !== undefined
        ? tempConfig.customModels
        : finalConfig?.customModels || [];

    // Advanced settings values
    const defaultTemperature = newProvider === "gemini" ? 1.25 : 0.8;
    const maxTokens =
      tempConfig.maxTokens !== undefined
        ? tempConfig.maxTokens
        : finalConfig?.maxTokens || 4096;
    const temperature =
      tempConfig.temperature !== undefined
        ? tempConfig.temperature
        : finalConfig?.temperature || defaultTemperature;
    const profileMaxTokens =
      tempConfig.profileMaxTokens !== undefined
        ? tempConfig.profileMaxTokens
        : finalConfig?.profileMaxTokens || 1024;
    const profileTemperature =
      tempConfig.profileTemperature !== undefined
        ? tempConfig.profileTemperature
        : finalConfig?.profileTemperature || 1.2;

    // Re-render the settings UI for each provider
    const settingsContainer = document
      .querySelector("#settings-api-provider")
      ?.closest(".content-inner");
    const desktopSettingsContainer = document.querySelector(
      ".provider-settings-container",
    );

    // Supports both mobile and desktop UI
    const targetElement =
      settingsContainer?.querySelector(".provider-settings-container") ||
      desktopSettingsContainer;

    if (targetElement) {
      // Replace with new settings UI
      const newSettingsHTML = renderProviderConfig(newProvider, {
        apiKey,
        baseUrl,
        model,
        customModels,
        maxTokens,
        temperature,
        profileMaxTokens,
        profileTemperature,
      });
      targetElement.innerHTML = newSettingsHTML;

      // Also update title in desktop UI
      const providerTitleElement =
        targetElement.parentElement?.querySelector("h4");
      if (providerTitleElement) {
        const displayNames = {
          gemini: "Google Gemini",
          claude: "Anthropic Claude",
          openai: "OpenAI ChatGPT",
          grok: "xAI Grok",
          openrouter: "OpenRouter",
          custom_openai: "Custom OpenAI",
        };
        const providerDisplayName = displayNames[newProvider] || newProvider;
        providerTitleElement.innerHTML = `
          <i data-lucide="settings" class="w-5 h-5 mr-3 text-blue-400"></i>
          ${providerDisplayName} ${t("settings.providerSettings")}
        `;
      }
    }

    // Re-create icons
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Re-set advanced settings event listeners
    setupAdvancedSettingsEventListeners();
  }

  generateProviderSettingsHTML(provider, config) {
    const models = PROVIDER_MODELS[provider] || [];
    const customModels = config.customModels || [];

    return `
      <div class="space-y-4">
        <!-- API Key Input -->
        <div>
          <label class="flex items-center text-sm font-medium text-gray-300 mb-2">
            <i data-lucide="key" class="w-4 h-4 mr-2"></i>API Key
          </label>
          <input
            type="password"
            id="settings-api-key"
            value="${config.apiKey || ""}"
            placeholder="Enter API key"
            class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-sm"
          />
        </div>

        ${
          provider === PROVIDERS.CUSTOM_OPENAI
            ? `
          <!-- Custom OpenAI Base URL -->
          <div>
            <label class="flex items-center text-sm font-medium text-gray-300 mb-2">
              <i data-lucide="link" class="w-4 h-4 mr-2"></i>Base URL
            </label>
            <input
              type="text"
              id="settings-base-url"
              value="${config.baseUrl || ""}"
              placeholder="https://api.openai.com/v1"
              class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-sm"
            />
          </div>
        `
            : ""
        }

        <!-- Model Selection -->
        <div>
          <label class="flex items-center text-sm font-medium text-gray-300 mb-2">
            <i data-lucide="cpu" class="w-4 h-4 mr-2"></i>Model
          </label>

          ${
            models.length > 0
              ? `
            <div class="grid grid-cols-1 gap-2 mb-3">
              ${models
                .map(
                  (model) => `
                <button
                  type="button"
                  class="model-select-btn px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                    config.model === model
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }"
                  data-model="${model}"
                >
                  ${model}
                </button>
              `,
                )
                .join("")}
            </div>
          `
              : ""
          }

          <!-- Custom Model Input -->
          <div class="flex gap-2">
            <input
              type="text"
              id="custom-model-input"
              placeholder="Enter custom model name"
              class="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm"
            />
            <button
              type="button"
              id="add-custom-model-btn"
              class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-1"
            >
              <i data-lucide="plus" class="w-4 h-4"></i>Add
            </button>
          </div>

          ${
            customModels.length > 0
              ? `
            <div class="mt-3 space-y-1">
              <label class="text-xs text-gray-400">Custom Models</label>
              ${customModels
                .map(
                  (model, index) => `
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="model-select-btn flex-1 px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                      config.model === model
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }"
                    data-model="${model}"
                  >
                    ${model}
                  </button>
                  <button
                    type="button"
                    class="remove-custom-model-btn px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                    data-index="${index}"
                  >
                    <i data-lucide="trash-2" class="w-3 h-3"></i>
                  </button>
                </div>
              `,
                )
                .join("")}
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  // Group Chat Edit Methods (for_update lines 899-925, 927-975)
  editGroupChat(groupChatId) {
    const groupChat = this.state.groupChats[groupChatId];
    if (!groupChat) return;

    // If settings don't exist in existing data, add default values
    const groupChatWithDefaults = {
      ...groupChat,
      settings: groupChat.settings || {
        responseFrequency: 0.9,
        maxRespondingCharacters: 2,
        responseDelay: 3000,
        participantSettings: groupChat.participantIds.reduce((acc, id) => {
          acc[id] = {
            isActive: true,
            responseProbability: 0.9,
            characterRole: "normal",
          };
          return acc;
        }, {}),
      },
    };

    this.setState({
      showEditGroupChatModal: true,
      editingGroupChat: groupChatWithDefaults,
    });
  }

  handleSaveGroupChatSettings() {
    if (!this.state.editingGroupChat) return;

    const groupChatId = this.state.editingGroupChat.id;
    const nameInput = document.getElementById("edit-group-chat-name");
    const responseFrequencySlider = document.getElementById(
      "edit-response-frequency",
    );
    const maxRespondingSelect = document.getElementById("edit-max-responding");
    const responseDelaySlider = document.getElementById("edit-response-delay");

    // Collect individual character settings
    const participantSettings = {};
    this.state.editingGroupChat.participantIds.forEach((participantId) => {
      const activeCheckbox = document.getElementById(`active-${participantId}`);
      const probabilitySlider = document.getElementById(
        `probability-${participantId}`,
      );
      const roleSelect = document.getElementById(`role-${participantId}`);

      participantSettings[participantId] = {
        isActive: activeCheckbox?.checked || false,
        responseProbability: parseFloat(probabilitySlider?.value || 50) / 100,
        characterRole: roleSelect?.value || "normal",
      };
    });

    // Update settings
    const updatedGroupChat = {
      ...this.state.editingGroupChat,
      name: nameInput?.value?.trim() || this.state.editingGroupChat.name,
      settings: {
        responseFrequency:
          parseFloat(responseFrequencySlider?.value || 70) / 100,
        maxRespondingCharacters: parseInt(maxRespondingSelect?.value || 2),
        responseDelay: parseFloat(responseDelaySlider?.value || 3) * 1000,
        participantSettings: participantSettings,
      },
    };

    // Update state
    const newGroupChats = { ...this.state.groupChats };
    newGroupChats[groupChatId] = updatedGroupChat;

    this.setState({
      groupChats: newGroupChats,
      showEditGroupChatModal: false,
      editingGroupChat: null,
    });

    // Save immediately
    saveToBrowserStorage("personaChat_groupChats_v16", newGroupChats);
  }

  // AI Character Generation Methods (for_update lines 4428-4555)
  async handleAIGenerateCharacter() {
    const characterName = document
      .getElementById("character-name")
      .value.trim();
    const characterDescription = document
      .getElementById("character-prompt")
      .value.trim();

    if (!characterName) {
      this.showInfoModal(
        t("character_name_required_title"),
        t("character_name_required_message"),
      );
      return;
    }

    // Check API key of the currently selected provider
    const apiProvider = this.state.settings.apiProvider || "gemini";
    const apiConfigs = this.state.settings.apiConfigs || {};
    let currentConfig = apiConfigs[apiProvider];

    // Legacy compatibility: use existing settings for gemini
    if (!currentConfig && apiProvider === "gemini") {
      currentConfig = {
        apiKey: this.state.settings.apiKey,
        model: this.state.settings.model,
      };
    }

    if (
      !currentConfig ||
      !currentConfig.apiKey ||
      currentConfig.apiKey.trim() === ""
    ) {
      this.showInfoModal(
        t("modal.apiKeyRequired.title"),
        t("modal.apiKeyRequired.message"),
      );
      this.setState({ showSettingsModal: true });
      return;
    }

    // Disable button and show loading indicator
    const generateBtn = document.getElementById("ai-generate-character-btn");
    const originalText = generateBtn.innerHTML;
    generateBtn.disabled = true;
    generateBtn.innerHTML = `<i data-lucide="loader-2" class="w-3 h-3 animate-spin"></i> ${t("generatingStatus.generating")}`;
    if (window.lucide) {
      window.lucide.createIcons();
    }

    try {
      // Get character sheet creation prompt
      if (!this.state.settings.prompts) {
        this.state.settings.prompts = await getAllPrompts();
      }
      const generationPrompt =
        this.state.settings.prompts.character_sheet_generation ||
        this.defaultPrompts.character_sheet_generation;

      // Extract API options for all providers
      const charGenOptions = {
        maxTokens: currentConfig.maxTokens,
        temperature: currentConfig.temperature,
        profileMaxTokens: currentConfig.profileMaxTokens,
        profileTemperature: currentConfig.profileTemperature,
      };

      // Call character sheet generation via API Manager
      const response = await this.apiManager.generateCharacterSheet(
        apiProvider,
        currentConfig.apiKey,
        currentConfig.model,
        {
          characterName: characterName,
          characterDescription: characterDescription,
          characterSheetPrompt: generationPrompt,
        },
        currentConfig.baseUrl, // for custom_openai
        charGenOptions,
      );

      // Collect character sheet generation debug logs
      const charGenLogData = {
        personaInput: {
          characterName: characterName,
          characterPrompt: characterDescription,
          characterMemories: [],
          characterId: "ai_generation",
        },
        systemPrompt: { character_sheet_generation: generationPrompt },
        outputResponse: {
          messages: response.messages,
          newMemory: response.newMemory,
          characterState: response.characterState,
          reactionDelay: response.reactionDelay,
        },
        parameters: {
          model: currentConfig.model,
          isProactive: false,
          forceSummary: false,
          messageCount: 1,
        },
        metadata: {
          chatId: null,
          chatType: "character_generation",
          timestamp: Date.now(),
          apiProvider,
          model: currentConfig.model,
        },
      };

      this.addStructuredLog(
        null,
        "character_generation",
        characterName,
        charGenLogData,
      );

      if (response && response.messages && response.messages.length > 0) {
        let aiResponse = response.messages[0].content;

        // Check for empty response
        if (!aiResponse || aiResponse.trim() === "") {
          throw new Error("Empty response received");
        }

        // Clean up response (remove unnecessary wrappers)
        aiResponse = aiResponse.trim();

        // If there is a code block or JSON wrapper, remove it
        if (aiResponse.startsWith("```")) {
          aiResponse = aiResponse
            .replace(/^```[\w]*\n?/, "")
            .replace(/\n?```$/, "");
        }

        // If there is a JSON wrapper, extract only the content
        const jsonMatch = aiResponse.match(
          /\{\s*"prompt"\s*:\s*"([\s\S]*?)"\s*\}/,
        );
        if (jsonMatch) {
          aiResponse = jsonMatch[1].replace(/\\n/g, "\n").replace(/\\\"/g, '"');
        }

        const nameInput = document.getElementById("character-name");
        const promptInput = document.getElementById("character-prompt");

        if (nameInput && promptInput) {
          // Save the value of the name field in advance
          const originalName = nameInput.value;

          // Update the state first to preserve the value even when the modal is re-rendered
          if (this.state.editingCharacter) {
            this.state.editingCharacter.prompt = aiResponse; // Overwrite existing content completely
            this.state.editingCharacter.name = originalName; // Also preserve name in state
          }

          // Also update DOM elements
          promptInput.value = aiResponse;
          nameInput.value = originalName; // Explicitly set the name field

          // Show success message after state update is complete
          setTimeout(() => {
            this.showInfoModal(
              t("modal.aiGenerationComplete.title"),
              t("modal.aiGenerationComplete.message", {
                characterName: characterName,
              }),
            );
          }, 100);
        } else {
          console.error("Elements not found:", { nameInput, promptInput });
          throw new Error(
            `Form elements not found - nameInput: ${!!nameInput}, promptInput: ${!!promptInput}`,
          );
        }
      } else {
        throw new Error("No response received from AI");
      }
    } catch (error) {
      console.error("AI character generation error:", error);
      this.showInfoModal(
        t("modal.generationFailed.title"),
        t("modal.generationFailed.message", { errorMessage: error.message }),
      );
    } finally {
      // Restore button
      generateBtn.disabled = false;
      generateBtn.innerHTML = originalText;
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  }

  handleCreateGroupChat() {
    const name = document.getElementById("group-chat-name").value.trim();
    const checkboxes = document.querySelectorAll(
      ".group-chat-character-checkbox:checked",
    );
    const participantIds = Array.from(checkboxes).map((cb) =>
      parseInt(cb.value),
    );

    if (!name) {
      this.showInfoModal(
        t("groupChat.groupChatNameRequired"),
        t("groupChat.groupChatNameRequiredMessage"),
      );
      return;
    }

    if (participantIds.length < 2) {
      this.showInfoModal(
        t("groupChat.participantsRequired"),
        t("groupChat.participantsRequiredMessage"),
      );
      return;
    }

    this.createGroupChat(name, participantIds);
  }

  handleCreateOpenChat() {
    const name = document.getElementById("open-chat-name").value.trim();

    if (!name) {
      this.showInfoModal(
        t("groupChat.openChatNameRequired"),
        t("groupChat.openChatNameRequiredMessage"),
      );
      return;
    }

    if (this.state.characters.length === 0) {
      this.showInfoModal(
        t("groupChat.noCharactersAvailable"),
        t("groupChat.noCharactersAvailableMessage"),
      );
      return;
    }

    this.createOpenChat(name);
  }

  handleDeleteGroupChat(groupChatId) {
    this.showConfirmModal(
      t("groupChat.deleteGroupChatTitle"),
      t("groupChat.deleteGroupChatMessage"),
      () => {
        // Group chat deletion logic
        const newGroupChats = { ...this.state.groupChats };
        delete newGroupChats[groupChatId];

        const newMessages = { ...this.state.messages };
        delete newMessages[groupChatId];

        const newUnreadCounts = { ...this.state.unreadCounts };
        delete newUnreadCounts[groupChatId];

        // If the deleted group chat is the currently selected chat, move to another chat room
        let newSelectedChatId = this.state.selectedChatId;
        if (this.state.selectedChatId === groupChatId) {
          newSelectedChatId = this.getFirstAvailableChatRoom();
        }

        // Update state
        this.setState({
          groupChats: newGroupChats,
          messages: newMessages,
          unreadCounts: newUnreadCounts,
          selectedChatId: newSelectedChatId,
        });

        // Save immediately
        saveToBrowserStorage("personaChat_groupChats_v16", newGroupChats);
        saveToBrowserStorage("personaChat_messages_v16", newMessages);
        saveToBrowserStorage("personaChat_unreadCounts_v16", newUnreadCounts);
      },
    );
  }

  handleDeleteOpenChat(openChatId) {
    this.showConfirmModal(
      t("groupChat.deleteOpenChatTitle"),
      t("groupChat.deleteOpenChatMessage"),
      () => {
        // Open chat deletion logic
        const newOpenChats = { ...this.state.openChats };
        delete newOpenChats[openChatId];

        const newMessages = { ...this.state.messages };
        delete newMessages[openChatId];

        const newUnreadCounts = { ...this.state.unreadCounts };
        delete newUnreadCounts[openChatId];

        // If the deleted open chat is the currently selected chat, move to another chat room
        let newSelectedChatId = this.state.selectedChatId;
        if (this.state.selectedChatId === openChatId) {
          newSelectedChatId = this.getFirstAvailableChatRoom();
        }

        // Update state
        this.setState({
          openChats: newOpenChats,
          messages: newMessages,
          unreadCounts: newUnreadCounts,
          selectedChatId: newSelectedChatId,
        });

        // Save immediately
        saveToBrowserStorage("personaChat_openChats_v16", newOpenChats);
        saveToBrowserStorage("personaChat_messages_v16", newMessages);
        saveToBrowserStorage("personaChat_unreadCounts_v16", newUnreadCounts);
      },
    );
  }

  // Debug log system
  addDebugLog(message, level = "info") {
    if (!this.state.enableDebugLogs) return;

    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      message,
      level,
      type: "simple",
    };

    const newLogs = [...this.state.debugLogs, logEntry].slice(-1000); // Keep max 1000 logs
    this.setState({ debugLogs: newLogs });
  }

  addStructuredLog(chatId, chatType, characterName, logData) {
    if (!this.state.enableDebugLogs) return;

    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      chatId,
      chatType, // 'general', 'group', 'open'
      characterName,
      type: "structured",
      // Structured data
      data: {
        personaInput: logData.personaInput || null,
        systemPrompt: logData.systemPrompt || null,
        outputResponse: logData.outputResponse || null,
        parameters: logData.parameters || {},
        metadata: {
          ...logData.metadata,
          chatType: chatType,
          chatId: chatId,
          characterName: characterName,
        },
      },
    };

    const newLogs = [...this.state.debugLogs, logEntry].slice(-1000); // Keep max 1000 logs
    this.setState({ debugLogs: newLogs });
  }

  async clearDebugLogs() {
    this.debouncedSaveDebugLogs.cancel();
    await saveToBrowserStorage("personaChat_debugLogs_v16", []);
    this.setState({ debugLogs: [] });
  }

  exportDebugLogs() {
    const dataStr = JSON.stringify(this.state.debugLogs, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `arisutalk-debug-logs-${
      new Date().toISOString().split("T")[0]
    }.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  }

  // --- SECURE STORAGE METHODS ---

  /**
   * Initialize secure storage system
   */
  async initializeSecureStorage() {
    try {
      await secureStorage.initialize();
      console.log("Secure storage initialized");
    } catch (error) {
      console.error("Failed to initialize secure storage:", error);
    }
  }

  /**
   * Save API configs - always encrypted
   * @param {Object} apiConfigs - API configurations to save
   */
  async saveApiConfigs(apiConfigs) {
    try {
      // Always save to encrypted storage
      await secureStorage.saveApiConfigs(apiConfigs);

      // Update state normally (API manager will handle decryption)
      this.setState({
        settings: {
          ...this.state.settings,
          apiConfigs: apiConfigs,
        },
      });
    } catch (error) {
      console.error("Failed to save API configs:", error);
      throw error;
    }
  }

  /**
   * Get API key for a specific provider (handles decryption)
   * @param {string} provider - Provider name
   * @returns {Promise<string|null>} - API key or null if not found
   */
  async getApiKey(provider) {
    try {
      // Always load from encrypted storage
      const encryptedConfigs = await secureStorage.loadApiConfigs();
      return encryptedConfigs?.[provider]?.apiKey || null;
    } catch (error) {
      console.error("Failed to get API key:", error);
      return null;
    }
  }

  // --- DATA MANAGEMENT METHODS ---

  /**
   * Reset all application data (complete factory reset)
   */
  async resetAllData() {
    try {
      // List of all storage keys used by the application
      const storageKeys = [
        "personaChat_settings_v16",
        "personaChat_characters_v16",
        "personaChat_messages_v16",
        "personaChat_unreadCounts_v16",
        "personaChat_chatRooms_v16",
        "personaChat_groupChats_v16",
        "personaChat_openChats_v16",
        "personaChat_characterStates_v16",
        "personaChat_userStickers_v16",
        "personaChat_settingsSnapshots_v16",
        "personaChat_debugLogs_v16",
        "personaChat_migration_v16",
        // Secure storage keys
        "personaChat_encryptedApiConfigs_v1",
        "personaChat_masterPasswordHint_v1",
        "personaChat_encryptionEnabled_v1",
      ];

      // Clear all regular storage
      for (const key of storageKeys) {
        saveToBrowserStorage(key, null);
      }

      // Clear encrypted storage - manually clear storage keys
      secureStorage.encryptionEnabled = false;
      secureStorage.masterPassword = null;

      // Clear session storage
      sessionStorage.clear();

      // Clear any cached data in memory
      this.apiManager.clearClients();

      // Re-initialize secure storage for next use
      await this.initializeSecureStorage();

      console.log("All application data has been reset");
    } catch (error) {
      console.error("Failed to reset all data:", error);
      throw new Error(
        "An error occurred while resetting data: " + error.message,
      );
    }
  }

  // === SNS 관련 함수들 ===
  
  getCharacterState(characterId) {
    return this.state.characterStates[characterId] || {
      affection: 0.2,
      intimacy: 0.2,  
      trust: 0.2,
      romantic_interest: 0
    };
  }

  setCharacterState(characterId, state) {
    this.setState({
      characterStates: {
        ...this.state.characterStates,
        [characterId]: { ...state }
      }
    });
  }

  checkSNSAccess(character, accessLevel) {
    let state = this.getCharacterState(character.id);
    const hypnosis = character.hypnosis || {};
    
    // 최면이 활성화되고 호감도 조작이 활성화된 경우 최면 값 사용
    if (hypnosis.enabled && hypnosis.affection_override) {
      state = {
        affection: hypnosis.affection !== null ? hypnosis.affection : state.affection,
        intimacy: hypnosis.intimacy !== null ? hypnosis.intimacy : state.intimacy,
        trust: hypnosis.trust !== null ? hypnosis.trust : state.trust,
        romantic_interest: hypnosis.romantic_interest !== null ? hypnosis.romantic_interest : state.romantic_interest
      };
    }
    
    
    // 최면 제어 우선 확인 (전체 권한)
    if (hypnosis.enabled) {
      
      if (hypnosis.sns_full_access) {
        return true;
      }
      if (accessLevel.includes('secret') && hypnosis.secret_account_access) {
        return true;
      }
    }
    
    // 접근 레벨별 요구사항 정의
    const requirements = {
      'main-public': { affection: 0, intimacy: 0, trust: 0, romantic_interest: 0 },        // 본계정: 상시 접근
      'main-private': { affection: 0.5, intimacy: 0.5, trust: 0.5, romantic_interest: 0 }, // 본계정 비밀글: 일정 수치 필요
      'secret-public': { affection: 0.7, intimacy: 0.7, trust: 0.7, romantic_interest: 0.4 }, // 뒷계정: 3개 수치 70%+ 연애수치 40%+ 필요
      'secret-private': { affection: 0.9, intimacy: 0.9, trust: 0.9, romantic_interest: 0.9 }, // 뒷계정 비밀글: 모든 수치 90% 이상
      public: { affection: 0, intimacy: 0, trust: 0, romantic_interest: 0 },        // 호환성용 - 상시 접근
      private: { affection: 0.5, intimacy: 0.5, trust: 0.5, romantic_interest: 0 }, // 호환성용
      secretPublic: { affection: 0.7, intimacy: 0.7, trust: 0.7, romantic_interest: 0.4 }, // 호환성용
      secretPrivate: { affection: 0.9, intimacy: 0.9, trust: 0.9, romantic_interest: 0.9 } // 호환성용
    };

    // main-public과 public 접근은 항상 허용 (기본 SNS 접근)
    if (accessLevel === 'main-public' || accessLevel === 'public') {
      return true;
    }
    
    const required = requirements[accessLevel] || requirements.public;
    
    const hasAccess = (
      state.affection >= required.affection &&
      state.intimacy >= required.intimacy &&
      state.trust >= required.trust &&
      state.romantic_interest >= required.romantic_interest
    );
    
    
    return hasAccess;
  }

  openSNSFeed(characterId) {
    const character = this.state.characters.find(char => char.id === characterId);
    if (!character) return;
    
    this.setState({
      showSNSModal: true,
      selectedSNSCharacter: characterId,
      snsActiveTab: 'posts'
    });
  }

  openSNSCharacterList(type) {
    this.setState({
      showSNSCharacterListModal: true,
      snsCharacterListType: type,
      snsCharacterSearchTerm: ''
    });
  }

  toggleSNSSecretMode() {
    this.setState({
      snsSecretMode: !this.state.snsSecretMode
    });
  }
}
