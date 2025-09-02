import { t, getLanguage } from "../i18n.js";
import {
  PROVIDERS,
  PROVIDER_MODELS,
  DEFAULT_PROVIDER,
} from "../constants/providers.js";

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
                  "settings.scale",
                )}</span>
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
                          )}" value="${settings.userName}" class="w-full px-3 py-2 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-base" oninput="window.personaApp.handleSettingChange('userName', this.value)" />
                      </div>
                      <div>
                          <label class="flex items-center text-base font-medium text-gray-300 mb-2"><i data-lucide="brain-circuit" class="w-5 h-5 mr-3"></i>${t(
                            "settings.yourDescription",
                          )}</label>
                          <textarea id="settings-user-desc" placeholder="${t(
                            "settings.yourDescriptionPlaceholder",
                          )}" class="w-full px-3 py-2 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-base" rows="3" oninput="window.personaApp.handleSettingChange('userDescription', this.value)">${settings.userDescription}</textarea>
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
                                  <input type="checkbox" name="toggle" id="settings-proactive-toggle" ${settings.proactiveChatEnabled ? "checked" : ""} class="absolute opacity-0 w-0 h-0 peer" onchange="window.personaApp.handleSettingChange('proactiveChatEnabled', this.checked)"/>
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
                                  <input type="checkbox" name="toggle" id="settings-random-first-message-toggle" ${settings.randomFirstMessageEnabled ? "checked" : ""} class="absolute opacity-0 w-0 h-0 peer" onchange="window.personaApp.handleSettingChange('randomFirstMessageEnabled', this.checked)"/>
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
                                  <input id="settings-random-character-count" type="range" min="1" max="5" step="1" value="${settings.randomCharacterCount}" class="w-full" oninput="window.personaApp.handleSettingChange('randomCharacterCount', parseInt(this.value))">
                              </div>
                              <div>
                                  <label class="text-base font-medium text-gray-300 mb-2 block">${t(
                                    "settings.messageFrequency",
                                  )}</label>
                                  <div class="flex items-center gap-3">
                                      <input id="settings-random-frequency-min" type="number" min="1" class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-base" placeholder="${t(
                                        "settings.min",
                                      )}" value="${settings.randomMessageFrequencyMin}" oninput="window.personaApp.handleSettingChange('randomMessageFrequencyMin', parseInt(this.value))">
                                      <span class="text-gray-400">-</span>
                                      <input id="settings-random-frequency-max" type="number" min="1" class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-base" placeholder="${t(
                                        "settings.max",
                                      )}" value="${settings.randomMessageFrequencyMax}" oninput="window.personaApp.handleSettingChange('randomMessageFrequencyMax', parseInt(this.value))">
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
                                  <input type="checkbox" name="toggle" id="settings-snapshots-toggle" ${settings.snapshotsEnabled ? "checked" : ""} class="absolute opacity-0 w-0 h-0 peer" onchange="window.personaApp.handleSettingChange('snapshotsEnabled', this.checked)"/>
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
                                  <input type="checkbox" name="toggle" id="settings-enable-debug-logs" ${app.state.enableDebugLogs ? "checked" : ""} onchange="window.personaApp.handleSettingChange('enableDebugLogs', this.checked)" class="absolute opacity-0 w-0 h-0 peer"/>
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
            <select id="settings-api-provider" class="w-full px-3 py-2 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-base" onchange="window.personaApp.handleSettingChange('apiProvider', this.value)">
                <option value="gemini" ${ (settings.apiProvider || "gemini") === "gemini" ? "selected" : ""}>Google Gemini</option>
                <option value="claude" ${ (settings.apiProvider || "gemini") === "claude" ? "selected" : ""}>Anthropic Claude</option>
                <option value="openai" ${ (settings.apiProvider || "gemini") === "openai" ? "selected" : ""}>OpenAI ChatGPT</option>
                <option value="grok" ${ (settings.apiProvider || "gemini") === "grok" ? "selected" : ""}>xAI Grok</option>
                <option value="openrouter" ${ (settings.apiProvider || "gemini") === "openrouter" ? "selected" : ""}>OpenRouter</option>
                <option value="custom_openai" ${ (settings.apiProvider || "gemini") === "custom_openai" ? "selected" : ""}>Custom OpenAI</option>
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
            <input id="settings-font-scale" type="range" min="0.8" max="1.4" step="0.1" value="${settings.fontScale}" class="w-full" oninput="window.personaApp.handleSettingChange('fontScale', parseFloat(this.value))">
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
  const closeButton = document.getElementById('close-settings-ui');
  if (closeButton) {
    const newButton = closeButton.cloneNode(true);
    closeButton.parentNode.replaceChild(newButton, closeButton);
    newButton.addEventListener('click', () => {
      app.setState({ showSettingsUI: false });
    });
  }

  setupSettingsModalEventListeners(app);
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
                    oninput="window.personaApp.handleProviderConfigChange('apiKey', this.value)"
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
                        oninput="window.personaApp.handleProviderConfigChange('baseUrl', this.value)"
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
                                onclick="window.personaApp.handleProviderConfigChange('model', this.dataset.model)"
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
                                    onclick="window.personaApp.handleProviderConfigChange('model', this.dataset.model)"
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
                        oninput="window.personaApp.handleProviderConfigChange('maxTokens', parseInt(this.value)); document.getElementById('max-tokens-value').textContent = this.value;"
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
                        oninput="window.personaApp.handleProviderConfigChange('temperature', parseFloat(this.value)); document.getElementById('temperature-value').textContent = parseFloat(this.value).toFixed(1);"
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
                                oninput="window.personaApp.handleProviderConfigChange('profileMaxTokens', parseInt(this.value)); document.getElementById('profile-max-tokens-value').textContent = this.value;"
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
                                oninput="window.personaApp.handleProviderConfigChange('profileTemperature', parseFloat(this.value)); document.getElementById('profile-temperature-value').textContent = parseFloat(this.value).toFixed(1);"
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