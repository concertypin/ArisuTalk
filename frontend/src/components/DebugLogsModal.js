import { t } from "../i18n.js";

/**
 * Debug Logs Modal Component
 * 시스템 로그 뷰어 모달
 */

export function renderDebugLogsModal(state) {
  const { debugLogs = [], enableDebugLogs } = state;

  if (!state.showDebugLogsModal) {
    return "";
  }

  const logCount = debugLogs.length;
  const maxLogs = 1000;

  // 로그 타입별 색상 매핑
  const getLogTypeColor = (type, data) => {
    if (type === "structured") {
      const chatType = data?.metadata?.chatType || "normal";
      switch (chatType) {
        case "group":
          return "text-green-400";
        case "open":
          return "text-purple-400";
        default:
          return "text-blue-400";
      }
    }
    return "text-gray-400";
  };

  const formatTimestamp = (timestamp) => {
    // timestamp가 숫자면 그대로 사용, 문자열이면 파싱 시도
    const date =
      typeof timestamp === "number" ? new Date(timestamp) : new Date(timestamp);

    // 유효한 날짜인지 확인
    if (isNaN(date.getTime())) {
      return t("debugLogs.invalidDate");
    }

    return date.toLocaleString("ko-KR");
  };

  const renderSimpleLog = (log) => {
    const levelColor =
      {
        error: "text-red-400",
        warn: "text-yellow-400",
        info: "text-blue-400",
        debug: "text-gray-400",
      }[log.level] || "text-gray-400";

    return `
            <div class="p-3 border border-gray-600 rounded-lg bg-gray-750">
                <div class="flex justify-between items-center text-xs text-gray-400 mb-2">
                    <span class="${levelColor} font-bold">[${log.level.toUpperCase()}]</span>
                    <span>${formatTimestamp(log.timestamp)}</span>
                </div>
                <div class="text-sm text-white whitespace-pre-wrap">${
                  log.message
                }</div>
            </div>
        `;
  };

  const renderStructuredLog = (log) => {
    const data = log.data;
    const typeColor = getLogTypeColor(log.type, data);
    const chatType = data?.metadata?.chatType || "normal";
    const chatTypeLabel =
      {
        normal: t("debugLogs.normalChatType"),
        group: t("debugLogs.groupChatType"),
        open: t("debugLogs.openChatType"),
      }[chatType] || t("debugLogs.normalChatType");

    const logId = `log-${log.id}`;

    return `
            <div class="border border-gray-600 rounded-lg bg-gray-750">
                <div class="p-4 border-b border-gray-600">
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex flex-col">
                            <div class="text-lg font-bold text-white mb-1">
                                ${log.characterName || t("debugLogs.unknown")} 
                                <span class="${typeColor} text-sm font-semibold px-2 py-1 rounded-md bg-gray-700">[${chatTypeLabel}]</span>
                            </div>
                            <div class="text-xs text-gray-400">
                                ${formatTimestamp(log.timestamp)}
                            </div>
                        </div>
                    </div>
                    ${
                      data?.metadata
                        ? `
                        <div class="text-xs text-gray-500">
                            ${t("debugLogs.chatRoom")}: ${
                              data.metadata.chatId || "N/A"
                            } | 
                            ${t("debugLogs.api")}: ${
                              data.metadata.apiProvider || "N/A"
                            } | 
                            ${t("debugLogs.model")}: ${
                              data.metadata.model || "N/A"
                            }
                        </div>
                    `
                        : ""
                    }
                </div>
                
                <div class="divide-y divide-gray-600">
                    ${
                      data?.personaInput
                        ? `
                        <details class="group">
                            <summary class="p-3 cursor-pointer text-sm font-medium text-blue-300 hover:bg-gray-700 group-open:bg-gray-700">
                                <i data-lucide="chevron-right" class="w-4 h-4 inline mr-2 group-open:transform group-open:rotate-90 transition-transform pointer-events-none"></i>
                                Persona Input
                            </summary>
                            <div class="p-3 bg-gray-800 text-xs">
                                <pre class="text-gray-300 overflow-x-auto">${JSON.stringify(
                                  data.personaInput,
                                  null,
                                  2,
                                )}</pre>
                            </div>
                        </details>
                    `
                        : ""
                    }
                    
                    ${
                      data?.systemPrompt
                        ? `
                        <details class="group">
                            <summary class="p-3 cursor-pointer text-sm font-medium text-yellow-300 hover:bg-gray-700 group-open:bg-gray-700">
                                <i data-lucide="chevron-right" class="w-4 h-4 inline mr-2 group-open:transform group-open:rotate-90 transition-transform pointer-events-none"></i>
                                System Prompt
                            </summary>
                            <div class="p-3 bg-gray-800 text-xs">
                                <pre class="text-gray-300 overflow-x-auto whitespace-pre-wrap">${JSON.stringify(
                                  data.systemPrompt,
                                  null,
                                  2,
                                )}</pre>
                            </div>
                        </details>
                    `
                        : ""
                    }
                    
                    ${
                      data?.outputResponse
                        ? `
                        <details class="group">
                            <summary class="p-3 cursor-pointer text-sm font-medium text-green-300 hover:bg-gray-700 group-open:bg-gray-700">
                                <i data-lucide="chevron-right" class="w-4 h-4 inline mr-2 group-open:transform group-open:rotate-90 transition-transform pointer-events-none"></i>
                                Character Response
                            </summary>
                            <div class="p-3 bg-gray-800 text-xs">
                                <pre class="text-gray-300 overflow-x-auto">${JSON.stringify(
                                  data.outputResponse,
                                  null,
                                  2,
                                )}</pre>
                            </div>
                        </details>
                    `
                        : ""
                    }
                    
                    ${
                      data?.parameters
                        ? `
                        <details class="group">
                            <summary class="p-3 cursor-pointer text-sm font-medium text-purple-300 hover:bg-gray-700 group-open:bg-gray-700">
                                <i data-lucide="chevron-right" class="w-4 h-4 inline mr-2 group-open:transform group-open:rotate-90 transition-transform pointer-events-none"></i>
                                Parameters
                            </summary>
                            <div class="p-3 bg-gray-800 text-xs">
                                <pre class="text-gray-300 overflow-x-auto">${JSON.stringify(
                                  data.parameters,
                                  null,
                                  2,
                                )}</pre>
                            </div>
                        </details>
                    `
                        : ""
                    }
                    
                    ${
                      data?.metadata
                        ? `
                        <details class="group">
                            <summary class="p-3 cursor-pointer text-sm font-medium text-gray-300 hover:bg-gray-700 group-open:bg-gray-700">
                                <i data-lucide="chevron-right" class="w-4 h-4 inline mr-2 group-open:transform group-open:rotate-90 transition-transform pointer-events-none"></i>
                                Metadata
                            </summary>
                            <div class="p-3 bg-gray-800 text-xs">
                                <pre class="text-gray-300 overflow-x-auto">${JSON.stringify(
                                  data.metadata,
                                  null,
                                  2,
                                )}</pre>
                            </div>
                        </details>
                    `
                        : ""
                    }
                </div>
            </div>
        `;
  };

  return `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div class="bg-gray-800 rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
                <!-- Header -->
                <div class="p-6 border-b border-gray-600">
                    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div>
                            <h2 class="text-xl font-bold text-white flex items-center gap-2">
                                <i data-lucide="bar-chart-3" class="w-5 h-5"></i>
                                ${t("debugLogs.systemDebugLogs")}
                            </h2>
                            <p class="text-gray-400 text-sm mt-1">
                                ${t(
                                  "debugLogs.totalLogItems",
                                )} ${logCount}/${maxLogs}${t(
                                  "debugLogs.maxLogItems",
                                )} | 
                                ${t("debugLogs.logCollectionStatus")} ${
                                  enableDebugLogs
                                    ? t("debugLogs.enabled")
                                    : t("debugLogs.disabled")
                                }
                            </p>
                        </div>
                        <div class="flex flex-wrap justify-end gap-2 w-full sm:w-auto sm:flex-nowrap">
                            ${
                              logCount > 0
                                ? `
                                <button id="export-debug-logs" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 text-sm">
                                    <i data-lucide="download" class="w-4 h-4 pointer-events-none"></i>
                                    ${t("debugLogs.export")}
                                </button>
                                <button id="clear-debug-logs" class="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-2 text-sm">
                                    <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
                                    ${t("debugLogs.clearAll")}
                                </button>
                            `
                                : ""
                            }
                            <button id="close-debug-logs-modal" class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm">
                                ${t("debugLogs.close")}
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Content -->
                <div class="flex-1 overflow-hidden">
                    ${
                      logCount === 0
                        ? `
                        <div class="flex flex-col items-center justify-center h-full text-gray-400">
                            <i data-lucide="file-x" class="w-16 h-16 mb-4"></i>
                            <h3 class="text-lg font-medium mb-2">${t(
                              "debugLogs.noLogs",
                            )}</h3>
                            <p class="text-sm text-center">
                                ${
                                  enableDebugLogs
                                    ? t("debugLogs.noLogsCollected")
                                    : t("debugLogs.logsDisabled")
                                }
                            </p>
                        </div>
                    `
                        : `
                        <div class="p-6 h-full overflow-auto">
                            <div class="space-y-4">
                                ${debugLogs
                                  .slice()
                                  .reverse()
                                  .map((log) =>
                                    log.type === "structured"
                                      ? renderStructuredLog(log)
                                      : renderSimpleLog(log),
                                  )
                                  .join("")}
                            </div>
                        </div>
                    `
                    }
                </div>
            </div>
        </div>
    `;
}

/**
 * Setup event listeners for Debug Logs Modal
 * 관심사 분리 원칙에 따라 이벤트 핸들링을 별도 함수로 분리
 */
export function setupDebugLogsModalEventListeners() {
  // Export debug logs button
  const exportBtn = document.getElementById("export-debug-logs");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      window.personaApp.exportDebugLogs();
    });
  }

  // Clear debug logs button
  const clearBtn = document.getElementById("clear-debug-logs");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      // console.log("모달 내 로그 삭제 버튼 클릭됨");
      window.personaApp.clearDebugLogs();
    });
  }

  // Close modal button
  const closeBtn = document.getElementById("close-debug-logs-modal");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      window.personaApp.setState({ showDebugLogsModal: false });
    });
  }
}
