import { SupportedLanguage } from "./i18n";

export type Message = {
    id: number,
    sender: string,
    type: string,
    content: string,
    time: string,
    isMe: boolean,
    isError?: boolean,
    stickerData?: any,
    imageId?: string,
    hasText?: boolean,
    stickerId?: string,
    stickerName?: string,
};

export type Character = {
    id: number,
    name: string,
    prompt: string,
    avatar: string?,
    responseTime: string,
    thinkingTime: string,
    reactivity: string,
    tone: string,
    memories: string[],
    proactiveEnabled: boolean,
    messageCountSinceLastSummary: number,
    media: any[], //todo declare type
    stickers: any[], //todo declare type
};

export type Prompts = {
    main: any, //todo declare type
    profile_creation: string,
};

export type State = {
    settings: Settings,
    characters: Character[],
    chatRooms: any, //todo declare type
    messages: Record<string, Message[]>,
    unreadCounts: any, //todo declare type
    userStickers: any[], //todo declare type
    settingsSnapshots: any[], //todo declare type
    selectedChatId: string?,
    expandedCharacterId: number?,
    isWaitingForResponse: boolean,
    typingCharacterId: string?,
    sidebarCollapsed: boolean,
    showSettingsModal: boolean,
    showCharacterModal: boolean,
    showPromptModal: boolean,
    editingCharacter: Character?,
    editingMessageId: number?,
    editingChatRoomId: string?,
    searchQuery: string,
    modal: any, //todo declare type
    showInputOptions: boolean,
    imageToSend: {
        dataUrl: string,
        file: any, //todo declare type
    }?,
    stickerSelectionMode: boolean,
    selectedStickerIndices: number[],
    showUserStickerPanel: boolean,
    expandedStickers: Set<any>, //todo declare type
    openSettingsSections: string[],
};

export type Settings = {
    apiKey: string,
    model: string,
    userName: string,
    userDescription: string,
    proactiveChatEnabled: boolean,
    randomFirstMessageEnabled: boolean,
    randomCharacterCount: number,
    randomMessageFrequencyMin: number,
    randomMessageFrequencyMax: number,
    fontScale: number,
    snapshotsEnabled: boolean,
    language: SupportedLanguage,
    prompts: Prompts,
}