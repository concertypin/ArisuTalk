
/**
 * @fileoverview Defines the shape of the application state for type safety and clarity.
 * This file includes inferred types based on the existing state structure.
 */
// --- Placeholder types for unknown structures ---

import { Character } from "./character";

// These would be defined in more detail elsewhere in a real application.
type ChatRoom = any;
type GroupChat = any;
type OpenChat = any;
type CharacterState = any;
type Message = any;
type Sticker = any;
type DebugLog = any;
type ApiSettings = any;

// --- Inferred types for specific object shapes ---

type ExperimentalSettings = {
    enableCorsProxy: boolean;
}

type Settings = {
    // Legacy compatibility
    apiKey: string;
    model: string;
    // New API diversification settings
    [key: string]: ApiSettings;
    userName: string;
    userDescription: string;
    proactiveChatEnabled: boolean;
    randomFirstMessageEnabled: boolean;
    randomCharacterCount: number;
    randomMessageFrequencyMin: number;
    randomMessageFrequencyMax: number;
    fontScale: number;
    snapshotsEnabled: boolean;
    experimental: ExperimentalSettings;
}

type ModalState = {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: (() => void) | null;
}

type StickerPreviewModalState = {
    isOpen: boolean;
    sticker: Sticker | null;
    index: number | null;
}

type DesktopSettingsUI = {
    activePanel: "api" | "appearance" | "character" | "data" | "advanced";
    isVisible: boolean;
}

type UIState = {
    settingsUIMode: "mobile" | "desktop" | null;
    desktopSettings: DesktopSettingsUI;
}

type ImageResultModalState = {
    isOpen: boolean;
    imageUrl: string | null;
    promptText: string | null;
}

// --- Main State Interface ---

export type AppState = {
    settings: Settings;
    characters: Character[];
    chatRooms: Record<string, ChatRoom>;
    groupChats: Record<string, GroupChat>;
    openChats: Record<string, OpenChat>;
    characterStates: Record<string, CharacterState>;
    messages: Record<string, Message>;
    unreadCounts: Record<string, number>;
    userStickers: Sticker[];
    settingsSnapshots: Settings[];
    selectedChatId: string | null;
    expandedCharacterIds: Set<string | number>;
    isWaitingForResponse: boolean;
    typingCharacterId: string | null;
    sidebarCollapsed: boolean;
    showSettingsModal: boolean;
    showSettingsUI: boolean;
    showCharacterModal: boolean;
    showPromptModal: boolean;
    showCreateGroupChatModal: boolean;
    createGroupChatName: string;
    createGroupChatScrollTop: number;
    showCreateOpenChatModal: boolean;
    showEditGroupChatModal: boolean;
    editingGroupChat: GroupChat | null;
    editingCharacter: Character | null;
    editingMessageId: string | number | null;
    editingChatRoomId: string | number | null;
    showMobileSearch: boolean;
    showFabMenu: boolean;
    searchQuery: string;
    modal: ModalState;
    stickerPreviewModal: StickerPreviewModalState;
    showInputOptions: boolean;
    imageToSend: File | string | null;
    currentMessage: string;
    showDebugLogsModal: boolean;
    enableDebugLogs: boolean;
    debugLogs: DebugLog[];
    stickerSelectionMode: boolean;
    selectedStickerIndices: number[];
    showUserStickerPanel: boolean;
    stickerToSend: Sticker | null;
    expandedStickers: Set<string | number>;
    openSettingsSections: string[];
    ui: UIState;
    showAiSettingsUI: boolean;
    showScaleSettingsUI: boolean;
    mobileEditModeCharacterId: string | null;
    modalOpeningEvent: Event | null;
    // SNS System State
    showSNSCharacterListModal: boolean;
    showSNSModal: boolean;
    showSNSPostModal: boolean;
    selectedSNSCharacter: Character | null;
    snsActiveTab: string; // Could be a literal type like 'posts' | 'followers'
    snsCharacterListType: string | null;
    snsCharacterSearchTerm: string;
    snsSecretMode: boolean;
    // Image Result Modal
    imageResultModal: ImageResultModalState;
}