import { en } from './language/en.js';
import { ko } from './language/ko.js';
/**
 * @property {import('./language/en').Language} en
 * @property {import('./language/ko').Language} ko
 */
export const languages = {
    en,
    ko
};
/**
 * @typedef {keyof languages} SupportedLanguage
 * @type {SupportedLanguage}
 */
// @ts-ignore todo: Cast it to `keyof languages` when migrating to TypeScript
let currentLanguage = localStorage.getItem('language') || 'ko';

/**
 * Sets the application's language and updates relevant state.
 *
 * - Updates the global `currentLanguage` variable.
 * - Persists the selected language in localStorage.
 * - Sets the HTML document's `lang` attribute.
 * - Dispatches a custom 'languageChanged' event on the window.
 * 
 * @fires window#languageChanged
 * @param {SupportedLanguage} lang - The language code to set (e.g., 'en', 'fr').
 */
export function setLanguage(lang) {
    // @ts-ignore
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    // Dispatch a custom event to notify the app of language change
    window.dispatchEvent(new Event('languageChanged'));
}

/**
 * Returns the current language setting.
 * 
 * @returns {SupportedLanguage} The currently selected language code.
 */
export function getLanguage() {
    return currentLanguage;
}

/**
 * @param {string} key
 * @deprecated Use `lang` instead. It provides autocompletion. Whao!
 * @see {@link lang}
 */
export function t(key, params = {}) {
    const keys = key.split('.');
    let currentLangObj = languages[currentLanguage];
    for (const k of keys) {
        if (currentLangObj && typeof currentLangObj === 'object' && k in currentLangObj) {
            // @ts-ignore
            currentLangObj = currentLangObj[k];
        } else {
            return key;
        }
    }
    if (typeof currentLangObj === 'string' && params && Object.keys(params).length > 0) {
        // @ts-ignore
        return currentLangObj.replace(/\{\{(\w+)\}\}/g, (match, p1) => {
            // @ts-ignore
            return params[p1] !== undefined ? params[p1] : match;
        });
    }
    return currentLangObj;
}

/**
 * A proxy object for the current language, providing access to language strings and functions.
 * @readonly
 * @type {import("./language/language").Language}
 */
export const lang = new Proxy(languages[currentLanguage],
    {
        get(_, prop) {
            const target = languages[currentLanguage];
            if (prop in target) {
                // @ts-ignore
                if (typeof target[prop] === "function") {
                    // @ts-ignore
                    return (...args) => {
                        // @ts-ignore
                        return target[prop](...args);
                    };
                }
                // @ts-ignore
                if (typeof target[prop] === "object") {
                    // @ts-ignore
                    return new Proxy(target[prop], this);
                }
                // @ts-ignore
                return target[prop];
            }
            return undefined;
        },
        set(_) {
            throw new Error(`Cannot set property on language object. It is read-only.`);
        }
    }
)