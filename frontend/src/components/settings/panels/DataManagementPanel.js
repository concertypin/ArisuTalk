import { renderSnapshotList } from "../../MobileSettingsModal.js";
import { t } from "../../../i18n.js";

/**
 * 데이터 관리 설정 패널 렌더링
 * @param {Object} app - 애플리케이션 인스턴스
 * @returns {string} 데이터 관리 설정 패널 HTML
 */
export function renderDataManagementPanel(app) {
  const { settings } = app.state;

  return `
        <div class="space-y-6">
            <!-- 백업 및 복원 -->
            <div class="bg-gray-700/30 rounded-xl p-6">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <i data-lucide="hard-drive" class="w-5 h-5 mr-3 text-blue-400"></i>
                    ${t("settings.backupInfoTitle")}
                </h4>
                <div class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button id="backup-data-btn" class="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors flex items-center justify-center gap-2">
                            <i data-lucide="download" class="w-4 h-4"></i>
                            ${t("settings.backupData")}
                        </button>
                        <button id="restore-data-btn" class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center justify-center gap-2">
                            <i data-lucide="upload" class="w-4 h-4"></i>
                            ${t("settings.restoreData")}
                        </button>
                    </div>
                    <div class="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                        <div class="flex items-start gap-2">
                            <i data-lucide="info" class="w-4 h-4 text-blue-400 mt-0.5 shrink-0"></i>
                            <div class="text-xs text-gray-300">
                                <p class="font-medium text-blue-400 mb-1">${t(
                                  "settings.backupInfoTitle"
                                )}</p>
                                <p>${t("settings.backupInfo")}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 프롬프트 백업 -->
            <div class="bg-gray-700/30 rounded-xl p-6">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <i data-lucide="file-text" class="w-5 h-5 mr-3 text-blue-400"></i>
                    ${t("settings.promptBackup")}
                </h4>
                <div class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button id="backup-prompts-btn" class="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors flex items-center justify-center gap-2">
                            <i data-lucide="download" class="w-4 h-4"></i>
                            ${t("settings.promptBackup")}
                        </button>
                        <button id="restore-prompts-btn" class="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors flex items-center justify-center gap-2">
                            <i data-lucide="upload" class="w-4 h-4"></i>
                            ${t("settings.promptRestore")}
                        </button>
                    </div>
                    <div class="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
                        <p class="text-xs text-gray-300">
                            <i data-lucide="file-pen-line" class="w-3 h-3 inline mr-1"></i>
                            ${t("settings.promptBackupInfo")}
                        </p>
                    </div>
                </div>
            </div>

            <!-- 설정 스냅샷 -->
            <div class="bg-gray-700/30 rounded-xl p-6">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <i data-lucide="camera" class="w-5 h-5 mr-3 text-blue-400"></i>
                    ${t("settings.snapshots")}
                </h4>
                <div class="space-y-4">
                    <div class="flex items-center justify-between p-4 bg-gray-600/30 rounded-lg">
                        <div class="flex-1">
                            <div class="flex items-center mb-1">
                                <i data-lucide="history" class="w-4 h-4 mr-2 text-blue-400"></i>
                                <span class="text-sm font-medium text-white">${t(
                                  "settings.autoSnapshots"
                                )}</span>
                            </div>
                            <p class="text-xs text-gray-400">${t(
                              "settings.autoSnapshotsInfo"
                            )}</p>
                        </div>
                        <label class="relative inline-block w-12 h-6 cursor-pointer">
                            <input 
                                type="checkbox" 
                                id="settings-snapshots-toggle" 
                                ${settings.snapshotsEnabled ? "checked" : ""} 
                                class="sr-only peer"
                            />
                            <div class="w-12 h-6 bg-gray-600 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
                            <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                        </label>
                    </div>
                    
                    <!-- 스냅샷 목록 -->
                    <div id="snapshots-list" class="space-y-2 ${
                      settings.snapshotsEnabled ? "" : "hidden"
                    }">
                        <div class="bg-gray-600/20 rounded-lg p-4">
                            <h6 class="text-sm font-medium text-gray-300 mb-3">${t(
                              "settings.savedSnapshots"
                            )}</h6>
                            <div class="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700 scrollbar-thumb-rounded-full">
                                ${renderSnapshotList(app)}
                            </div>
                            ${
                              app.state.settingsSnapshots.length > 3
                                ? `
                                <div class="text-xs text-gray-500 text-center mt-2 flex items-center justify-center gap-1">
                                    <i data-lucide="mouse" class="w-3 h-3"></i>
                                    ${t("settings.scrollToSeeMore")}
                                </div>
                            `
                                : ""
                            }
                        </div>
                    </div>
                </div>
            </div>

            <!-- 데이터 초기화 (위험 구역) -->
            <div class="bg-red-900/20 border-2 border-red-500/30 rounded-xl p-6">
                <h4 class="text-lg font-semibold text-red-400 mb-4 flex items-center">
                    <i data-lucide="alert-triangle" class="w-5 h-5 mr-3"></i>
                    ${t("settings.dangerZone")}
                </h4>
                <div class="space-y-4">
                    <div class="bg-red-900/30 border border-red-500/40 rounded-lg p-4">
                        <div class="flex items-start gap-3">
                            <i data-lucide="trash-2" class="w-5 h-5 text-red-400 mt-0.5 shrink-0"></i>
                            <div class="flex-1">
                                <h5 class="font-medium text-red-400 mb-2">${t(
                                  "settings.resetAllData"
                                )}</h5>
                                <div class="text-xs text-gray-300 space-y-1">
                                    <p>${t("settings.resetAllDataInfo")}</p>
                                    <ul class="list-disc list-inside space-y-0.5 ml-2">
                                        <li>${t(
                                          "settings.resetDataList.allCharacters"
                                        )}</li>
                                        <li>${t(
                                          "settings.resetDataList.allChatHistory"
                                        )}</li>
                                        <li>${t(
                                          "settings.resetDataList.userSettings"
                                        )}</li>
                                        <li>${t(
                                          "settings.resetDataList.stickerData"
                                        )}</li>
                                        <li>${t(
                                          "settings.resetDataList.debugLogs"
                                        )}</li>
                                    </ul>
                                    <p class="text-red-300 font-medium mt-2">${t(
                                      "settings.resetWarning"
                                    )}</p>
                                </div>
                            </div>
                        </div>
                        <button id="reset-all-data-btn" class="w-full mt-4 py-3 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors flex items-center justify-center gap-2">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                            ${t("settings.resetAllData")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- 숨겨진 파일 입력 요소들 -->
        <input type="file" id="restore-file-input" accept=".json" style="display: none;">
        <input type="file" id="restore-prompts-input" accept=".json" style="display: none;">
    `;
}
