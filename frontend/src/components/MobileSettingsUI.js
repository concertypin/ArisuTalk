import { t, getLanguage } from "../i18n.js";
import { debounce } from "../utils.js";
import {
  PROVIDERS,
  PROVIDER_MODELS,
  DEFAULT_PROVIDER,
} from "../constants/providers.js";
import { DEFAULT_EMOTIONS, NovelAIClient } from "../api/novelai.js";

/**
 * Renders the main mobile settings UI page (the list of settings).
 * @param {Object} app - Application instance
 * @returns {string} Mobile settings UI HTML
 */
export function renderMobileSettingsUI(app) {
  const { settings } = app.state;
  return `
    <div class="flex flex-col h-full relative">
      <header class="absolute top-0 left-0 right-0 px-6 py-4 bg-gray-900/80 flex items-center justify-between z-10" style="backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);">
          <div class="flex items-center space-x-2">
              <button id="close-settings-ui" class="p-3 -ml-2 rounded-full hover:bg-gray-700">
                  <i data-lucide="arrow-left" class="h-6 w-6 text-gray-300"></i>
              </button>
              <h2 class="font-semibold text-white text-3xl">${t(
                "settings.title",
              )}</h2>
          </div>
      </header>
      <div class="flex-1 overflow-y-auto space-y-4 mt-[88px] px-6 mx-4 bg-gray-900 rounded-t-2xl" id="settings-ui-content">
          <div id="navigate-to-ai-settings" class="group border-b border-gray-700 pb-3 cursor-pointer">
            <div class="flex items-center justify-between list-none py-3">
                <span class="text-lg font-medium text-gray-200">${t(
                  "settings.aiSettings",
                )}</span>
                <i data-lucide="chevron-right" class="w-6 h-6 text-gray-400"></i>
            </div>
          </div>
          <div id="navigate-to-scale-settings" class="group border-b border-gray-700 pb-3 cursor-pointer">
            <div class="flex items-center justify-between list-none py-3">
                <span class="text-lg font-medium text-gray-200">${t(
                  "settings.scaleSettings",
                )}</span>
                <i data-lucide="chevron-right" class="w-6 h-6 text-gray-400"></i>
            </div>
          </div>
          <div id="navigate-to-nai-settings" class="group border-b border-gray-700 pb-3 cursor-pointer">
            <div class="flex items-center justify-between list-none py-3">
                <span class="text-lg font-medium text-gray-200 flex items-center">
                    <i data-lucide="image" class="w-5 h-5 mr-3 text-purple-400"></i>
                    ${t("settings.naiSettings")}
                </span>
                <i data-lucide="chevron-right" class="w-6 h-6 text-gray-400"></i>
            </div>
          </div>
          <details data-section="persona" class="group border-b border-gray-700 pb-3" ${app.state.openSettingsSections.includes("persona") ? "open" : ""}>
              <summary class="flex items-center justify-between cursor-pointer list-none py-3">
                  <span class="text-lg font-medium text-gray-200">${t(
                    "settings.yourPersona",
                  )}</span>
                  <i data-lucide="chevron-down" class="w-6 h-6 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
              </summary>
              <div class="content-wrapper">
                  <div class="content-inner pt-4 space-y-4">
                      <div>
                          <label class="flex items-center text-base font-medium text-gray-300 mb-2"><i data-lucide="user" class="w-5 h-5 mr-3"></i>${t(
                            "settings.yourName",
                          )}</label>
                          <input id="settings-user-name" type="text" placeholder="${t(
                            "settings.yourNamePlaceholder",
                          )}" value="${settings.userName}" class="w-full px-3 py-2 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-base" />
                      </div>
                      <div>
                          <label class="flex items-center text-base font-medium text-gray-300 mb-2"><i data-lucide="brain-circuit" class="w-5 h-5 mr-3"></i>${t(
                            "settings.yourDescription",
                          )}</label>
                          <textarea id="settings-user-desc" placeholder="${t(
                            "settings.yourDescriptionPlaceholder",
                          )}" class="w-full px-3 py-2 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-base" rows="3">${settings.userDescription}</textarea>
                      </div>
                  </div>
              </div>
          </details>
          <details data-section="proactive" class="group border-b border-gray-700 pb-3" ${app.state.openSettingsSections.includes("proactive") ? "open" : ""}>
              <summary class="flex items-center justify-between cursor-pointer list-none py-3">
                  <span class="text-lg font-medium text-gray-200">${t(
                    "settings.proactiveSettings",
                  )}</span>
                  <i data-lucide="chevron-down" class="w-6 h-6 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
              </summary>
              <div class="content-wrapper">
                  <div class="content-inner pt-4 space-y-4">
                      <div class="py-3">
                          <label class="flex items-center justify-between text-base font-medium text-gray-300 cursor-pointer">
                              <span class="flex items-center"><i data-lucide="message-square-plus" class="w-5 h-5 mr-3"></i>${t(
                                "settings.proactiveChat",
                              )}</span>
                              <div class="relative inline-block w-10 align-middle select-none">
                                  <input type="checkbox" name="toggle" id="settings-proactive-toggle" ${settings.proactiveChatEnabled ? "checked" : ""} class="absolute opacity-0 w-0 h-0 peer" />
                                  <label for="settings-proactive-toggle" class="block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer peer-checked:bg-blue-600"></label>
                                  <span class="absolute left-0.5 top-0.5 block w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                              </div>
                          </label>
                      </div>
                      <div class="py-3 border-t border-gray-700 mt-2 pt-3">
                          <label class="flex items-center justify-between text-base font-medium text-gray-300 cursor-pointer">
                              <span class="flex items-center"><i data-lucide="shuffle" class="w-5 h-5 mr-3"></i>${t(
                                "settings.randomFirstMessage",
                              )}</span>
                              <div class="relative inline-block w-10 align-middle select-none">
                                  <input type="checkbox" name="toggle" id="settings-random-first-message-toggle" ${settings.randomFirstMessageEnabled ? "checked" : ""} class="absolute opacity-0 w-0 h-0 peer" />
                                  <label for="settings-random-first-message-toggle" class="block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer peer-checked:bg-blue-600"></label>
                                  <span class="absolute left-0.5 top-0.5 block w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                              </div>
                          </label>
                          <div id="random-chat-options" class="mt-4 space-y-4" style="display: ${settings.randomFirstMessageEnabled ? "block" : "none"}">
                              <div>
                                  <label class="flex items-center justify-between text-base font-medium text-gray-300 mb-2">
                                      <span>${t(
                                        "settings.characterCount",
                                      )}</span>
                                      <span id="random-character-count-label" class="text-blue-400 font-semibold">${settings.randomCharacterCount}${t(
                                        "settings.characterCountUnit",
                                      )}</span>
                                  </label>
                                  <input id="settings-random-character-count" type="range" min="1" max="5" step="1" value="${settings.randomCharacterCount}" class="w-full">
                              </div>
                              <div>
                                  <label class="text-base font-medium text-gray-300 mb-2 block">${t(
                                    "settings.messageFrequency",
                                  )}</label>
                                  <div class="flex items-center gap-3">
                                      <input id="settings-random-frequency-min" type="number" min="1" class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-base" placeholder="${t(
                                        "settings.min",
                                      )}" value="${settings.randomMessageFrequencyMin}">
                                      <span class="text-gray-400">-</span>
                                      <input id="settings-random-frequency-max" type="number" min="1" class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-base" placeholder="${t(
                                        "settings.max",
                                      )}" value="${settings.randomMessageFrequencyMax}">
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </details>
          <details data-section="snapshots" class="group border-b border-gray-700 pb-3" ${app.state.openSettingsSections.includes("snapshots") ? "open" : ""}>
              <summary class="flex items-center justify-between cursor-pointer list-none py-3">
                  <span class="text-lg font-medium text-gray-200">${t(
                    "settings.snapshots",
                  )}</span>
                  <i data-lucide="chevron-down" class="w-6 h-6 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
              </summary>
              <div class="content-wrapper">
                  <div class="content-inner pt-4 space-y-4">
                      <div class="py-3">
                          <label class="flex items-center justify-between text-base font-medium text-gray-300 cursor-pointer">
                              <span class="flex items-center"><i data-lucide="camera" class="w-5 h-5 mr-3"></i>${t(
                                "settings.enableSnapshots",
                              )}</span>
                              <div class="relative inline-block w-10 align-middle select-none">
                                  <input type="checkbox" name="toggle" id="settings-snapshots-toggle" ${settings.snapshotsEnabled ? "checked" : ""} class="absolute opacity-0 w-0 h-0 peer" />
                                  <label for="settings-snapshots-toggle" class="block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer peer-checked:bg-blue-600"></label>
                                  <span class="absolute left-0.5 top-0.5 block w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                              </div>
                          </label>
                      </div>
                      <div id="snapshots-list" class="space-y-3" style="display: ${settings.snapshotsEnabled ? "block" : "none"}">
                          ${renderSnapshotList(app)}
                      </div>
                  </div>
              </div>
          </details>
          <details data-section="language" class="group border-b border-gray-700 pb-3" ${app.state.openSettingsSections.includes("language") ? "open" : ""}>
              <summary class="flex items-center justify-between cursor-pointer list-none py-3">
                  <span class="text-lg font-medium text-gray-200">${t(
                    "settings.language",
                  )}</span>
                  <i data-lucide="chevron-down" class="w-6 h-6 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
              </summary>
              <div class="content-wrapper">
                  <div class="content-inner pt-4 space-y-4">
                      <div class="space-y-3">
                          <button
                              id="language-korean"
                              class="language-select-btn w-full p-3 rounded-lg border transition-all duration-200 flex items-center gap-3 ${getLanguage() === "ko" ? "bg-blue-600/20 border-blue-500 text-blue-400" : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"}"
                              data-language="ko"
                          >
                              <div class="text-xl">🇰🇷</div>
                              <div class="text-left flex-1">
                                  <div class="font-medium text-base">${t(
                                    "settings.languageKorean",
                                  )}</div>
                                  <div class="text-sm opacity-75">한국어</div>
                              </div>
                              ${getLanguage() === "ko" ? '<i data-lucide="check" class="w-5 h-5 text-blue-400"></i>' : ""}
                          </button>
                          <button
                              id="language-english"
                              class="language-select-btn w-full p-3 rounded-lg border transition-all duration-200 flex items-center gap-3 ${getLanguage() === "en" ? "bg-blue-600/20 border-blue-500 text-blue-400" : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"}"
                              data-language="en"
                          >
                              <div class="text-xl">🇺🇸</div>
                              <div class="text-left flex-1">
                                  <div class="font-medium text-base">${t(
                                    "settings.languageEnglish",
                                  )}</div>
                                  <div class="text-sm opacity-75">English</div>
                              </div>
                              ${getLanguage() === "en" ? '<i data-lucide="check" class="w-5 h-5 text-blue-400"></i>' : ""}
                          </button>
                      </div>
                      <div class="bg-gray-600/50 rounded-lg p-3">
                          <p class="text-sm text-gray-300">
                              <i data-lucide="info" class="w-4 h-4 inline mr-2"></i>
                              언어를 변경하면 페이지가 새로고침됩니다.
                          </p>
                      </div>
                  </div>
              </div>
          </details>
          <details data-section="debug" class="group border-b border-gray-700 pb-3" ${app.state.openSettingsSections.includes("debug") ? "open" : ""}>
              <summary class="flex items-center justify-between cursor-pointer list-none py-3">
                  <span class="text-lg font-medium text-gray-200">${t(
                    "settings.debugLogs",
                  )}</span>
                  <i data-lucide="chevron-down" class="w-6 h-6 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
              </summary>
              <div class="content-wrapper">
                  <div class="content-inner pt-4 space-y-4">
                      <div class="py-3">
                          <label class="flex items-center justify-between text-base font-medium text-gray-300 cursor-pointer">
                              <span class="flex items-center"><i data-lucide="activity" class="w-5 h-5 mr-3"></i>${t(
                                "settings.enableDebugLogs",
                              )}</span>
                              <div class="relative inline-block w-10 align-middle select-none">
                                  <input type="checkbox" name="toggle" id="settings-enable-debug-logs" ${app.state.enableDebugLogs ? "checked" : ""} class="absolute opacity-0 w-0 h-0 peer"/>
                                  <label for="settings-enable-debug-logs" class="block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer peer-checked:bg-blue-600"></label>
                                  <span class="absolute left-0.5 top-0.5 block w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                              </div>
                          </label>
                          <p class="text-sm text-gray-500 mt-2">${t(
                            "settings.debugLogsInfo",
                          )}</p>
                      </div>
                      <div class="py-3 border-t border-gray-700 mt-2 pt-3 space-y-3">
                          <div class="flex items-center justify-between text-base text-gray-400">
                              <span>${t("settings.currentLogCount")}</span>
                              <span class="font-mono">${app.state.debugLogs ? app.state.debugLogs.length : 0}/1000</span>
                          </div>
                          <div class="flex gap-3">
                              <button id="view-debug-logs" class="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-base flex items-center justify-center gap-3">
                                  <i data-lucide="bar-chart-3" class="w-5 h-5 pointer-events-none"></i>${t(
                                    "settings.viewLogs",
                                  )}
                              </button>
                              <button id="clear-debug-logs-btn" class="flex-1 py-2 px-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-base flex items-center justify-center gap-3">
                                  <i data-lucide="trash-2" class="w-5 h-5 pointer-events-none"></i>${t(
                                    "settings.clearLogs",
                                  )}
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </details>
          <details data-section="data" class="group" ${app.state.openSettingsSections.includes("data") ? "open" : ""}>
              <summary class="flex items-center justify-between cursor-pointer list-none py-3">
                  <span class="text-lg font-medium text-gray-200">${t(
                    "settings.dataManagement",
                  )}</span>
                  <i data-lucide="chevron-down" class="w-6 h-6 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
              </summary>
              <div class="content-wrapper">
                  <div class="content-inner pt-4 space-y-4">
                      <!-- 백업 및 복원 -->
                      <div class="space-y-3">
                          <button id="backup-data-btn" class="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-base flex items-center justify-center gap-3">
                              <i data-lucide="download" class="w-5 h-5"></i> ${t(
                                "settings.backup",
                              )}
                          </button>
                          <button id="restore-data-btn" class="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-base flex items-center justify-center gap-3">
                              <i data-lucide="upload" class="w-5 h-5"></i> ${t(
                                "settings.restoreData",
                              )}
                          </button>
                      </div>

                      <!-- 구분선 -->
                      <div class="border-t border-gray-600"></div>

                      <!-- 데이터 초기화 -->
                      <div class="space-y-3">
                          <div class="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                              <div class="flex items-start gap-3">
                                  <i data-lucide="alert-triangle" class="w-5 h-5 text-red-400 mt-0.5 shrink-0"></i>
                                  <div class="text-sm text-gray-300">
                                      <p class="font-medium text-red-400 mb-1">${t(
                                        "settings.warningNote",
                                      )}</p>
                                      <p>모든 데이터가 삭제됩니다: ${t(
                                        "settings.resetDataList.allCharacters",
                                      )}, ${t(
                                        "settings.resetDataList.allChatHistory",
                                      )}, ${t(
                                        "settings.resetDataList.userSettings",
                                      )}, ${t(
                                        "settings.resetDataList.stickerData",
                                      )}, ${t(
                                        "settings.resetDataList.debugLogs",
                                      )}</p>
                                  </div>
                              </div>
                          </div>
                          <button id="reset-all-data-btn" class="w-full py-2 px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-base flex items-center justify-center gap-3">
                              <i data-lucide="trash-2" class="w-5 h-5"></i> ${t(
                                "settings.resetAllData",
                              )}
                          </button>
                      </div>
                  </div>
              </div>
          </details>
      </div>
    </div>
  `;
}

