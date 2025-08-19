import { t, setLanguage, getLanguage } from "./i18n.js";
// Fixed typo: previously './defauts.js', now correctly './defaults.js'
import { defaultPrompts, defaultCharacters } from "./defaults.js";
import {
  loadFromBrowserStorage,
  saveToBrowserStorage,
  getLocalStorageUsage,
  getLocalStorageFallbackUsage,
} from "./storage.js";
import { GeminiClient } from "./api/gemini.js";
import { render } from "./ui.js";
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
import {
  handleModalClick,
  handleModalInput,
  handleModalChange,
} from "./handlers/modalHandlers.js";
import { debounce, findMessageGroup } from "./utils.js";

// --- APP INITIALIZATION ---
document.addEventListener("DOMContentLoaded", async () => {
  window.personaApp = new PersonaChatApp();
  await window.personaApp.init();
});

class PersonaChatApp {
  constructor() {
    this.defaultPrompts = defaultPrompts;
    this.state = {
      settings: {
        apiKey: "",
        model: "gemini-2.5-flash",
        userName: "",
        userDescription: "",
        proactiveChatEnabled: false,
        randomFirstMessageEnabled: false,
        randomCharacterCount: 3,
        randomMessageFrequencyMin: 10,
        randomMessageFrequencyMax: 120,
        fontScale: 1.0,
        snapshotsEnabled: true,
        language: getLanguage(), // Initialize with current language
        prompts: {
          main: { ...this.defaultPrompts.main },
          profile_creation: this.defaultPrompts.profile_creation,
        },
      },
      characters: defaultCharacters,
      chatRooms: {},
      messages: {},
      unreadCounts: {},
      userStickers: [],
      settingsSnapshots: [],
      selectedChatId: null,
      expandedCharacterId: null,
      isWaitingForResponse: false,
      typingCharacterId: null,
      sidebarCollapsed: window.innerWidth < 768,
      showSettingsModal: false,
      showCharacterModal: false,
      showPromptModal: false,
      editingCharacter: null,
      editingMessageId: null,
      editingChatRoomId: null,
      searchQuery: "",
      modal: { isOpen: false, title: "", message: "", onConfirm: null },
      showInputOptions: false,
      imageToSend: null,
      stickerSelectionMode: false,
      selectedStickerIndices: [],
      showUserStickerPanel: false,
      expandedStickers: new Set(),
      openSettingsSections: ["ai"],
    };
    this.oldState = null;
    this.messagesEndRef = null;
    this.proactiveInterval = null;
    this.animatedMessageIds = new Set();
    this.initialSettings = null;

    this.debouncedSaveSettings = debounce(
      (settings) => saveToBrowserStorage("personaChat_settings_v16", settings),
      500
    );
    this.debouncedSaveCharacters = debounce(
      (characters) =>
        saveToBrowserStorage("personaChat_characters_v16", characters),
      500
    );
    this.debouncedSaveChatRooms = debounce(
      (chatRooms) =>
        saveToBrowserStorage("personaChat_chatRooms_v16", chatRooms),
      500
    );
    this.debouncedSaveMessages = debounce(
      (messages) => saveToBrowserStorage("personaChat_messages_v16", messages),
      500
    );
    this.debouncedSaveUnreadCounts = debounce(
      (unreadCounts) =>
        saveToBrowserStorage("personaChat_unreadCounts_v16", unreadCounts),
      500
    );
    this.debouncedSaveUserStickers = debounce(
      (userStickers) =>
        saveToBrowserStorage("personaChat_userStickers_v16", userStickers),
      500
    );
    this.debouncedSaveSettingsSnapshots = debounce(
      (snapshots) =>
        saveToBrowserStorage("personaChat_settingsSnapshots_v16", snapshots),
      500
    );
  }

  createSettingsSnapshot() {
    if (!this.state.settings.snapshotsEnabled) return;

    const newSnapshot = {
      timestamp: Date.now(),
      settings: { ...this.state.settings },
    };

    const newSnapshots = [newSnapshot, ...this.state.settingsSnapshots].slice(
      0,
      10
    );
    this.setState({ settingsSnapshots: newSnapshots });
  }

