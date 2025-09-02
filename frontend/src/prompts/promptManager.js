/**
 * This module is responsible for managing the ChatML prompts for the application.
 * It handles loading prompts from local storage and falling back to the default prompts.
 */

import { defaultChatMLPrompts } from './chatMLPrompts.js';
import { loadFromBrowserStorage, saveToBrowserStorage } from '../storage.js';

const PROMPT_STORAGE_KEY = 'chatMLPrompts';

/**
 * Represents the available prompt types.
 * @typedef {('mainChat' | 'characterSheet' | 'profileCreation')} PromptType
 */

/**
 * Retrieves all ChatML prompts, merging defaults with any custom prompts from storage.
 * @returns {Promise<Object.<PromptType, string>>}
 */
export async function getAllPrompts() {
  const customPrompts = (await loadFromBrowserStorage(PROMPT_STORAGE_KEY)) || {};
  return {
    ...defaultChatMLPrompts,
    ...customPrompts,
  };
}

/**
 * Retrieves a specific ChatML prompt by its type.
 * @param {PromptType} type - The type of prompt to retrieve.
 * @returns {Promise<string>}
 */
export async function getPrompt(type) {
  const allPrompts = await getAllPrompts();
  return allPrompts[type];
}

/**
 * Saves a specific ChatML prompt to local storage.
 * @param {PromptType} type - The type of prompt to save.
 * @param {string} content - The content of the prompt.
 * @returns {Promise<void>}
 */
export async function savePrompt(type, content) {
  const customPrompts = (await loadFromBrowserStorage(PROMPT_STORAGE_KEY)) || {};
  customPrompts[type] = content;
  await saveToBrowserStorage(PROMPT_STORAGE_KEY, customPrompts);
}

/**
 * Saves multiple ChatML prompts to local storage.
 * @param {Object.<PromptType, string>} prompts - An object containing the prompts to save.
 * @returns {Promise<void>}
 */
export async function saveAllPrompts(prompts) {
  const customPrompts = (await loadFromBrowserStorage(PROMPT_STORAGE_KEY)) || {};
  Object.assign(customPrompts, prompts);
  await saveToBrowserStorage(PROMPT_STORAGE_KEY, customPrompts);
}

/**
 * Resets a specific prompt to its default value.
 * @param {PromptType} type - The type of prompt to reset.
 * @returns {Promise<void>}
 */
export async function resetPrompt(type) {
  const customPrompts = (await loadFromBrowserStorage(PROMPT_STORAGE_KEY)) || {};
  delete customPrompts[type];
  await saveToBrowserStorage(PROMPT_STORAGE_KEY, customPrompts);
}

/**
 * Resets all prompts to their default values.
 * @returns {Promise<void>}
 */
export async function resetAllPrompts() {
  await saveToBrowserStorage(PROMPT_STORAGE_KEY, {});
}