/**
 * Renders the AI settings page for mobile view.
 * @param {Object} app - Application instance
 * @returns {string} AI settings page HTML
 */
export function renderAiSettingsPage(app) {
  const { settings } = app.state;
  return `
    <div class="flex flex-col h-full relative">
      <header class="absolute top-0 left-0 right-0 px-6 py-4 bg-gray-900/80 flex items-center justify-between z-10" style="backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);">
          <div class="flex items-center space-x-2">
              <button id="close-ai-settings-ui" class="p-3 -ml-2 rounded-full hover:bg-gray-700">
                  <i data-lucide="arrow-left" class="h-6 w-6 text-gray-300"></i>
              </button>
              <h2 class="font-semibold text-white text-3xl">${t(
                "settings.aiSettings",
              )}</h2>
          </div>
      </header>
      <div class="flex-1 overflow-y-auto space-y-4 mt-[88px] px-6 mx-4 bg-gray-900 rounded-t-2xl" id="ai-settings-ui-content">
        <div>
            <label class="flex items-center text-base font-medium text-gray-300 mb-2"><i data-lucide="globe" class="w-5 h-5 mr-3"></i>${t(
              "settings.aiProvider",
            )}</label>
            <select id="settings-api-provider" class="w-full px-3 py-2 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-base">
                <option value="gemini" ${(settings.apiProvider || "gemini") === "gemini" ? "selected" : ""}>Google Gemini</option>
                <option value="claude" ${(settings.apiProvider || "gemini") === "claude" ? "selected" : ""}>Anthropic Claude</option>
                <option value="openai" ${(settings.apiProvider || "gemini") === "openai" ? "selected" : ""}>OpenAI ChatGPT</option>
                <option value="grok" ${(settings.apiProvider || "gemini") === "grok" ? "selected" : ""}>xAI Grok</option>
                <option value="openrouter" ${(settings.apiProvider || "gemini") === "openrouter" ? "selected" : ""}>OpenRouter</option>
                <option value="custom_openai" ${(settings.apiProvider || "gemini") === "custom_openai" ? "selected" : ""}>Custom OpenAI</option>
            </select>
        </div>
        <div class="provider-settings-container">${renderCurrentProviderSettings(
          app,
        )}</div>
        <div>
            <button id="open-prompt-modal" class="w-full mt-3 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-base flex items-center justify-center gap-3">
                <i data-lucide="file-pen-line" class="w-5 h-5"></i> ${t(
                  "settings.editPrompt",
                )}
            </button>
        </div>
      </div>
    </div>
    `;
}