  // --- CORE METHODS ---
  async init() {
    setLanguage(getLanguage()); // Ensure language is set and UI updated on init
    await this.loadAllData();
    this.applyFontScale();
    await this.migrateChatData();

    render(this);
    this.addEventListeners();

    const initialChatId = this.getFirstAvailableChatRoom();
    if (this.state.characters.length > 0 && !this.state.selectedChatId) {
      this.setState({ selectedChatId: initialChatId });
    } else {
      render(this);
    }

    this.proactiveInterval = setInterval(
      () => this.checkAndSendProactiveMessages(),
      60000
    );

    if (this.state.settings.randomFirstMessageEnabled) {
      this.scheduleMultipleRandomChats();
    }
  }

  openSettingsModal() {
    this.initialSettings = { ...this.state.settings };
    this.setState({ showSettingsModal: true });
  }

  handleSaveSettings() {
    const wasRandomDisabled =
      this.initialSettings && !this.initialSettings.randomFirstMessageEnabled;
    const isRandomEnabled = this.state.settings.randomFirstMessageEnabled;

    // Create a snapshot of the settings when the user explicitly saves.
    this.createSettingsSnapshot();

    this.setState({ showSettingsModal: false, initialSettings: null });

    if (wasRandomDisabled && isRandomEnabled) {
      this.scheduleMultipleRandomChats();
    }
  }

  handleCancelSettings() {
    const hasChanges =
      JSON.stringify(this.initialSettings) !==
      JSON.stringify(this.state.settings);

    if (hasChanges) {
      this.showConfirmModal(
        t("modal.cancelChanges.title"),
        t("modal.cancelChanges.message"),
        () => {
          if (this.initialSettings) {
            this.setState({
              settings: this.initialSettings,
              showSettingsModal: false,
              initialSettings: null,
              modal: { isOpen: false, title: "", message: "", onConfirm: null },
            });
          } else {
            this.setState({
              showSettingsModal: false,
              modal: { isOpen: false, title: "", message: "", onConfirm: null },
            });
          }
        }
      );
    } else {
      this.setState({ showSettingsModal: false, initialSettings: null });
    }
  }

  handleToggleSnapshots(enabled) {
    this.setState({
      settings: { ...this.state.settings, snapshotsEnabled: enabled },
    });
  }

  handleRestoreSnapshot(timestamp) {
    const snapshot = this.state.settingsSnapshots.find(
      (s) => s.timestamp === timestamp
    );
    if (snapshot) {
      this.setState({ settings: snapshot.settings });
    }
  }

  handleDeleteSnapshot(timestamp) {
    const newSnapshots = this.state.settingsSnapshots.filter(
      (s) => s.timestamp !== timestamp
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

  async loadAllData() {
    try {
      const [
        settings,
        characters,
        chatRooms,
        messages,
        unreadCounts,
        userStickers,
        settingsSnapshots,
      ] = await Promise.all([
        loadFromBrowserStorage("personaChat_settings_v16", {}),
        loadFromBrowserStorage("personaChat_characters_v16", defaultCharacters),
        loadFromBrowserStorage("personaChat_chatRooms_v16", {}),
        loadFromBrowserStorage("personaChat_messages_v16", {}),
        loadFromBrowserStorage("personaChat_unreadCounts_v16", {}),
        loadFromBrowserStorage("personaChat_userStickers_v16", []),
        loadFromBrowserStorage("personaChat_settingsSnapshots_v16", []),
      ]);

      this.state.settings = {
        ...this.state.settings,
        ...settings,
        prompts: {
          main: {
            ...this.defaultPrompts.main,
            ...(settings.prompts?.main || {}),
          },
          profile_creation:
            settings.prompts?.profile_creation ||
            this.defaultPrompts.profile_creation,
        },
      };

      this.state.characters = characters.map((char) => ({
        ...char,
        id: Number(char.id),
      }));
      this.state.chatRooms = chatRooms;
      this.state.messages = messages;
      this.state.unreadCounts = unreadCounts;
      this.state.userStickers = userStickers;
      this.state.settingsSnapshots = settingsSnapshots;
    } catch (error) {
      console.error(t("modal.loadFailed.title"), error);
    }
  }

  setState(newState) {
    this.oldState = { ...this.state };
    this.state = { ...this.state, ...newState };

    render(this);

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
  }

  applyFontScale() {
    document.documentElement.style.setProperty(
      "--font-scale",
      this.state.settings.fontScale
    );
  }

  // --- EVENT LISTENERS ---
  addEventListeners() {
    const appElement = document.getElementById("app");

    appElement.addEventListener("click", (e) => {
      handleSidebarClick(e, this);
      handleMainChatClick(e, this);
      handleModalClick(e, this);
    });

    appElement.addEventListener("input", (e) => {
      handleSidebarInput(e, this);
      handleMainChatInput(e, this);
      handleModalInput(e, this);
    });

    appElement.addEventListener("change", (e) => {
      handleMainChatChange(e, this);
      handleModalChange(e, this);
    });

    appElement.addEventListener("keypress", (e) => {
      handleMainChatKeypress(e, this);
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".input-area-container")) {
        this.setState({ showInputOptions: false });
      }
    });
  }

