/**
 * This file contains the default ChatML prompts for the application.
 * These prompts are used as fallbacks when no custom prompts are available in local storage.
 */

import mainPrompt from "../texts/mainChatMLPrompt.txt?raw";
import profilePrompt from "../texts/profileCreationChatMLPrompt.txt?raw";
import characterSheetPrompt from "../texts/characterSheetChatMLPrompt.txt?raw";
export const defaultChatMLPrompts = {
  mainChat: mainPrompt,
  characterSheet: characterSheetPrompt,
  profileCreation: profilePrompt,
};