/**
 * Renders the scale settings page for mobile view.
 * @param {Object} app - Application instance
 * @returns {string} Scale settings page HTML
 */
export function renderScaleSettingsPage(app) {
  const { settings } = app.state;
  return `
    <div class="flex flex-col h-full relative">
      <header class="absolute top-0 left-0 right-0 px-6 py-4 bg-gray-900/80 flex items-center justify-between z-10" style="backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);">
          <div class="flex items-center space-x-2">
              <button id="close-scale-settings-ui" class="p-3 -ml-2 rounded-full hover:bg-gray-700">
                  <i data-lucide="arrow-left" class="h-6 w-6 text-gray-300"></i>
              </button>
              <h2 class="font-semibold text-white text-3xl">${t(
                "settings.scaleSettings",
              )}</h2>
          </div>
      </header>
      <div class="flex-1 overflow-y-auto space-y-4 mt-[88px] px-6 mx-4 bg-gray-900 rounded-t-2xl" id="scale-settings-ui-content">
        <div>
            <label class="flex items-center text-base font-medium text-gray-300 mb-2"><i data-lucide="type" class="w-5 h-5 mr-3"></i>${t(
              "settings.uiSize",
            )}</label>
            <div class="my-4 p-4 rounded-lg bg-gray-800 space-y-4">
                <!-- Character Message -->
                <div class="flex w-full items-start gap-3">
                    <div class="shrink-0 w-8 h-8 rounded-full bg-gray-600"></div>
                    <div class="flex flex-col max-w-[75%] items-start">
                        <div class="flex items-end gap-2">
                            <div class="message-content-wrapper">
                                <div class="px-3 py-2 rounded-xl text-sm leading-relaxed text-gray-100" style="background-color: rgba(55, 65, 81, 0.7);">
                                    <div class="break-words">${t("settings.uiSizePreviewMessage1")}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- User Message -->
                <div class="flex w-full items-start gap-3 flex-row-reverse">
                    <div class="flex flex-col max-w-[75%] items-end">
                        <div class="flex items-end gap-2 flex-row-reverse">
                            <div class="message-content-wrapper">
                                <div class="px-3 py-2 rounded-xl text-sm leading-relaxed text-white" style="background-color: rgba(37, 99, 235, 0.7);">
                                    <div class="break-words">${t("settings.uiSizePreviewMessage2")}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <input id="settings-font-scale" type="range" min="0.8" max="1.4" step="0.1" value="${settings.fontScale}" class="w-full">
            <div class="flex justify-between text-sm text-gray-400 mt-1 relative">
                <span>80%</span>
                <span class="absolute" style="left: 33.33%; transform: translateX(-50%);">100%</span>
                <span>140%</span>
            </div>
        </div>
      </div>
    </div>
    `;
}