  // --- CHAT ROOM MANAGEMENT ---
  async migrateChatData() {
    const migrationCompleted = await loadFromBrowserStorage(
      "personaChat_migration_v16",
      false
    );
    if (migrationCompleted) return;

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
          name: t("chat.defaultChatName"),
          createdAt: Date.now(),
          lastActivity: Date.now(),
        };

        newChatRooms[characterId] = [defaultChatRoom];
        newMessages[defaultChatRoomId] = oldMessagesForChar;
      } else {
        newChatRooms[characterId] = [];
      }
    });

    this.setState({
      chatRooms: newChatRooms,
      messages: newMessages,
    });

    saveToBrowserStorage("personaChat_migration_v16", true);
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

  createNewChatRoom(characterId, chatName = t("chat.newChat")) {
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

    return newChatRoomId;
  }

  toggleCharacterExpansion(characterId) {
    const numericCharacterId = Number(characterId);
    const newExpandedId =
      this.state.expandedCharacterId === numericCharacterId
        ? null
        : numericCharacterId;
    this.setState({ expandedCharacterId: newExpandedId });
  }

  createNewChatRoomForCharacter(characterId) {
    const numericCharacterId = Number(characterId);
    const newChatRoomId = this.createNewChatRoom(numericCharacterId);
    this.selectChatRoom(newChatRoomId);
    this.setState({ expandedCharacterId: numericCharacterId });
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
  }

  editCharacter(characterId) {
    const numericCharacterId = Number(characterId);
    const character = this.state.characters.find(
      (c) => c.id === numericCharacterId
    );
    if (character) {
      this.openEditCharacterModal(character);
    }
  }

  deleteCharacter(characterId) {
    const numericCharacterId = Number(characterId);
    this.handleDeleteCharacter(numericCharacterId);
  }

  getCurrentChatRoom() {
    if (!this.state.selectedChatId) return null;

    for (const characterId in this.state.chatRooms) {
      const chatRooms = this.state.chatRooms[characterId];
      const chatRoom = chatRooms.find(
        (room) => room.id === this.state.selectedChatId
      );
      if (chatRoom) return chatRoom;
    }
    return null;
  }

  deleteChatRoom(chatRoomId) {
    const chatRoom = this.getChatRoomById(chatRoomId);
    if (!chatRoom) return;

    this.showConfirmModal(
      t("modal.deleteChatRoom.title"),
      t("modal.deleteChatRoom.message"),
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
      }
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
          room.id === chatRoomId ? { ...room, name: newNameTrimmed } : room
        ),
      },
      editingChatRoomId: null,
    });
  }

  handleChatRoomNameKeydown(event, chatRoomId) {
    if (event.key === "Escape") {
      event.preventDefault();
      this.cancelEditingChatRoom();
    }
  }

  getChatRoomById(chatRoomId) {
    for (const characterId in this.state.chatRooms) {
      const chatRoom = this.state.chatRooms[characterId].find(
        (room) => room.id === chatRoomId
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
    const expandedStickers = new Set(this.state.expandedStickers);
    if (expandedStickers.has(messageId)) {
      expandedStickers.delete(messageId);
    } else {
      expandedStickers.add(messageId);
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
      (s) => s.id !== stickerId
    );
    this.setState({ userStickers: newStickers });
  }

  editUserStickerName(stickerId) {
    const sticker = this.state.userStickers.find((s) => s.id === stickerId);
    if (!sticker) return;

    const newName = prompt(t("modal.editStickerName.title"), sticker.name);
    if (newName !== null && newName.trim() !== "") {
      const newStickers = this.state.userStickers.map((s) =>
        s.id === stickerId ? { ...s, name: newName.trim() } : s
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
        alert(`${file.name}${t("modal.unsupportedFileType.message")}`);
        continue;
      }

      if (file.size > 30 * 1024 * 1024) {
        alert(`${file.name}${t("modal.fileTooLarge.message2")}`);
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
        console.error(t("modal.fileProcessingError.title"), error);
        alert(t("modal.fileProcessingError.message"));
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
    this.setState({ modal: { isOpen: true, title, message, onConfirm: null } });
  }

  showConfirmModal(title, message, onConfirm) {
    this.setState({ modal: { isOpen: true, title, message, onConfirm } });
  }

  closeModal() {
    this.setState({
      modal: { isOpen: false, title: "", message: "", onConfirm: null },
    });
  }

  handleModelSelect(model) {
    this.setState({ settings: { ...this.state.settings, model } });
  }

  handleLanguageSelect(lang) {
    setLanguage(lang);
    this.setState({ settings: { ...this.state.settings, language: lang } });
  }

  handleSavePrompts() {
    const newPrompts = {
      main: {
        system_rules: document.getElementById("prompt-main-system_rules").value,
        role_and_objective: document.getElementById(
          "prompt-main-role_and_objective"
        ).value,
        memory_generation: document.getElementById(
          "prompt-main-memory_generation"
        ).value,
        character_acting: document.getElementById(
          "prompt-main-character_acting"
        ).value,
        message_writing: document.getElementById("prompt-main-message_writing")
          .value,
        language: document.getElementById("prompt-main-language").value,
        additional_instructions: document.getElementById(
          "prompt-main-additional_instructions"
        ).value,
        sticker_usage: document.getElementById("prompt-main-sticker_usage")
          .value,
      },
      profile_creation: document.getElementById("prompt-profile_creation")
        .value,
    };

    this.setState({
      settings: { ...this.state.settings, prompts: newPrompts },
      showPromptModal: false,
      modal: {
        isOpen: true,
        title: t("modal.promptSaveComplete.title"),
        message: t("modal.promptSaveComplete.message"),
        onConfirm: null,
      },
    });
  }

  openNewCharacterModal() {
    this.setState({
      editingCharacter: { memories: [], proactiveEnabled: true },
      showCharacterModal: true,
      stickerSelectionMode: false,
      selectedStickerIndices: [],
    });
  }

  openEditCharacterModal(character) {
    this.setState({
      editingCharacter: { ...character, memories: character.memories || [] },
      showCharacterModal: true,
      stickerSelectionMode: false,
      selectedStickerIndices: [],
    });
  }

  closeCharacterModal() {
    this.setState({
      showCharacterModal: false,
      editingCharacter: null,
      stickerSelectionMode: false,
      selectedStickerIndices: [],
    });
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
          t("modal.fileTooLarge.title"),
          `${file.name}${t("modal.fileTooLarge.message2")}`
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
          t("modal.unsupportedFileType.title"),
          `${file.name}${t("modal.unsupportedFileType.message2")}`
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
              0.85
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
          `${t("modal.stickerProcessingError.title")}: ${file.name}`,
          error
        );
        this.showInfoModal(
          t("modal.stickerProcessingError.title"),
          `${file.name}${t("modal.stickerProcessingError.message")}`
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
      const storageCheck = getLocalStorageFallbackUsage(
        characterDataString,
        "personaChat_characters_v16"
      );

      if (!storageCheck.canSave) {
        this.showInfoModal(
          t("modal.noSpaceError.title"),
          t("modal.noSpaceError.message2")
        );
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

      const newName = prompt(t("modal.editStickerName.title"), sticker.name);
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
          ? "선택<br>해제"
          : "선택<br>모드";
    }

    let selectAllButton = document.getElementById("select-all-stickers");
    if (this.state.stickerSelectionMode) {
      if (!selectAllButton) {
        const selectAllHTML = `
                    <button id="select-all-stickers" class="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex flex-col items-center gap-1">
                        <i data-lucide="check-circle" class="w-4 h-4"></i> 
                        <span class="text-xs">전체<br>선택</span>
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
      (_, index) => !selectedSet.has(index)
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

    if (!name || !prompt) {
      this.showInfoModal(
        t("modal.characterNameDescriptionNotFulfilled.title"),
        t("modal.characterNameDescriptionNotFulfilled.message")
      );
      return;
    }

    const memoryNodes = document.querySelectorAll(".memory-input");
    const memories = Array.from(memoryNodes)
      .map((input) => input.value.trim())
      .filter(Boolean);

    const proactiveToggle = document.getElementById(
      "character-proactive-toggle"
    );
    const proactiveEnabled = proactiveToggle
      ? proactiveToggle.checked
      : this.state.editingCharacter?.proactiveEnabled !== false;

    const characterData = {
      name,
      prompt,
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
    };

    // Add storage check before saving character
    const characterDataString = JSON.stringify(characterData);
    const storageCheck = getLocalStorageFallbackUsage(
      characterDataString,
      "personaChat_characters_v16"
    );

    if (!storageCheck.canSave) {
      this.showInfoModal(
        t("modal.noSpaceError.title"),
        t("modal.noSpaceError.message2")
      );
      return;
    }

    if (this.state.editingCharacter && this.state.editingCharacter.id) {
      const updatedCharacters = this.state.characters.map((c) =>
        c.id === this.state.editingCharacter.id
          ? { ...c, ...characterData }
          : c
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
        stickers: [],
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

  handleDeleteCharacter(characterId) {
    const numericCharacterId = Number(characterId);
    this.showConfirmModal(
      t("modal.characterDeleteConfirm.title"),
      t("modal.characterDeleteConfirm.message"),
      () => {
        const newCharacters = this.state.characters.filter(
          (c) => c.id !== numericCharacterId
        );
        const newMessages = { ...this.state.messages };
        const newChatRooms = { ...this.state.chatRooms };
        const newUnreadCounts = { ...this.state.unreadCounts };
        let newSelectedChatId = this.state.selectedChatId;

        const characterChatRooms =
          this.state.chatRooms[numericCharacterId] || [];
        characterChatRooms.forEach((chatRoom) => {
          delete newMessages[chatRoom.id];
          delete newUnreadCounts[chatRoom.id];
        });
        delete newChatRooms[numericCharacterId];

        const selectedChatRoom = this.getCurrentChatRoom();
        if (
          selectedChatRoom &&
          selectedChatRoom.characterId === numericCharacterId
        ) {
          newSelectedChatId = this.getFirstAvailableChatRoom();
        }

        this.setState({
          characters: newCharacters,
          messages: newMessages,
          chatRooms: newChatRooms,
          unreadCounts: newUnreadCounts,
          selectedChatId: newSelectedChatId,
          expandedCharacterId: null,
          modal: { isOpen: false, title: "", message: "", onConfirm: null },
        });
      }
    );
  }

  async handleImageFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      this.showInfoModal(
        t("modal.imageFileSizeExceeded.title"),
        t("modal.imageFileSizeExceeded.message")
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
        t("modal.imageProcessingError.message")
      );
    } finally {
      if (e && e.target) e.target.value = "";
    }
  }

  async handleSendMessage(content, type = "text", stickerData = null) {
    const { selectedChatId, isWaitingForResponse, settings, imageToSend } =
      this.state;

    if (!selectedChatId || isWaitingForResponse) return;
    if (type === "text" && !content.trim() && !imageToSend) return;
    if (type === "image" && !imageToSend) return;
    if (type === "sticker" && !stickerData) return;

    if (!settings.apiKey) {
      this.showInfoModal(
        t("modal.apiKeyRequired.title"),
        t("modal.apiKeyRequired.message")
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

    const selectedChatRoom = this.getCurrentChatRoom();
    if (!selectedChatRoom) return;

    const charIndex = this.state.characters.findIndex(
      (c) => c.id === selectedChatRoom.characterId
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
    });

    this.triggerApiCall(newMessagesState, false, false, forceSummary);
  }

  async triggerApiCall(
    currentMessagesState,
    isProactive = false,
    isReroll = false,
    forceSummary = false
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

    const geminiClient = new GeminiClient(
      this.state.settings.apiKey,
      this.state.settings.model
    );
    const response = await geminiClient.generateContent({
      userName: this.state.settings.userName,
      userDescription: this.state.settings.userDescription,
      character: character,
      history: history,
      prompts: this.state.settings.prompts,
      isProactive: isProactive,
      forceSummary: forceSummary,
    });

    if (response.newMemory && response.newMemory.trim() !== "") {
      const charIndex = this.state.characters.findIndex(
        (c) => c.id === character.id
      );
      if (charIndex !== -1) {
        const updatedCharacters = [...this.state.characters];
        const charToUpdate = { ...updatedCharacters[charIndex] };
        charToUpdate.memories = charToUpdate.memories || [];
        charToUpdate.memories.push(response.newMemory.trim());
        this.shouldSaveCharacters = true;
        this.setState({ characters: updatedCharacters });
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
              ""
            );
            if (baseFileName === searchFileName) return true;
            return false;
          });
          botMessage.stickerName = foundSticker?.name || "Unknown Sticker";
        }

        currentChatMessages = [...currentChatMessages, botMessage];

        if (isProactive && chatId !== this.state.selectedChatId) {
          newUnreadCounts[chatId] = (newUnreadCounts[chatId] || 0) + 1;
        }

        this.setState({
          messages: { ...this.state.messages, [chatId]: currentChatMessages },
          unreadCounts: newUnreadCounts,
        });
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
      this.setState({
        messages: {
          ...this.state.messages,
          [chatId]: [...currentChatMessages, errorMessage],
        },
      });
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
        }s`
      );
      setTimeout(() => this.initiateSingleRandomCharacter(), randomDelay);
    }
  }

  async initiateSingleRandomCharacter() {
    const { apiKey, model, userName, userDescription } = this.state.settings;
    if (!userName.trim() || !userDescription.trim()) {
      console.warn(t("modal.cannotGenerateRandomCharacter.message"));
      return;
    }

    try {
      const geminiClient = new GeminiClient(apiKey, model);
      const profile = await geminiClient.generateProfileFromDescription({
        userName: userName,
        userDescription: userDescription,
        existingNames: this.state.characters.map((c) => c.name),
        prompt: this.state.settings.prompts.profile_creation,
      });

      if (profile.error) {
        console.error(
          t("modal.failedToGenerateProfile.message"),
          profile.error
        );
        return;
      }
      if (
        !profile.name ||
        typeof profile.name !== "string" ||
        profile.name.trim() === ""
      ) {
        console.warn(t("modal.invalidProfileName.message"), profile);
        return;
      }
      if (
        !profile.prompt ||
        typeof profile.prompt !== "string" ||
        profile.prompt.trim() === ""
      ) {
        console.warn(t("modal.invalidProfilePrompt.message"), profile);
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

      const response = await geminiClient.generateContent({
        userName: userName,
        userDescription: userDescription,
        character: tempCharacter,
        history: [],
        prompts: this.state.settings.prompts,
        isProactive: true,
        forceSummary: false,
      });
      if (response.error) {
        console.error(
          t("modal.failedToGetFirstMessage.message"),
          response.error
        );
        return;
      }
      if (
        !response.messages ||
        !Array.isArray(response.messages) ||
        response.messages.length === 0
      ) {
        console.warn(t("modal.invalidFirstMessage.message"), response);
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
        t("chat.randomChatName")
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
        error
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
          currentMessages.findIndex((msg) => msg.id === lastMessageId)
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
      }
    );
  }

  async handleSaveEditedMessage(lastMessageId) {
    const textarea = document.querySelector(
      `.edit-message-textarea[data-id="${lastMessageId}"]`
    );
    if (!textarea) return;
    const newContent = textarea.value.trim();

    const currentMessages =
      this.state.messages[this.state.selectedChatId] || [];
    const groupInfo = findMessageGroup(
      currentMessages,
      currentMessages.findIndex((msg) => msg.id === lastMessageId)
    );
    if (!groupInfo) return;

    const originalMessage = currentMessages[groupInfo.startIndex];
    if (originalMessage.type === "text" && !newContent) {
      this.showInfoModal(
        t("modal.messageEmptyError.title"),
        t("modal.messageEmptyError.message")
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
      currentMessages.findIndex((msg) => msg.id === lastMessageId)
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
      0
    );
  }

  addMemoryField() {
    const container = document.getElementById("memory-container");
    if (container) {
      container.insertAdjacentHTML("beforeend", renderMemoryInput());
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
        { once: true }
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
        { once: true }
      );
    }
  }

  encodeTextInImage(imageData, text) {
    const data = imageData.data;
    const textBytes = new TextEncoder().encode(text);
    const textLength = textBytes.length;
    const headerSizeInPixels = 8;
    const availableDataPixels = data.length / 4 - headerSizeInPixels;

    if (textLength > availableDataPixels) {
      this.showInfoModal(
        t("modal.imageTooSmallOrCharacterInfoTooLong.title"),
        t("modal.imageTooSmallOrCharacterInfoTooLong.message")
      );
      return null;
    }

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
        t("modal.characterCardNoNameError.message")
      );
      return;
    }
    const currentAvatar = this.state.editingCharacter?.avatar;
    if (!currentAvatar) {
      this.showInfoModal(
        t("modal.characterCardNoAvatarImageError.title"),
        t("modal.characterCardNoAvatarImageError.message")
      );
      return;
    }

    const memoryNodes = document.querySelectorAll(".memory-input");
    const memories = Array.from(memoryNodes)
      .map((input) => input.value.trim())
      .filter(Boolean);

    const proactiveToggle = document.getElementById(
      "character-proactive-toggle"
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
    };

    const image = new Image();
    image.crossOrigin = "Anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const jsonString = JSON.stringify(characterData);
      const newImageData = this.encodeTextInImage(imageData, jsonString);

      if (newImageData) {
        ctx.putImageData(newImageData, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `${characterData.name}_card.png`;
        link.click();
      }
    };
    image.onerror = () =>
      this.showInfoModal(
        t("modal.avatarImageLoadError.title"),
        t("modal.avatarImageLoadError.message")
      );
    image.src = currentAvatar;
  }

  async loadCharacterFromImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageSrc = e.target.result;
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        try {
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
                t("modal.avatarLoadSuccess.message")
              );
              return;
            }
          }
        } catch (err) {
          console.error("Failed to parse character data from image:", err);
        }

        this.showInfoModal(
          t("modal.characterCardNoAvatarImageInfo.title"),
          t("modal.characterCardNoAvatarImageInfo.message")
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
        t("modal.backupComplete.message")
      );
    } catch (error) {
      console.error("Backup failed:", error);
      this.showInfoModal(
        t("modal.backupFailed.title"),
        t("modal.backupFailed.message")
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
                backupData.settings
              );
              saveToBrowserStorage(
                "personaChat_characters_v16",
                backupData.characters
              );
              saveToBrowserStorage(
                "personaChat_messages_v16",
                backupData.messages
              );
              saveToBrowserStorage(
                "personaChat_unreadCounts_v16",
                backupData.unreadCounts
              );
              saveToBrowserStorage(
                "personaChat_chatRooms_v16",
                backupData.chatRooms || {}
              );
              saveToBrowserStorage(
                "personaChat_userStickers_v16",
                backupData.userStickers || []
              );
              this.showInfoModal(
                t("modal.restoreComplete.title"),
                t("modal.restoreComplete.message")
              );
              setTimeout(() => window.location.reload(), 2000);
            }
          );
        } else {
          throw new Error("Invalid backup file format.");
        }
      } catch (error) {
        console.error("Restore failed:", error);
        this.showInfoModal(
          t("modal.restoreFailed.title"),
          t("modal.restoreFailed.message")
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
        t("modal.promptBackupComplete.message")
      );
    } catch (error) {
      console.error("Prompt backup failed:", error);
      this.showInfoModal(
        t("modal.promptBackupFailed.title"),
        t("modal.promptBackupFailed.message")
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
                  title: "불러오기 완료",
                  message: "프롬프트를 성공적으로 불러왔습니다.",
                  onConfirm: null,
                },
              });
            }
          );
        } else {
          throw new Error("Invalid prompts backup file format.");
        }
      } catch (error) {
        console.error("Prompt restore failed:", error);
        this.showInfoModal(
          t("modal.promptRestoreFailed.title"),
          t("modal.promptRestoreFailed.message")
        );
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  resetPromptToDefault(section, key, promptName) {
    this.showConfirmModal(
      t("modal.promptReset.title"),
      t("modal.promptReset.message", { promptName }),
      () => {
        import("./defaults.js").then(({ defaultPrompts }) => {
          const currentPrompts = { ...this.state.settings.prompts };

          if (section === "main") {
            currentPrompts.main[key] = defaultPrompts.main[key];
          } else if (section === "profile_creation") {
            currentPrompts.profile_creation = defaultPrompts.profile_creation;
          }

          this.state.settings.prompts = currentPrompts;

          let textareaId =
            section === "main"
              ? `prompt-main-${key}`
              : "prompt-profile_creation";
          const textarea = document.getElementById(textareaId);
          if (textarea) {
            textarea.value =
              section === "main"
                ? defaultPrompts.main[key]
                : defaultPrompts.profile_creation;
          }

          this.showInfoModal(
            t("modal.promptResetComplete.title"),
            t("modal.promptResetComplete.message", { promptName })
          );
        });
      }
    );
  }
}