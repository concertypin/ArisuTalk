import { writable } from "svelte/store";
import type { Character, SNSPost } from "$types/character";

// Modal states
export const isDesktopSettingsModalVisible = writable(false);
export const isMobileSettingsPageVisible = writable(false);
export const isCharacterModalVisible = writable(false);
export const isPromptModalVisible = writable(false);
export const isCreateGroupChatModalVisible = writable(false);
export const isCreateOpenChatModalVisible = writable(false);
export const isEditGroupChatModalVisible = writable(false);
export const isDebugLogModalVisible = writable(false);
export const isDataBrowserModalVisible = writable(false);
export const isConfirmationModalVisible = writable(false);
export const isMasterPasswordModalVisible = writable(false);
export const confirmationModalData = writable<{
    title: string;
    message: string;
    onConfirm: (() => void) | null;
}>({
    title: "",
    message: "",
    onConfirm: null,
});
export const isSearchModalVisible = writable(false);
export const isSNSCharacterListModalVisible = writable(false);
export const isSNSFeedModalVisible = writable(false);
export const snsFeedCharacter = writable<Character | null>(null);
export const isSNSPostModalVisible = writable(false);
export const editingSNSPost = writable<(SNSPost & { characterId?: string | number, isNew?: boolean, isSecret?: boolean }) | { characterId: string | number; isNew: boolean; isSecret: boolean } | null>(null);
export const isPhonebookModalVisible = writable(false);
export const isMobileAuthModalVisible = writable(false);

/**
 * Tracks whether the remote phonebook feature is usable for the current user.
 * 'unknown' = not yet checked, 'enabled' = check succeeded, 'disabled' = check failed.
 */
export type PhonebookAccessState = "unknown" | "enabled" | "disabled";
export const phonebookAccessState = writable<PhonebookAccessState>("unknown");

// Chat Selection Modal
export const isChatSelectionModalVisible = writable(false);
export const chatSelectionModalData = writable<{ character?: Character }>({});

// UI component states
export const isMobile = writable(window.innerWidth < 768);
export const isSidebarCollapsed = writable(window.innerWidth < 768);
export const isMobileSearchVisible = writable(false);
export const isFabMenuVisible = writable(false);
export const isInputOptionsVisible = writable(false);
export const isUserStickerPanelVisible = writable(false);

// Image Zoom Modal
export const isImageZoomModalVisible = writable(false);
export const imageZoomModalData = writable<{ imageUrl: string | null; title: string | null }>({ imageUrl: null, title: null });

// Expanded images/stickers in chat
export const expandedImages = writable<Set<number | string>>(new Set());

// Desktop UI states
export const desktopSettings = writable({
    activePanel: "api", // 'api' | 'appearance' | 'character' | 'data' | 'advanced'
    isVisible: false,
});

// Generic UI states
export const openSettingsSections = writable(["ai"]);
export const fontScale = writable(1.0);

// 개발 모드 활성화 상태 (동적으로 결정)
export const isDevModeActive = writable(false);

// 개발 환경 확인을 위한 유틸리티 함수
export const isDevelopment = () => {
    // 동적으로 개발 환경 확인 (dev-init.ts에서 설정된 값 사용)
    const { subscribe } = isDevModeActive;
    let currentValue = false;
    subscribe((value) => (currentValue = value))();
    return currentValue;
};