/**
 * Sets up event listeners for the mobile settings UI.
 * @param {Object} app - The application instance.
 */
export function setupMobileSettingsUIEventListeners(app) {
  const closeButton = document.getElementById("close-settings-ui");
  if (closeButton && !closeButton.dataset.listenerAdded) {
    closeButton.addEventListener("click", () => {
      app.setState({ showSettingsUI: false });
    });
    closeButton.dataset.listenerAdded = "true";
  }

  // NAI settings navigation
  const navigateToNaiSettings = document.getElementById("navigate-to-nai-settings");
  if (navigateToNaiSettings && !navigateToNaiSettings.dataset.listenerAdded) {
    navigateToNaiSettings.addEventListener("click", () => {
      app.setState({ showNaiSettingsUI: true });
    });
    navigateToNaiSettings.dataset.listenerAdded = "true";
  }

  // Close NAI settings
  const closeNaiSettingsButton = document.getElementById("close-nai-settings-ui");
  if (closeNaiSettingsButton && !closeNaiSettingsButton.dataset.listenerAdded) {
    closeNaiSettingsButton.addEventListener("click", () => {
      app.setState({ showNaiSettingsUI: false });
    });
    closeNaiSettingsButton.dataset.listenerAdded = "true";
  }

  const userNameInput = document.getElementById("settings-user-name");
  if (userNameInput) {
    userNameInput.addEventListener("input", (e) => {
      app.handleSettingChange("userName", e.target.value);
    });
  }

  const userDescTextarea = document.getElementById("settings-user-desc");
  if (userDescTextarea) {
    userDescTextarea.addEventListener("input", (e) => {
      app.handleSettingChange("userDescription", e.target.value);
    });
  }

  const proactiveToggle = document.getElementById("settings-proactive-toggle");
  if (proactiveToggle) {
    proactiveToggle.addEventListener("change", (e) => {
      app.handleSettingChange("proactiveChatEnabled", e.target.checked);
    });
  }

  const randomFirstMessageToggle = document.getElementById(
    "settings-random-first-message-toggle",
  );
  if (randomFirstMessageToggle) {
    randomFirstMessageToggle.addEventListener("change", (e) => {
      app.handleSettingChange("randomFirstMessageEnabled", e.target.checked);
    });
  }

  const randomCharacterCount = document.getElementById(
    "settings-random-character-count",
  );
  if (randomCharacterCount) {
    randomCharacterCount.addEventListener("input", (e) => {
      app.handleSettingChange("randomCharacterCount", parseInt(e.target.value));
    });
  }

  const randomFrequencyMin = document.getElementById(
    "settings-random-frequency-min",
  );
  if (randomFrequencyMin) {
    randomFrequencyMin.addEventListener("input", (e) => {
      app.handleSettingChange(
        "randomMessageFrequencyMin",
        parseInt(e.target.value),
      );
    });
  }

  const randomFrequencyMax = document.getElementById(
    "settings-random-frequency-max",
  );
  if (randomFrequencyMax) {
    randomFrequencyMax.addEventListener("input", (e) => {
      app.handleSettingChange(
        "randomMessageFrequencyMax",
        parseInt(e.target.value),
      );
    });
  }

  const snapshotsToggle = document.getElementById("settings-snapshots-toggle");
  if (snapshotsToggle) {
    snapshotsToggle.addEventListener("change", (e) => {
      app.handleSettingChange("snapshotsEnabled", e.target.checked);
    });
  }

  const enableDebugLogs = document.getElementById("settings-enable-debug-logs");
  if (enableDebugLogs) {
    enableDebugLogs.addEventListener("change", (e) => {
      app.handleSettingChange("enableDebugLogs", e.target.checked);
    });
  }

  const apiProvider = document.getElementById("settings-api-provider");
  if (apiProvider) {
    apiProvider.addEventListener("change", (e) => {
      app.handleSettingChange("apiProvider", e.target.value);
    });
  }

  const fontScale = document.getElementById("settings-font-scale");
  if (fontScale) {
    const debouncedSave = debounce((value) => {
      app.handleSettingChange("fontScale", parseFloat(value));
    }, 500);

    fontScale.addEventListener("input", (e) => {
      const value = parseFloat(e.target.value);
      const fontScaleValueEl = document.querySelector(
        "#scale-settings-ui-content #font-scale-value",
      );
      if (fontScaleValueEl) {
        fontScaleValueEl.textContent = `${Math.round(value * 100)}%`;
      }
      debouncedSave(e.target.value);
    });
  }

  const apiKey = document.getElementById("settings-api-key");
  if (apiKey) {
    apiKey.addEventListener("input", (e) => {
      app.handleProviderConfigChange("apiKey", e.target.value);
    });
  }

  const baseUrl = document.getElementById("settings-base-url");
  if (baseUrl) {
    baseUrl.addEventListener("input", (e) => {
      app.handleProviderConfigChange("baseUrl", e.target.value);
    });
  }

  const modelSelectBtns = document.querySelectorAll(".model-select-btn");
  modelSelectBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      app.handleProviderConfigChange("model", btn.dataset.model);
    });
  });

  const maxTokens = document.getElementById("settings-max-tokens");
  if (maxTokens) {
    maxTokens.addEventListener("input", (e) => {
      app.handleProviderConfigChange("maxTokens", parseInt(e.target.value));
      document.getElementById("max-tokens-value").textContent = e.target.value;
    });
  }

  const temperature = document.getElementById("settings-temperature");
  if (temperature) {
    temperature.addEventListener("input", (e) => {
      app.handleProviderConfigChange("temperature", parseFloat(e.target.value));
      document.getElementById("temperature-value").textContent = parseFloat(
        e.target.value,
      ).toFixed(1);
    });
  }

  const profileMaxTokens = document.getElementById(
    "settings-profile-max-tokens",
  );
  if (profileMaxTokens) {
    profileMaxTokens.addEventListener("input", (e) => {
      app.handleProviderConfigChange(
        "profileMaxTokens",
        parseInt(e.target.value),
      );
      document.getElementById("profile-max-tokens-value").textContent =
        e.target.value;
    });
  }

  const profileTemperature = document.getElementById(
    "settings-profile-temperature",
  );
  if (profileTemperature) {
    profileTemperature.addEventListener("input", (e) => {
      app.handleProviderConfigChange(
        "profileTemperature",
        parseFloat(e.target.value),
      );
      document.getElementById("profile-temperature-value").textContent =
        parseFloat(e.target.value).toFixed(1);
    });
  }

  // NAI Settings event listeners
  setupNaiSettingsEventListeners(app);

  setupSettingsModalEventListeners(app);
}

/**
 * Sets up NAI settings event listeners
 * @param {Object} app - The application instance
 */
