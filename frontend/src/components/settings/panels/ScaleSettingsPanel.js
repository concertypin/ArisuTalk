import { t } from "../../../i18n.js";

/**
 * Renders the scale settings panel.
 * @param {import("../../../app.js").Application} app - The application instance.
 * @returns {string} The rendered HTML of the scale settings panel.
 */
export function renderScaleSettingsPanel(app) {
  const { settings } = app.state;

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
    </div>
  `;
}
