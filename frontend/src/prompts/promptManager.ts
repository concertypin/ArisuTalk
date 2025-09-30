/**
 * This module is responsible for managing the ChatML prompts for the application.
 * It handles loading prompts from local storage and falling back to the default prompts.
 */

import { defaultChatMLPrompts } from "./chatMLPrompts";
import { loadFromBrowserStorage, saveToBrowserStorage } from "../storage";

const PROMPT_STORAGE_KEY = "chatMLPrompts";

/**
 * Represents the available prompt types.
 */

type PromptType =
  | "mainChat"
  | "characterSheet"
  | "profileCreation"
  | "snsForce"
  | "naiSticker"
  | "groupChat"
  | "openChat";
/**
 * Retrieves all ChatML prompts, merging defaults with any custom prompts from storage.
 * @returns {Promise<{[key: PromptType]: string}>}
 */
export async function getAllPrompts(): Promise<Record<PromptType, string>> {
  const customPrompts =
    (await loadFromBrowserStorage(PROMPT_STORAGE_KEY)) || {};
  return {
    ...defaultChatMLPrompts,
    ...customPrompts,
  };
}

/**
 * Retrieves a specific ChatML prompt by its type.
 * @param type - The type of prompt to retrieve.
 */
export async function getPrompt(type: PromptType): Promise<string> {
  const allPrompts = await getAllPrompts();
  return allPrompts[type];
}

/**
 * Saves a specific ChatML prompt to local storage.
 * @param type - The type of prompt to save.
 * @param content - The content of the prompt.
 */
export async function savePrompt(
  type: PromptType,
  content: string,
): Promise<void> {
  const customPrompts =
    (await loadFromBrowserStorage(PROMPT_STORAGE_KEY)) || {};
  customPrompts[type] = content;
  await saveToBrowserStorage(PROMPT_STORAGE_KEY, customPrompts);
}

/**
 * Saves multiple ChatML prompts to local storage.
 * @param prompts - An object containing the prompts to save.
 */
export async function saveAllPrompts(
  prompts: Record<PromptType, string>,
): Promise<void> {
  const customPrompts =
    (await loadFromBrowserStorage(PROMPT_STORAGE_KEY)) || {};
  Object.assign(customPrompts, prompts);
  saveToBrowserStorage(PROMPT_STORAGE_KEY, customPrompts);
}

/**
 * Resets a specific prompt to its default value.
 * @param type - The type of prompt to reset.
 */
export async function resetPrompt(type: PromptType): Promise<void> {
  const customPrompts =
    (await loadFromBrowserStorage(PROMPT_STORAGE_KEY)) || {};
  delete customPrompts[type];
  await saveToBrowserStorage(PROMPT_STORAGE_KEY, customPrompts);
}

/**
 * Resets all prompts to their default values.
 */
export async function resetAllPrompts(): Promise<void> {
  await saveToBrowserStorage(PROMPT_STORAGE_KEY, {});
}
