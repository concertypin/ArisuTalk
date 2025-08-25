import { t, getLanguage } from "../../../i18n.js";

/**
 * Renders the appearance settings panel
 * @param {Object} app - Application instance
 * @returns {string} Appearance settings panel HTML
 */
export function renderAppearanceSettingsPanel(app) {
  const { settings } = app.state;
  const currentLanguage = getLanguage();

  return `
        <div class="space-y-6">
            <!-- UI 크기 설정 -->
            <div class="bg-gray-700/30 rounded-xl p-6">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <i data-lucide="type" class="w-5 h-5 mr-3 text-blue-400"></i>
                    ${t("settings.interfaceSize")}
                </h4>
                <div class="space-y-4">
                    <div>
                        <label class="flex items-center justify-between text-sm font-medium text-gray-300 mb-3">
                            <span>${t("settings.uiScale")}</span>
                            <span class="text-blue-400 font-mono text-sm" id="font-scale-value">${Math.round(
                              settings.fontScale * 100,
                            )}%</span>
                        </label>
                        <input 
                            id="settings-font-scale" 
                            type="range" 
                            min="0.8" 
                            max="1.4" 
                            step="0.1" 
                            value="${settings.fontScale}" 
                            class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                        >
                        <div class="relative mt-2">
                            <div class="flex justify-between text-xs text-gray-400">
                                <span>80% (${t("settings.small")})</span>
                                <span>140% (${t("settings.large")})</span>
                            </div>
                            <div class="absolute text-xs text-gray-400 -mt-4" style="left: 33.33%; transform: translateX(-50%);">
                                <span>100% (${t("settings.defaultSize")})</span>
                            </div>
                        </div>
                    </div>
                    <div class="bg-gray-600/50 rounded-lg p-3">
                        <p class="text-xs text-gray-300">
                            <i data-lucide="info" class="w-3 h-3 inline mr-1"></i>
                            ${t("settings.uiScaleInfo")}
                        </p>
                    </div>
                </div>
            </div>

            <!-- 언어 설정 -->
            <div class="bg-gray-700/30 rounded-xl p-6">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <i data-lucide="globe" class="w-5 h-5 mr-3 text-blue-400"></i>
                    ${t("settings.language")}
                </h4>
                <div class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button 
                            id="language-korean" 
                            class="language-select-btn p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
                              currentLanguage === "ko"
                                ? "bg-blue-600/20 border-blue-500 text-blue-400"
                                : "bg-gray-600/30 border-gray-600 text-gray-300 hover:bg-gray-600/50 hover:border-gray-500"
                            }"
                            data-language="ko"
                        >
                            <div class="text-2xl">🇰🇷</div>
                            <div class="text-left">
                                <div class="font-medium">${t(
                                  "settings.languageKorean",
                                )}</div>
                                <div class="text-xs opacity-75">한국어</div>
                            </div>
                        </button>
                        <button 
                            id="language-english" 
                            class="language-select-btn p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
                              currentLanguage === "en"
                                ? "bg-blue-600/20 border-blue-500 text-blue-400"
                                : "bg-gray-600/30 border-gray-600 text-gray-300 hover:bg-gray-600/50 hover:border-gray-500"
                            }"
                            data-language="en"
                        >
                            <div class="text-2xl">🇺🇸</div>
                            <div class="text-left">
                                <div class="font-medium">${t(
                                  "settings.languageEnglish",
                                )}</div>
                                <div class="text-xs opacity-75">English</div>
                            </div>
                        </button>
                    </div>
                    <div class="bg-gray-600/50 rounded-lg p-3">
                        <p class="text-xs text-gray-300">
                            <i data-lucide="info" class="w-3 h-3 inline mr-1"></i>
                            ${t("settings.languageInfo")}
                        </p>
                    </div>
                </div>
            </div>

            <!-- 테마 설정 (향후 확장용) -->
            <div class="bg-gray-700/30 rounded-xl p-6">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <i data-lucide="palette" class="w-5 h-5 mr-3 text-blue-400"></i>
                    ${t("settings.themeSettings")}
                </h4>
                <div class="space-y-4">
                    <div class="bg-gray-600/50 rounded-lg p-4 text-center">
                        <i data-lucide="moon" class="w-8 h-8 text-blue-400 mx-auto mb-2"></i>
                        <p class="text-gray-300 text-sm">${t(
                          "settings.darkTheme",
                        )}</p>
                        <p class="text-xs text-gray-400 mt-1">${t(
                          "settings.currentTheme",
                        )}</p>
                    </div>
                    <div class="bg-gray-600/30 rounded-lg p-3 border border-gray-600/50">
                        <p class="text-xs text-gray-400 text-center">
                            <i data-lucide="clock" class="w-3 h-3 inline mr-1"></i>
                            ${t("settings.themeComingSoon")}
                        </p>
                    </div>
                </div>
            </div>

            <!-- 애니메이션 설정 (향후 확장용) -->
            <div class="bg-gray-700/30 rounded-xl p-6">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <i data-lucide="zap" class="w-5 h-5 mr-3 text-blue-400"></i>
                    ${t("settings.animationSettings")}
                </h4>
                <div class="space-y-4">
                    <div class="bg-gray-600/30 rounded-lg p-3 border border-gray-600/50">
                        <p class="text-xs text-gray-400 text-center">
                            <i data-lucide="clock" class="w-3 h-3 inline mr-1"></i>
                            ${t("settings.animationComingSoon")}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;
}