function setupNaiSettingsEventListeners(app) {
  // NAI API Key
  const naiApiKey = document.getElementById("nai-api-key");
  if (naiApiKey) {
    naiApiKey.addEventListener("input", (e) => {
      app.handleNaiSettingChange("apiKey", e.target.value);
    });
  }

  // Toggle API Key visibility
  const toggleNaiApiKey = document.getElementById("toggle-nai-api-key");
  if (toggleNaiApiKey) {
    toggleNaiApiKey.addEventListener("click", () => {
      const input = document.getElementById("nai-api-key");
      if (input) {
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        const icon = toggleNaiApiKey.querySelector("i");
        if (icon) {
          icon.setAttribute("data-lucide", isPassword ? "eye-off" : "eye");
        }
      }
    });
  }

  // NAI Model
  const naiModel = document.getElementById("nai-model");
  if (naiModel) {
    naiModel.addEventListener("change", (e) => {
      app.handleNaiSettingChange("model", e.target.value);
    });
  }

  // NAI Preferred Size
  const naiPreferredSize = document.getElementById("nai-preferred-size");
  if (naiPreferredSize) {
    naiPreferredSize.addEventListener("change", (e) => {
      app.handleNaiSettingChange("preferredSize", e.target.value);
    });
  }

  // NAI Min Delay
  const naiMinDelay = document.getElementById("nai-min-delay");
  if (naiMinDelay) {
    naiMinDelay.addEventListener("input", (e) => {
      app.handleNaiSettingChange("minDelay", parseInt(e.target.value) * 1000);
    });
  }

  // NAI Max Additional Delay
  const naiMaxAdditionalDelay = document.getElementById("nai-max-additional-delay");
  if (naiMaxAdditionalDelay) {
    naiMaxAdditionalDelay.addEventListener("input", (e) => {
      app.handleNaiSettingChange("maxAdditionalDelay", parseInt(e.target.value) * 1000);
    });
  }

  // NAI Steps slider
  const naiSteps = document.getElementById("nai-steps");
  const naiStepsValue = document.getElementById("nai-steps-value");
  if (naiSteps && naiStepsValue) {
    naiSteps.addEventListener("input", (e) => {
      const value = parseInt(e.target.value);
      naiStepsValue.textContent = value;
      app.handleNaiSettingChange("steps", value);
    });
  }

  // NAI Scale slider
  const naiScale = document.getElementById("nai-scale");
  const naiScaleValue = document.getElementById("nai-scale-value");
  if (naiScale && naiScaleValue) {
    naiScale.addEventListener("input", (e) => {
      const value = parseFloat(e.target.value);
      naiScaleValue.textContent = value;
      app.handleNaiSettingChange("scale", value);
    });
  }

  // NAI Sampler
  const naiSampler = document.getElementById("nai-sampler");
  if (naiSampler) {
    naiSampler.addEventListener("change", (e) => {
      app.handleNaiSettingChange("sampler", e.target.value);
    });
  }

  // Generate all characters stickers button
  const generateAllButton = document.getElementById("generate-all-characters-stickers");
  if (generateAllButton) {
    generateAllButton.addEventListener("click", () => {
      app.handleGenerateAllCharactersStickers();
    });
  }

  // NAI 일괄 생성 목록 편집 버튼 이벤트 핸들러
  const editNaiListButtonMobile = document.getElementById("edit-nai-generation-list-mobile");
  if (editNaiListButtonMobile && !editNaiListButtonMobile.dataset.listenerAdded) {
    editNaiListButtonMobile.dataset.listenerAdded = "true";
    editNaiListButtonMobile.addEventListener("click", () => {
      // 편집기 표시 함수 호출 (naiHandlers.js에서 import)
      if (window.handleShowNaiGenerationListEditor) {
        window.handleShowNaiGenerationListEditor(app);
      }
    });
  }
}

function renderCurrentProviderSettings(app) {
  const { settings } = app.state;
  const provider = settings.apiProvider || DEFAULT_PROVIDER;
  const config = settings.apiConfigs?.[provider];

  // 레거시 호환성 처리 - 기존 apiKey/model을 gemini config로 마이그레이션
  if (!config && provider === PROVIDERS.GEMINI) {
    const legacyConfig = {
      apiKey: settings.apiKey || "",
      model: settings.model || "gemini-2.5-flash",
      customModels: [],
    };
    return renderProviderConfig(provider, legacyConfig);
  }

  if (!config) {
    return renderProviderConfig(provider, {
      apiKey: "",
      model: "",
      customModels: [],
      baseUrl: provider === PROVIDERS.CUSTOM_OPENAI ? "" : undefined,
    });
  }

  return renderProviderConfig(provider, config);
}

/**
 * Renders the configuration UI for a specific API provider.
 * Includes API key, model selection, and advanced settings.
 * @param {string} provider - API provider identifier (e.g., 'gemini', 'openai', 'claude')
 * @param {Object} config - Provider-specific configuration
 * @returns {string} Provider configuration HTML
 */
