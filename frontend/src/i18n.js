import { en } from "./language/en.js";
import { ko } from "./language/ko.js";

export const languages = {
  en,
  ko,
};

let currentLanguage = localStorage.getItem("language") || "ko";

export function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem("language", lang);
  document.documentElement.lang = lang;
  // Dispatch a custom event to notify the app of language change
  window.dispatchEvent(new Event("languageChanged"));
}

export function getLanguage() {
  return currentLanguage;
}

export function t(key, params = {}) {
  const keys = key.split(".");
  let lang = languages[currentLanguage];
  for (const k of keys) {
    if (lang && typeof lang === "object" && k in lang) {
      lang = lang[k];
    } else {
      return key;
    }
  }
  if (typeof lang === "string" && params && Object.keys(params).length > 0) {
    return lang.replace(/\{\{(\w+)\}\}/g, (match, p1) => {
      return params[p1] !== undefined ? params[p1] : match;
    });
  }
  return lang;
}
