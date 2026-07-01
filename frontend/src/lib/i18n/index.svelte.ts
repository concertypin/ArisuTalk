/**
 * @fileoverview Minimal i18n system for ArisuTalk.
 * Supports Korean ('ko') and English ('en') locales.
 * Uses Svelte 5 runes for reactive locale switching.
 */

import { Logger } from "@common/logger/Logger";

/** Supported locale codes. */
export type Locale = "ko" | "en";

/** Translation key-value map for a single locale. */
export type TranslationMap = Record<string, string>;

/**
 * Registry of all translation strings keyed by locale.
 * Extend this object as more UI text is internationalized.
 */
export const translations: Record<Locale, TranslationMap> = {
    ko: {
        // General settings
        "settings.general.title": "일반 설정",
        "settings.general.theme": "테마",
        "settings.general.theme.system": "시스템",
        "settings.general.theme.light": "라이트",
        "settings.general.theme.dark": "다크",
        "settings.general.language": "언어",
        "settings.general.language.ko": "한국어",
        "settings.general.language.en": "English",
        "settings.general.typography": "타이포그래피",
        "settings.general.fontFamily": "글꼴",
        "settings.general.fontSize": "글자 크기",
        "settings.general.fontSize.small": "작게",
        "settings.general.fontSize.medium": "중간",
        "settings.general.fontSize.large": "크게",

        // Settings modal
        "settings.title": "설정",
        "settings.tab.general": "일반",
        "settings.tab.models": "모델",
        "settings.tab.prompts": "프롬프트",
        "settings.tab.advanced": "고급",
        "settings.tab.about": "정보",
        "settings.cancel": "취소",
        "settings.save": "저장 및 닫기",

        // About page
        "about.madeWith": "💖 by concertypin님이 만들었습니다",
        "about.github": "GitHub",
        "about.reportIssue": "문제 제보",

        // Common
        "common.loading": "로딩 중...",
        "common.error": "오류",
        "common.close": "닫기",
    },
    en: {
        // General settings
        "settings.general.title": "General Settings",
        "settings.general.theme": "Theme",
        "settings.general.theme.system": "System",
        "settings.general.theme.light": "Light",
        "settings.general.theme.dark": "Dark",
        "settings.general.language": "Language",
        "settings.general.language.ko": "한국어",
        "settings.general.language.en": "English",
        "settings.general.typography": "Typography",
        "settings.general.fontFamily": "Font Family",
        "settings.general.fontSize": "Font Size",
        "settings.general.fontSize.small": "Small",
        "settings.general.fontSize.medium": "Medium",
        "settings.general.fontSize.large": "Large",

        // Settings modal
        "settings.title": "Settings",
        "settings.tab.general": "General",
        "settings.tab.models": "Models",
        "settings.tab.prompts": "Prompts",
        "settings.tab.advanced": "Advanced",
        "settings.tab.about": "About",
        "settings.cancel": "Cancel",
        "settings.save": "Save & Close",

        // About page
        "about.madeWith": "Made with 💖 by concertypin",
        "about.github": "GitHub",
        "about.reportIssue": "Report Issue",

        // Common
        "common.loading": "Loading...",
        "common.error": "Error",
        "common.close": "Close",
    },
};

/**
 * Reactive locale state.
 * Reads from localStorage on init, defaults to browser language or 'en'.
 */
class LocaleStore {
    current: Locale = $state<Locale>("en");

    constructor() {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("arisutalk:locale");
            if (stored === "ko" || stored === "en") {
                this.current = stored;
            } else {
                // Detect browser language
                const browserLang = navigator.language?.startsWith("ko") ? "ko" : "en";
                this.current = browserLang;
            }
        }
    }

    /** Persist locale preference. */
    set(locale: Locale): void {
        this.current = locale;
        if (typeof window !== "undefined") {
            localStorage.setItem("arisutalk:locale", locale);
        }
        Logger.info("Locale changed", { locale });
    }
}

export const localeStore = new LocaleStore();

/**
 * Translate a key to the current locale's string.
 * Falls back to the key itself when the translation is missing.
 *
 * @param key - Dot-notation translation key.
 * @returns The localized string.
 */
export function t(key: string): string {
    const map = translations[localeStore.current];
    return map[key] ?? key;
}