export function renderProviderConfig(provider, config) {
  const models = PROVIDER_MODELS[provider] || [];
  const customModels = config.customModels || [];

  return `
        <div class="space-y-4">
            <!-- API 키 입력 -->
            <div>
                <label class="flex items-center text-sm font-medium text-gray-300 mb-2">
                    <i data-lucide="key" class="w-4 h-4 mr-2"></i>${t(
                      "settings.apiKey",
                    )}
                </label>
                <input
                    type="password"
                    id="settings-api-key"
                    value="${config.apiKey || ""}"
                    placeholder="${t("settings.apiKeyPlaceholder")}"
                    class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-sm"
                />
            </div>

            ${
              provider === PROVIDERS.CUSTOM_OPENAI
                ? `
                <!-- Custom OpenAI Base URL -->
                <div>
                    <label class="flex items-center text-sm font-medium text-gray-300 mb-2">
                        <i data-lucide="link" class="w-4 h-4 mr-2"></i>Base URL
                    </label>
                    <input
                        type="text"
                        id="settings-base-url"
                        value="${config.baseUrl || ""}"
                        placeholder="https://api.openai.com/v1"
                        class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-sm"
                    />
                </div>
            `
                : ""
            }

            <!-- 모델 선택 -->
            <div>
                <label class="flex items-center text-sm font-medium text-gray-300 mb-2">
                    <i data-lucide="cpu" class="w-4 h-4 mr-2"></i>${t(
                      "settings.model",
                    )}
                </label>

                ${
                  models.length > 0
                    ? `
                    <div class="grid grid-cols-1 gap-2 mb-3">
                        ${models
                          .map(
                            (model) => `
                            <button
                                type="button"
                                class="model-select-btn px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                                  config.model === model
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                }"
                                data-model="${model}"
                            >
                                ${model}
                            </button>
                        `,
                          )
                          .join("")}
                    </div>
                `
                    : ""
                }

                <!-- 커스텀 모델 입력 -->
                <div class="flex gap-2">
                    <input
                        type="text"
                        id="custom-model-input"
                        placeholder="${t("settings.customModel")}"
                        class="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm"
                    />
                    <button
                        type="button"
                        id="add-custom-model-btn"
                        class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-1"
                    >
                        <i data-lucide="plus" class="w-4 h-4"></i>${t(
                          "settings.addModel",
                        )}
                    </button>
                </div>

                ${
                  customModels.length > 0
                    ? `
                    <div class="mt-3 space-y-1">
                        <label class="text-xs text-gray-400">${t(
                          "settings.customModels",
                        )}</label>
                        ${customModels
                          .map(
                            (model, index) => `
                            <div class="flex items-center gap-2">
                                <button
                                    type="button"
                                    class="model-select-btn flex-1 px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                                      config.model === model
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                    }"
                                    data-model="${model}"
                                >
                                    ${model}
                                </button>
                                <button
                                    type="button"
                                    class="remove-custom-model-btn px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                                    data-index="${index}"
                                >
                                    <i data-lucide="trash-2" class="w-3 h-3"></i>
                                </button>
                            </div>
                        `,
                          )
                          .join("")}
                    </div>
                `
                    : ""
                }
            </div>

            <!-- Advanced Settings for All Providers -->
            <details class="group mt-4">
                <summary class="flex items-center justify-between cursor-pointer list-none p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/40 transition-colors">
                    <h4 class="text-sm font-medium text-gray-300 flex items-center">
                        <i data-lucide="settings" class="w-4 h-4 mr-2"></i>${t(
                          "settings.advancedSettings",
                        )}
                    </h4>
                    <i data-lucide="chevron-down" class="w-4 h-4 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                </summary>
                <div class="space-y-4 mt-2 p-4 bg-gray-700/30 rounded-xl">

                <!-- Max Tokens -->
                <div>
                    <label class="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
                        <span>${t("settings.maxTokens")}</span>
                        <span class="text-blue-400 font-mono text-xs" id="max-tokens-value">${config.maxTokens || (provider === "gemini" ? 4096 : 4096)}</span>
                    </label>
                    <input
                        type="range"
                        id="settings-max-tokens"
                        min="512"
                        max="8192"
                        step="256"
                        value="${config.maxTokens || (provider === "gemini" ? 4096 : 4096)}"
                        class="w-full"
                    />
                    <div class="flex justify-between text-xs text-gray-400 mt-1">
                        <span>512</span>
                        <span>8192</span>
                    </div>
                </div>

                <!-- Temperature -->
                <div>
                    <label class="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
                        <span>${t("settings.temperature")}</span>
                        <span class="text-blue-400 font-mono text-xs" id="temperature-value">${
                          config.temperature !== undefined
                            ? config.temperature
                            : provider === "gemini"
                              ? 1.25
                              : 0.8
                        }
                        </span>
                    </label>
                    <input
                        type="range"
                        id="settings-temperature"
                        min="0"
                        max="2"
                        step="0.1"
                        value="${
                          config.temperature !== undefined
                            ? config.temperature
                            : provider === "gemini"
                              ? 1.25
                              : 0.8
                        }"
                        class="w-full"
                    />
                    <div class="flex justify-between text-xs text-gray-400 mt-1">
                        <span>${t("settings.conservativeTemp")} (0.0)</span>
                        <span>${t("settings.creativeTemp")} (2.0)</span>
                    </div>
                </div>

                <!-- Profile Generation Settings -->
                <div class="border-t border-gray-600 pt-4 mt-4">
                    <h5 class="text-xs font-medium text-gray-400 mb-3">${t(
                      "settings.profileGenerationSettings",
                    )}</h5>

                    <div class="space-y-3">
                        <!-- Profile Max Tokens -->
                        <div>
                            <label class="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
                                <span>${t("settings.profileMaxTokens")}</span>
                                <span class="text-blue-400 font-mono text-xs" id="profile-max-tokens-value">${config.profileMaxTokens || 1024}</span>
                            </label>
                            <input
                                type="range"
                                id="settings-profile-max-tokens"
                                min="256"
                                max="2048"
                                step="128"
                                value="${config.profileMaxTokens || 1024}"
                                class="w-full"
                            />
                            <div class="flex justify-between text-xs text-gray-400 mt-1">
                                <span>256</span>
                                <span>2048</span>
                            </div>
                        </div>

                        <!-- Profile Temperature -->
                        <div>
                            <label class="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
                                <span>${t("settings.profileTemperature")}</span>
                                <span class="text-blue-400 font-mono text-xs" id="profile-temperature-value">${
                                  config.profileTemperature !== undefined
                                    ? config.profileTemperature
                                    : 1.2
                                }
                                </span>
                            </label>
                            <input
                                type="range"
                                id="settings-profile-temperature"
                                min="0.5"
                                max="2"
                                step="0.1"
                                value="${
                                  config.profileTemperature !== undefined
                                    ? config.profileTemperature
                                    : 1.2
                                }"
                                class="w-full"
                            />
                            <div class="flex justify-between text-xs text-gray-400 mt-1">
                                <span>${t("settings.consistentProfile")} (0.5)</span>
                                <span>${t("settings.diverseProfile")} (2.0)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </details>
        </div>
    `;
}

/**
 * Renders the list of settings snapshots.
 * @param {Object} app - The application instance.
 * @returns {string} The HTML for the snapshot list.
 */
export function renderSnapshotList(app) {
  return `
        ${app.state.settingsSnapshots
          .map(
            (snapshot) => `
            <div class="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg">
                <span class="text-sm text-gray-300">${new Date(
                  snapshot.timestamp,
                ).toLocaleString("ko-KR")}</span>
                <div class="flex items-center gap-2">
                    <button data-timestamp="${snapshot.timestamp}" class="restore-snapshot-btn p-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors" title="${t(
                      "settings.restore",
                    )}"><i data-lucide="history" class="w-4 h-4"></i></button>
                    <button data-timestamp="${snapshot.timestamp}" class="delete-snapshot-btn p-1.5 bg-red-600 hover:bg-red-700 rounded text-white transition-colors" title="${t(
                      "settings.delete",
                    )}"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </div>
        `,
          )
          .join("")}
        ${
          app.state.settingsSnapshots.length === 0
            ? `<p class="text-sm text-gray-500 text-center py-2">${t(
                "settings.noSnapshots",
              )}</p>`
            : ""
        }
    `;
}

function setupSettingsModalEventListeners() {
  // View debug logs button
  const viewDebugLogsBtn = document.getElementById("view-debug-logs");
  if (viewDebugLogsBtn) {
    viewDebugLogsBtn.addEventListener("click", () => {
      window.personaApp.setState({
        showSettingsModal: false,
        showDebugLogsModal: true,
      });
    });
  }

  // Clear debug logs button in settings
  const clearDebugLogsBtnSettings = document.getElementById(
    "clear-debug-logs-btn",
  );
  if (clearDebugLogsBtnSettings) {
    clearDebugLogsBtnSettings.addEventListener("click", () => {
      console.log("Clear logs button clicked");
      window.personaApp.clearDebugLogs();
    });
  }

  // Data management event listeners
  setupDataManagementEventListeners();
}

