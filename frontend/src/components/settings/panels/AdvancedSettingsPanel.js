import { t } from "../../../i18n.js";
import { PersonaChatApp } from "../../../index.js";

/**
 * Renders the advanced settings panel
 * @param {PersonaChatApp} app - Application instance
 * @returns {string} Advanced settings panel HTML
 */
export function renderAdvancedSettingsPanel(app) {
    return `
        <div class="space-y-6">
            <!-- 디버그 설정 -->
            <div class="bg-gray-700/30 rounded-xl p-6">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <i data-lucide="bug" class="w-5 h-5 mr-3 text-blue-400"></i>
                    ${t("settings.debugSettings")}
                </h4>
                <div class="space-y-6">
                    <!-- 디버그 로그 -->
                    <div class="space-y-4">
                        <div class="flex items-center justify-between p-4 bg-gray-600/30 rounded-lg">
                            <div class="flex-1">
                                <div class="flex items-center mb-1">
                                    <i data-lucide="activity" class="w-4 h-4 mr-2 text-blue-400"></i>
                                    <span class="text-sm font-medium text-white">${t(
        "settings.enableDebugLogs",
    )}</span>
                                </div>
                                <p class="text-xs text-gray-400">${t(
        "settings.debugLogsInfo",
    )}</p>
                            </div>
                            <label class="relative inline-block w-12 h-6 cursor-pointer">
                                <input
                                    type="checkbox"
                                    id="settings-enable-debug-logs"
                                    ${app.state.enableDebugLogs ? "checked" : ""
        }
                                    class="sr-only peer"
                                />
                                <div class="w-12 h-6 bg-gray-600 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
                                <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                            </label>
                        </div>

                        <!-- 디버그 로그 관리 -->
                        <div class="bg-gray-600/20 rounded-lg p-4 space-y-4">
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-gray-300">${t(
            "settings.currentLogCount",
        )}</span>
                                <span class="font-mono text-blue-400">${app.state.debugLogs
            ? app.state.debugLogs.length
            : 0
        }/1000</span>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <button id="view-debug-logs" class="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                                    <i data-lucide="bar-chart-3" class="w-4 h-4"></i>
                                    ${t("settings.viewLogs")}
                                </button>
                                <button id="clear-debug-logs-btn" class="w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    ${t("settings.clearLogs")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 성능 설정 -->
            <div class="bg-gray-700/30 rounded-xl p-6">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <i data-lucide="gauge" class="w-5 h-5 mr-3 text-blue-400"></i>
                    ${t("settings.performanceOptimization")}
                </h4>
                <div class="space-y-4">
                    <div class="bg-gray-600/30 rounded-lg p-3 border border-gray-600/50">
                        <p class="text-xs text-gray-400 text-center">
                            <i data-lucide="clock" class="w-3 h-3 inline mr-1"></i>
                            ${t("settings.performanceComingSoon")}
                        </p>
                    </div>
                </div>
            </div>

            <!-- 실험적 기능 -->
            <div class="bg-gray-700/30 rounded-xl p-6">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <i data-lucide="flask-conical" class="w-5 h-5 mr-3 text-blue-400"></i>
                    ${t("settings.experimentalFeatures")}
                </h4>
                <div class="space-y-4">
                    <div class="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                        <div class="flex items-start gap-2">
                            <i data-lucide="alert-triangle" class="w-4 h-4 text-orange-400 mt-0.5 shrink-0"></i>
                            <div class="text-xs text-gray-300">
                                <p class="font-medium text-orange-400 mb-1">${t(
            "settings.warningNote",
        )}</p>
                                <p>${t("settings.experimentalWarning")}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- CORS 프록시 사용 여부 -->
                    <div class="flex items-center justify-between p-4 bg-gray-600/30 rounded-lg">
                        <div class="flex-1">
                            <div class="flex items-center mb-1">
                                <i data-lucide="shield-check" class="w-4 h-4 mr-2 text-orange-400"></i>
                                <span class="text-sm font-medium text-white">${t("settings.experimental.enableCorsProxy")}</span>
                            </div>
                            <p class="text-xs text-gray-400">${t("settings.experimental.enableCorsProxyInfo")}</p>
                        </div>
                        <label class="relative inline-block w-12 h-6 cursor-pointer">
                            <input
                                type="checkbox"
                                id="settings-enable-cors-proxy"
                                ${app.state.settings.experimental.enableCorsProxy ? "checked" : ""}
                                class="sr-only peer"
                            />
                            <div class="w-12 h-6 bg-gray-600 rounded-full peer-checked:bg-orange-500 transition-colors"></div>
                            <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                        </label>
                    </div>
                </div>
            </div>

            <!-- 앱 정보 -->
            <div class="bg-gray-700/30 rounded-xl p-6">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <i data-lucide="info" class="w-5 h-5 mr-3 text-blue-400"></i>
                    ${t("settings.applicationInfo")}
                </h4>
                <div class="space-y-3">
                    <div class="bg-gray-600/20 rounded-lg p-4 space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-300">${t(
            "settings.appName",
        )}</span>
                            <span class="text-sm font-mono text-blue-400">ArisuTalk</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-300">${t(
            "settings.uiMode",
        )}</span>
                            <span class="text-sm font-mono text-blue-400">Desktop</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-300">${t(
            "settings.browser",
        )}</span>
                            <span class="text-sm font-mono text-blue-400">${navigator.userAgent
            .split(" ")
            .pop()}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-300">${t(
                "settings.screenResolution",
            )}</span>
                            <span class="text-sm font-mono text-blue-400">${window.screen.width
        }×${window.screen.height}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
