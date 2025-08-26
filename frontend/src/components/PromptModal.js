import { t } from "../i18n.js";
import { getDefaultChatMLTemplate, isValidChatML } from "../api/chatMLParser.js";

export function renderPromptModal(app) {
  const { prompts } = app.state.settings;
  const mainPromptSections = {
    [t("promptModal.systemRules")]: {
      key: "system_rules",
      content: prompts.main.system_rules,
    },
    [t("promptModal.roleAndObjective")]: {
      key: "role_and_objective",
      content: prompts.main.role_and_objective,
    },
    [t("promptModal.memoryGeneration")]: {
      key: "memory_generation",
      content: prompts.main.memory_generation,
    },
    [t("promptModal.characterActing")]: {
      key: "character_acting",
      content: prompts.main.character_acting,
    },
    [t("promptModal.messageWriting")]: {
      key: "message_writing",
      content: prompts.main.message_writing,
    },
    [t("promptModal.language")]: {
      key: "language",
      content: prompts.main.language,
    },
    [t("promptModal.additionalInstructions")]: {
      key: "additional_instructions",
      content: prompts.main.additional_instructions,
    },
    [t("promptModal.stickerUsage")]: {
      key: "sticker_usage",
      content: prompts.main.sticker_usage,
    },
    [t("promptModal.groupChatContext")]: {
      key: "group_chat_context",
      content: prompts.main.group_chat_context,
    },
    [t("promptModal.openChatContext")]: {
      key: "open_chat_context",
      content: prompts.main.open_chat_context,
    },
  };

  return `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div class="bg-gray-800 rounded-2xl w-full max-w-2xl mx-4 flex flex-col" style="max-height: 90vh;">
                <div class="flex items-center justify-between p-6 border-b border-gray-700 shrink-0">
                    <h3 class="text-lg font-semibold text-white">${t(
                      "promptModal.title",
                    )}</h3>
                    <button id="close-prompt-modal" class="p-1 hover:bg-gray-700 rounded-full"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <div class="p-6 space-y-4 overflow-y-auto">
                    <!-- ChatML Section -->
                    <div class="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg p-4 border border-purple-500/20">
                        <div class="flex items-center justify-between mb-3">
                            <div>
                                <h4 class="text-base font-semibold text-purple-300">${t("promptModal.useChatML")}</h4>
                                <p class="text-xs text-gray-400 mt-1">${t("promptModal.chatMLDescription")}</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="use-chatml-toggle" class="sr-only peer" ${prompts.useChatML ? 'checked' : ''}>
                                <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                        </div>
                        
                        <div id="chatml-section" class="${prompts.useChatML ? '' : 'hidden'}">
                            <div class="mb-3">
                                <div class="flex items-center gap-2 mb-2">
                                    <label class="text-sm font-medium text-purple-200">${t("promptModal.chatMLPrompt")}</label>
                                    <button id="reset-chatml-btn" class="py-1 px-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs flex items-center gap-1">
                                        <i data-lucide="rotate-ccw" class="w-3 h-3"></i> ${t("promptModal.resetToDefault")}
                                    </button>
                                    <button id="generate-chatml-template-btn" class="py-1 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs flex items-center gap-1">
                                        <i data-lucide="wand-2" class="w-3 h-3"></i> Template
                                    </button>
                                </div>
                                <p class="text-xs text-gray-400 mb-2">${t("promptModal.chatMLSyntaxHelp")}</p>
                                <textarea id="chatml-prompt-input" 
                                          class="w-full h-64 p-3 bg-gray-700 text-white rounded-lg text-sm font-mono border-2 border-purple-500/20 focus:border-purple-500/50 transition-colors"
                                          placeholder="${t("promptModal.chatMLSyntaxHelp")}">${prompts.chatMLPrompt || ''}</textarea>
                                <div id="chatml-validation" class="text-xs mt-1"></div>
                            </div>
                            <div class="text-xs text-yellow-400 bg-yellow-400/10 rounded p-2">
                                <i data-lucide="info" class="w-3 h-3 inline mr-1"></i>
                                ${t("promptModal.chatMLToggleHelp")}
                            </div>
                        </div>
                    </div>

                    <h4 class="text-base font-semibold text-blue-300 border-b border-blue-300/20 pb-2">${t(
                      "promptModal.mainChatPrompt",
                    )} <span class="text-sm font-normal text-gray-400" id="complex-prompt-status">${prompts.useChatML ? '(Disabled - ChatML Active)' : '(Active)'}</span></h4>
                    <div id="complex-prompts-section" class="${prompts.useChatML ? 'opacity-50 pointer-events-none' : ''}">
                    ${Object.entries(mainPromptSections)
                      .map(
                        ([title, data]) => `
                        <details class="group bg-gray-900/50 rounded-lg">
                            <summary class="flex items-center justify-between cursor-pointer list-none p-4">
                                <span class="text-base font-medium text-gray-200">${title}</span>
                                <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                            </summary>
                            <div class="content-wrapper">
                                <div class="content-inner p-4 border-t border-gray-700">
                                    <div class="flex items-center gap-2 mb-3">
                                        <button onclick="window.personaApp.resetPromptToDefault('main', '${
                                          data.key
                                        }', '${title}')" class="py-1 px-3 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs flex items-center gap-1">
                                            <i data-lucide="rotate-ccw" class="w-3 h-3"></i> ${t(
                                              "promptModal.resetToDefault",
                                            )}
                                        </button>
                                    </div>
                                    <textarea id="prompt-main-${
                                      data.key
                                    }" class="w-full h-64 p-3 bg-gray-700 text-white rounded-lg text-sm font-mono">${
                                      data.content
                                    }</textarea>
                                </div>
                            </div>
                        </details>
                    `,
                      )
                      .join("")}
                    </div>
                    
                    <h4 class="text-base font-semibold text-blue-300 border-b border-blue-300/20 pb-2 mt-6">${t(
                      "promptModal.randomFirstMessagePrompt",
                    )}</h4>
                    <details class="group bg-gray-900/50 rounded-lg">
                        <summary class="flex items-center justify-between cursor-pointer list-none p-4">
                            <span class="text-base font-medium text-gray-200">${t(
                              "promptModal.profileCreationRules",
                            )}</span>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                        </summary>
                        <div class="content-wrapper">
                            <div class="content-inner p-4 border-t border-gray-700">
                                <div class="flex items-center gap-2 mb-3">
                                    <button onclick="window.personaApp.resetPromptToDefault('profile_creation', '', '# 캐릭터 생성 규칙 (Profile Creation Rules)')" class="py-1 px-3 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs flex items-center gap-1">
                                        <i data-lucide="rotate-ccw" class="w-3 h-3"></i> ${t(
                                          "promptModal.resetToDefault",
                                        )}
                                    </button>
                                </div>
                                <textarea id="prompt-profile_creation" class="w-full h-64 p-3 bg-gray-700 text-white rounded-lg text-sm font-mono">${
                                  prompts.profile_creation
                                }</textarea>
                            </div>
                        </div>
                    </details>
                    
                    <h4 class="text-base font-semibold text-green-300 border-b border-green-300/20 pb-2 mt-6">${t(
                      "promptModal.characterSheetGenerationPrompt",
                    )}</h4>
                    <details class="group bg-gray-900/50 rounded-lg">
                        <summary class="flex items-center justify-between cursor-pointer list-none p-4">
                            <span class="text-base font-medium text-gray-200">${t(
                              "promptModal.characterSheetGenerationRules",
                            )}</span>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                        </summary>
                        <div class="content-wrapper">
                            <div class="content-inner p-4 border-t border-gray-700">
                                <div class="flex items-center gap-2 mb-3">
                                    <button onclick="window.personaApp.resetPromptToDefault('character_sheet_generation', '', '# 캐릭터 시트 생성 규칙 (Character Sheet Generation Rules)')" class="py-1 px-3 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs flex items-center gap-1">
                                        <i data-lucide="rotate-ccw" class="w-3 h-3"></i> ${t(
                                          "promptModal.resetToDefault",
                                        )}
                                    </button>
                                </div>
                                <textarea id="prompt-character_sheet_generation" class="w-full h-64 p-3 bg-gray-700 text-white rounded-lg text-sm font-mono">${
                                  prompts.character_sheet_generation
                                }</textarea>
                            </div>
                        </div>
                    </details>

                </div>
                <div class="p-6 mt-auto border-t border-gray-700 shrink-0 flex flex-wrap justify-end gap-3">
                    <button id="backup-prompts-btn" class="py-2 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-sm flex items-center gap-2">
                        <i data-lucide="download" class="w-4 h-4"></i> ${t(
                          "promptModal.backupPrompts",
                        )}
                    </button>
                    <button id="restore-prompts-btn" class="py-2 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-sm flex items-center gap-2">
                        <i data-lucide="upload" class="w-4 h-4"></i> ${t(
                          "promptModal.restorePrompts",
                        )}
                    </button>
                    <div class="flex-grow"></div>
                    <button id="close-prompt-modal" class="py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">${t(
                      "common.cancel",
                    )}</button>
                    <button id="save-prompts" class="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">${t(
                      "common.save",
                    )}</button>
                </div>
            </div>
        </div>
    `;
}