function setupDataManagementEventListeners() {
  // Reset all data button
  const resetAllDataBtn = document.getElementById("reset-all-data-btn");
  if (resetAllDataBtn) {
    resetAllDataBtn.addEventListener("click", async () => {
      const confirmed = confirm(
        `${t("confirm.resetDataConfirm")}\n\n` +
          `${t("confirm.resetDataWarning")}\n` +
          `• ${t("settings.resetDataList.allCharacters")}\n` +
          `• ${t("settings.resetDataList.allChatHistory")}\n` +
          `• ${t("settings.resetDataList.userSettings")}\n` +
          `• ${t("settings.resetDataList.stickerData")}\n` +
          `• ${t("settings.resetDataList.debugLogs")}\n\n` +
          `${t("confirm.resetDataCannotUndo")}`,
      );

      if (confirmed) {
        const doubleConfirmed = confirm(
          `${t("confirm.resetDataDoubleConfirm")}\n\n` +
            `${t("confirm.resetDataBackupWarning")}\n\n` +
            `${t("confirm.resetDataFinalConfirm")}`,
        );

        if (doubleConfirmed) {
          try {
            await window.personaApp.resetAllData();
            alert(t("confirm.resetDataComplete"));
            location.reload();
          } catch (error) {
            alert(t("confirm.resetDataFailed") + error.message);
          }
        }
      }
    });
  }
}

export function setupAdvancedSettingsEventListeners() {
  // Max Tokens slider
  const maxTokensSlider = document.getElementById("settings-max-tokens");
  const maxTokensValue = document.getElementById("max-tokens-value");
  if (maxTokensSlider && maxTokensValue) {
    maxTokensSlider.addEventListener("input", (e) => {
      maxTokensValue.textContent = e.target.value;
    });
  }

  // Temperature slider
  const temperatureSlider = document.getElementById("settings-temperature");
  const temperatureValue = document.getElementById("temperature-value");
  if (temperatureSlider && temperatureValue) {
    temperatureSlider.addEventListener("input", (e) => {
      temperatureValue.textContent = parseFloat(e.target.value).toFixed(1);
    });
  }

  // Profile Max Tokens slider
  const profileMaxTokensSlider = document.getElementById("settings-profile-max-tokens");
  const profileMaxTokensValue = document.getElementById("profile-max-tokens-value");
  if (profileMaxTokensSlider && profileMaxTokensValue) {
    profileMaxTokensSlider.addEventListener("input", (e) => {
      profileMaxTokensValue.textContent = e.target.value;
    });
  }

  // Profile Temperature slider
  const profileTemperatureSlider = document.getElementById("settings-profile-temperature");
  const profileTemperatureValue = document.getElementById("profile-temperature-value");
  if (profileTemperatureSlider && profileTemperatureValue) {
    profileTemperatureSlider.addEventListener("input", (e) => {
      profileTemperatureValue.textContent = parseFloat(e.target.value).toFixed(1);
    });
  }
}

/**
 * Renders the NAI settings page for mobile view.
 * @param {Object} app - Application instance
 * @returns {string} NAI settings page HTML
 */
