/**
 * This file contains the default ChatML prompts for the application.
 * These prompts are used as fallbacks when no custom prompts are available in local storage.
 */

import mainPrompt from "../texts/mainChatMLPrompt.txt?raw";
import profilePrompt from "../texts/profileCreationChatMLPrompt.txt?raw";
import characterSheetPrompt from "../texts/characterSheetChatMLPrompt.txt?raw";
import snsForcePrompt from "../texts/snsForcePrompt.txt?raw";
import naiStickerPrompt from "../texts/naiStickerPrompt.txt?raw";
import groupChatPrompt from "../texts/groupChatMLPrompt.txt?raw";
import openChatPrompt from "../texts/openChatMLPrompt.txt?raw";

export const defaultChatMLPrompts = {
  mainChat: mainPrompt,
  characterSheet: characterSheetPrompt,
  profileCreation: profilePrompt,
  snsForce: snsForcePrompt,
  naiSticker: naiStickerPrompt,
  groupChat: groupChatPrompt,
  openChat: openChatPrompt
};
