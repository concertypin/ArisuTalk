import { en } from "$root/language/en";
import { ko } from "$root/language/ko";
import type { LanguageStrings } from "$root/language/language";

type LanguageCode = "en" | "ko";
export const languages: Record<LanguageCode, LanguageStrings> = {
    en,
    ko,
} as const;

const storedLanguage = localStorage.getItem("language") ?? "ko";
let currentLanguage: LanguageCode =
    storedLanguage in languages ? (storedLanguage as LanguageCode) : "ko";

/**
 * @fires languageChanged
 */
export function setLanguage(lang: LanguageCode) {
    currentLanguage = lang;
    localStorage.setItem("language", lang);
    document.documentElement.lang = lang;
    // Dispatch a custom event to notify the app of language change
    window.dispatchEvent(new Event("languageChanged"));
}

export function getLanguage(): LanguageCode {
    return currentLanguage;
}

/**
 *
 * @returns {string}
 */
export function t(key: string, params: Record<string, string> = {}): string {
    const keys = key.split(".");
    type LanguageRecursive = string | { [key: string]: LanguageRecursive };
    let lang: LanguageRecursive = languages[currentLanguage];
    for (const k of keys) {
        if (lang && typeof lang === "object" && k in lang) {
            lang = lang[k];
        } else {
            console.error(`Missing translation for key: ${key}`);
            return key;
        }
    }
    //Now lang is a string or object..
    if (typeof lang !== "string") {
        console.error(`Translation for key: ${key} is not a string.`);
        return key;
    }
    if (params && Object.keys(params).length > 0) {
        return lang.replace(/\{\{(\w+)\}\}/g, (match, p1) => {
            return params[p1] !== undefined ? params[p1] : match;
        });
    }
    return lang;
}
