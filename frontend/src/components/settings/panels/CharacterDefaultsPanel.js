import { t } from "../../../i18n.js";

/**
 * Renders the character defaults settings panel
 * @param {Object} app - Application instance
 * @returns {string} Character defaults settings panel HTML
 */
export function renderCharacterDefaultsPanel(app) {
  const { settings } = app.state;

  return `
        <div class="space-y-6">
            <!-- 사용자 페르소나 설정 -->
            <div class="bg-gray-700/30 rounded-xl p-6">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <i data-lucide="user" class="w-5 h-5 mr-3 text-blue-400"></i>
                    ${t("settings.yourPersona")}
                </h4>
                <div class="space-y-4">
                    <div>
                        <label class="flex items-center text-sm font-medium text-gray-300 mb-2">
                            <i data-lucide="badge" class="w-4 h-4 mr-2"></i>
                            ${t("settings.nameOrNickname")}
                        </label>
                        <input 
                            id="settings-user-name" 
                            type="text" 
                            placeholder="${t("settings.yourNamePlaceholder")}" 
                            value="${settings.userName || ""}" 
                            class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                        />
                        <p class="text-xs text-gray-400 mt-1">${t(
                          "settings.nameOrNicknameInfo",
                        )}</p>
                    </div>
                    <div>
                        <label class="flex items-center text-sm font-medium text-gray-300 mb-2">
                            <i data-lucide="brain-circuit" class="w-4 h-4 mr-2"></i>
                            ${t("settings.selfIntroduction")}
                        </label>
                        <textarea 
                            id="settings-user-desc" 
                            placeholder="${t(
                              "settings.selfIntroductionPlaceholder",
                            )}" 
                            class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 resize-none" 
                            rows="4"
                        >${settings.userDescription || ""}</textarea>
                        <p class="text-xs text-gray-400 mt-1">${t(
                          "settings.selfIntroductionInfo",
                        )}</p>
                    </div>
                </div>
            </div>

            <!-- 선톡 설정 -->
            <div class="bg-gray-700/30 rounded-xl p-6">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <i data-lucide="message-square-plus" class="w-5 h-5 mr-3 text-blue-400"></i>
                    ${t("settings.autoMessageSettings")}
                </h4>
                <div class="space-y-6">
                    <!-- 연락처 내 선톡 -->
                    <div class="flex items-center justify-between p-4 bg-gray-600/30 rounded-lg">
                        <div class="flex-1">
                            <div class="flex items-center mb-1">
                                <i data-lucide="users" class="w-4 h-4 mr-2 text-blue-400"></i>
                                <span class="text-sm font-medium text-white">${t(
                                  "settings.proactiveChat",
                                )}</span>
                            </div>
                            <p class="text-xs text-gray-400">${t(
                              "settings.proactiveChatInfo",
                            )}</p>
                        </div>
                        <label class="relative inline-block w-12 h-6 cursor-pointer">
                            <input 
                                type="checkbox" 
                                id="settings-proactive-toggle" 
                                ${
                                  settings.proactiveChatEnabled ? "checked" : ""
                                } 
                                class="sr-only peer"
                            />
                            <div class="w-12 h-6 bg-gray-600 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
                            <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                        </label>
                    </div>

                    <!-- 랜덤 선톡 -->
                    <div class="space-y-4">
                        <div class="flex items-center justify-between p-4 bg-gray-600/30 rounded-lg">
                            <div class="flex-1">
                                <div class="flex items-center mb-1">
                                    <i data-lucide="shuffle" class="w-4 h-4 mr-2 text-blue-400"></i>
                                    <span class="text-sm font-medium text-white">${t(
                                      "settings.randomFirstMessage",
                                    )}</span>
                                </div>
                                <p class="text-xs text-gray-400">${t(
                                  "settings.randomFirstMessageInfo",
                                )}</p>
                            </div>
                            <label class="relative inline-block w-12 h-6 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    id="settings-random-first-message-toggle" 
                                    ${
                                      settings.randomFirstMessageEnabled
                                        ? "checked"
                                        : ""
                                    } 
                                    class="sr-only peer"
                                />
                                <div class="w-12 h-6 bg-gray-600 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
                                <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                            </label>
                        </div>

                        <!-- 랜덤 선톡 세부 설정 -->
                        <div id="random-chat-options" class="space-y-4 ml-4 ${
                          settings.randomFirstMessageEnabled ? "" : "hidden"
                        }">
                            <div class="bg-gray-600/20 rounded-lg p-4 space-y-4">
                                <div>
                                    <label class="flex items-center justify-between text-sm font-medium text-gray-300 mb-3">
                                        <span>${t(
                                          "settings.characterCount",
                                        )}</span>
                                        <span id="random-character-count-label" class="text-blue-400 font-semibold">${
                                          settings.randomCharacterCount || 3
                                        }${t(
                                          "settings.characterCountUnit",
                                        )}</span>
                                    </label>
                                    <input 
                                        id="settings-random-character-count" 
                                        type="range" 
                                        min="1" 
                                        max="5" 
                                        step="1" 
                                        value="${
                                          settings.randomCharacterCount || 3
                                        }" 
                                        class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                    >
                                    <div class="flex justify-between text-xs text-gray-400 mt-2">
                                        <span>1${t(
                                          "settings.characterCountUnit",
                                        )}</span>
                                        <span>3${t(
                                          "settings.characterCountUnit",
                                        )}</span>
                                        <span>5${t(
                                          "settings.characterCountUnit",
                                        )}</span>
                                    </div>
                                </div>
                                <div>
                                    <label class="text-sm font-medium text-gray-300 mb-3 block">${t(
                                      "settings.messageFrequency",
                                    )}</label>
                                    <div class="grid grid-cols-2 gap-3">
                                        <div>
                                            <label class="text-xs text-gray-400 mb-1 block">${t(
                                              "settings.minInterval",
                                            )}</label>
                                            <input 
                                                id="settings-random-frequency-min" 
                                                type="number" 
                                                min="1" 
                                                max="1440"
                                                placeholder="30" 
                                                value="${
                                                  settings.randomMessageFrequencyMin ||
                                                  30
                                                }" 
                                                class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm"
                                            >
                                        </div>
                                        <div>
                                            <label class="text-xs text-gray-400 mb-1 block">${t(
                                              "settings.maxInterval",
                                            )}</label>
                                            <input 
                                                id="settings-random-frequency-max" 
                                                type="number" 
                                                min="1" 
                                                max="1440"
                                                placeholder="120" 
                                                value="${
                                                  settings.randomMessageFrequencyMax ||
                                                  120
                                                }" 
                                                class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm"
                                            >
                                        </div>
                                    </div>
                                    <p class="text-xs text-gray-400 mt-2">${t(
                                      "settings.messageFrequencyInfo",
                                    )}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
