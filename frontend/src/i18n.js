import { en } from './language/en.js';
import { ko } from './language/ko.js';

export const languages = {
    en,
    ko
};

let currentLanguage = localStorage.getItem('language') || 'ko';

export function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    location.reload();
}

export function getLanguage() {
    return currentLanguage;
}

export function t(key) {
    const keys = key.split('.');
    let lang = languages[currentLanguage];
    for (const k of keys) {
        if (lang && typeof lang === 'object' && k in lang) {
            lang = lang[k];
        } else {
            return key;
        }
    }
    return lang;
}