export function renderNaiSettingsPage(app) {
  const { settings } = app.state;
  const naiSettings = settings.naiSettings || {};
  
  const {
    // 기본 API 설정
    apiKey = "",
    
    // 모델 및 크기 설정
    model = "nai-diffusion-4-5-full",
    preferredSize = "square",
    
    // 생성 파라미터
    steps = 28,
    scale = 3,
    sampler = "k_euler_ancestral",
    
    // 안전 설정
    minDelay = 20000,
    maxAdditionalDelay = 10000,
  } = naiSettings;

  const isApiKeySet = apiKey && apiKey.trim().length > 0;
  const maskedApiKey = isApiKeySet ? "●".repeat(8) + apiKey.slice(-4) : "";

  return `
    <div class="flex flex-col h-full relative">
      <header class="absolute top-0 left-0 right-0 px-6 py-4 bg-gray-900/80 flex items-center justify-between z-10" style="backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);">
          <div class="flex items-center space-x-2">
              <button id="close-nai-settings-ui" class="p-3 -ml-2 rounded-full hover:bg-gray-700">
                  <i data-lucide="arrow-left" class="h-6 w-6 text-gray-300"></i>
              </button>
              <h2 class="font-semibold text-white text-3xl">${t("settings.naiSettings")}</h2>
          </div>
      </header>
      <div class="flex-1 overflow-y-auto space-y-4 mt-[88px] px-6 mx-4 bg-gray-900 rounded-t-2xl" id="nai-settings-ui-content">
        
        <!-- NAI API 설정 -->
        <div class="bg-gray-700/30 rounded-xl p-4">
          <h4 class="text-lg font-semibold text-white mb-3 flex items-center">
            <i data-lucide="image" class="w-5 h-5 mr-3 text-purple-400"></i>
            NovelAI API 설정
          </h4>
          
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                API 키 (Persistent Token)
              </label>
              <div class="flex gap-2">
                <input 
                  id="nai-api-key" 
                  type="password" 
                  value="${apiKey}" 
                  placeholder="NovelAI API 키를 입력하세요"
                  class="flex-1 px-3 py-2 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 text-base"
                >
                <button 
                  id="toggle-nai-api-key" 
                  type="button"
                  class="px-3 py-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                  title="API 키 보기/숨기기"
                >
                  <i data-lucide="eye" class="w-4 h-4 pointer-events-none"></i>
                </button>
              </div>
              ${isApiKeySet ? 
                `<div class="text-xs text-green-400 mt-1">✓ API 키가 설정되었습니다: ${maskedApiKey}</div>` :
                `<div class="text-xs text-red-400 mt-1">⚠ API 키가 필요합니다</div>`
              }
              <div class="text-xs text-gray-400 mt-2">
                <a href="https://novelai.net/account" target="_blank" class="text-purple-400 hover:text-purple-300">
                  NovelAI 계정 설정에서 Persistent API Token을 발급받으세요
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- 모델 및 생성 설정 -->
        <div class="bg-gray-700/30 rounded-xl p-4">
          <h4 class="text-lg font-semibold text-white mb-3 flex items-center">
            <i data-lucide="cpu" class="w-5 h-5 mr-3 text-green-400"></i>
            모델 및 생성 설정
          </h4>
          
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                NovelAI 모델
              </label>
              <select 
                id="nai-model" 
                class="w-full px-3 py-2 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-green-500/50 text-base"
              >
                ${Object.entries(NovelAIClient.MODELS).map(([modelId, modelInfo]) => `
                  <option value="${modelId}" ${model === modelId ? "selected" : ""}>
                    ${modelInfo.name} (${modelInfo.version})
                  </option>
                `).join("")}
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                이미지 크기
              </label>
              <select 
                id="nai-preferred-size" 
                class="w-full px-3 py-2 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-green-500/50 text-base"
              >
                <option value="square" ${preferredSize === "square" ? "selected" : ""}>
                  정사각형 (1024×1024) - 권장
                </option>
                <option value="portrait" ${preferredSize === "portrait" ? "selected" : ""}>
                  세로형 (832×1216)
                </option>
                <option value="landscape" ${preferredSize === "landscape" ? "selected" : ""}>
                  가로형 (1216×832)
                </option>
              </select>
              <div class="text-xs text-gray-400 mt-1">
                ✓ 모든 크기는 무제한 생성이 가능합니다
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  최소 대기 시간 (초)
                </label>
                <input 
                  id="nai-min-delay" 
                  type="number" 
                  min="10" 
                  max="60" 
                  value="${minDelay / 1000}"
                  class="w-full px-3 py-2 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-green-500/50 text-base"
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  추가 랜덤 시간 (초)
                </label>
                <input 
                  id="nai-max-additional-delay" 
                  type="number" 
                  min="0" 
                  max="30" 
                  value="${maxAdditionalDelay / 1000}"
                  class="w-full px-3 py-2 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-green-500/50 text-base"
                >
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  생성 스텝 수
                </label>
                <input 
                  id="nai-steps" 
                  type="range" 
                  min="1" 
                  max="50" 
                  value="${steps}"
                  class="w-full"
                >
                <div class="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1</span>
                  <span id="nai-steps-value">${steps}</span>
                  <span>50</span>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  프롬프트 가이던스
                </label>
                <input 
                  id="nai-scale" 
                  type="range" 
                  min="1" 
                  max="30" 
                  step="0.5"
                  value="${scale}"
                  class="w-full"
                >
                <div class="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1.0</span>
                  <span id="nai-scale-value">${scale}</span>
                  <span>30.0</span>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                샘플러
              </label>
              <select 
                id="nai-sampler" 
                class="w-full px-3 py-2 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-green-500/50 text-base"
              >
                ${NovelAIClient.SAMPLERS.map(samplerOption => `
                  <option value="${samplerOption}" ${sampler === samplerOption ? "selected" : ""}>
                    ${samplerOption.replace(/_/g, " ").toUpperCase()}
                  </option>
                `).join("")}
              </select>
            </div>
          </div>
        </div>

        <!-- NAI 일괄 생성 목록 -->
        <div class="bg-gray-700/30 rounded-xl p-4">
          <h4 class="text-lg font-semibold text-white mb-3 flex items-center justify-between">
            <div class="flex items-center">
              <i data-lucide="smile" class="w-5 h-5 mr-3 text-blue-400"></i>
              ${t('naiHandlers.emotionListTitle')}
            </div>
            <button id="edit-nai-generation-list-mobile" class="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1">
              <i data-lucide="edit-3" class="w-3 h-3 pointer-events-none"></i>
              ${t('naiHandlers.editNaiGenerationList')}
            </button>
          </h4>
          
          <div id="nai-generation-list-display" class="grid grid-cols-2 gap-2 mb-3">
            ${(settings.naiGenerationList || DEFAULT_EMOTIONS).map(item => {
              let displayText;

              if (typeof item === 'object' && item.title) {
                // 새로운 3필드 구조 - 제목만 표시
                displayText = item.title;
              } else {
                // 기존 문자열 구조 (하위 호환성)
                const emotionLabels = {
                  happy: "😊 기쁨",
                  sad: "😢 슬픔",
                  surprised: "😮 놀람",
                  angry: "😠 분노",
                  love: "💕 사랑",
                  embarrassed: "😳 부끄러움",
                  confused: "😕 혼란",
                  sleepy: "😴 졸림",
                  excited: "🤩 흥분",
                  neutral: "😐 무표정"
                };
                displayText = emotionLabels[item] || item;
              }

              return `
                <div class="bg-gray-600/50 rounded-lg px-2 py-2 text-center">
                  <span class="text-xs text-gray-300">${displayText}</span>
                </div>
              `;
            }).join("")}
          </div>
          
          <div class="text-xs text-gray-400">
            위 감정들에 대한 스티커가 자동으로 생성됩니다.
          </div>

          <!-- 편집 UI (초기에는 숨겨져 있음) -->
          <div id="nai-generation-list-editor" class="hidden mt-4">
            <div class="space-y-4">
              <!-- 현재 목록 편집 -->
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  ${t('naiHandlers.currentList')}
                </label>
                <div id="nai-editable-list" class="space-y-2 max-h-32 overflow-y-auto">
                  <!-- 동적으로 생성되는 목록 -->
                </div>
              </div>

              <!-- 새 항목 추가 -->
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">
                    ${t('naiHandlers.itemTitleLabel')}
                  </label>
                  <input
                    id="new-nai-item-title"
                    type="text"
                    placeholder="${t('naiHandlers.itemTitlePlaceholder')}"
                    class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm"
                  >
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">
                    ${t('naiHandlers.emotionLabel')}
                  </label>
                  <input
                    id="new-nai-item-emotion"
                    type="text"
                    placeholder="${t('naiHandlers.emotionPlaceholder')}"
                    class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm"
                  >
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">
                    ${t('naiHandlers.actionSituationLabel')}
                  </label>
                  <textarea
                    id="new-nai-item-action"
                    rows="3"
                    placeholder="${t('naiHandlers.actionSituationPlaceholder')}"
                    class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm resize-none"
                  ></textarea>
                </div>

                <button
                  id="add-nai-item-btn"
                  class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  ${t('naiHandlers.addNaiGenerationItem')}
                </button>
              </div>

              <!-- 편집 완료 버튼들 -->
              <div class="flex gap-2 pt-2">
                <button
                  id="save-nai-generation-list"
                  class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  ${t('naiHandlers.saveList')}
                </button>
                <button
                  id="cancel-edit-nai-generation-list"
                  class="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  ${t('naiHandlers.cancel')}
                </button>
                <button
                  id="reset-nai-generation-list"
                  class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  ${t('naiHandlers.resetToDefault')}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 배치 생성 -->
        <div class="bg-gray-700/30 rounded-xl p-4">
          <h4 class="text-lg font-semibold text-white mb-3 flex items-center">
            <i data-lucide="download" class="w-5 h-5 mr-3 text-green-400"></i>
            배치 생성
          </h4>
          
          <div>
            <button 
              id="generate-all-characters-stickers" 
              class="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-base"
              ${!isApiKeySet ? "disabled" : ""}
            >
              <i data-lucide="users" class="w-4 h-4 pointer-events-none"></i>
              ${t('naiHandlers.generateAllCharacterEmotions')}
            </button>
            
            ${!isApiKeySet ? 
              `<div class="text-xs text-yellow-400 text-center mt-2">
                ⚠ API 키를 설정해야 배치 생성을 사용할 수 있습니다
              </div>` :
              `<div class="text-xs text-gray-400 text-center mt-2">
                ${t('naiHandlers.emotionListBatchDescription')}
              </div>`
            }
          </div>
        </div>

        <!-- 도움말 -->
        <div class="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-6">
          <h4 class="text-lg font-semibold text-blue-300 mb-2 flex items-center">
            <i data-lucide="help-circle" class="w-5 h-5 mr-3"></i>
            사용 안내
          </h4>
          <div class="space-y-1 text-sm text-blue-200">
            <p>• NovelAI Persistent API Token이 필요합니다</p>
            <p>• 무제한 생성 크기만 지원: 1024×1024, 832×1216, 1216×832</p>
            <p>• 부정사용 방지를 위해 생성 간 20-30초 대기시간이 적용됩니다</p>
            <p>• 대화 중 감정이 감지되면 자동으로 해당 감정 스티커를 생성합니다</p>
          </div>
        </div>
      </div>
    </div>
  `;
}
