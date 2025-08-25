import { t, getLanguage } from "../i18n.js";
import {
  PROVIDERS,
  PROVIDER_MODELS,
  DEFAULT_PROVIDER,
} from "../constants/providers.js";

/**
 * Renders the current selected API provider settings.
 * Supports legacy compatibility and migrates existing settings to new structure.
 * @param {Object} app - Application instance
 * @param {Object} app.state - Application state
 * @param {Object} app.state.settings - User settings
 * @returns {string} Current provider settings HTML
 */
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
 * @param {string} config.apiKey - API key
 * @param {string} config.model - Selected model
 * @param {Array<string>} config.customModels - List of custom models
 * @param {string} [config.baseUrl] - Base URL for Custom OpenAI
 * @param {number} [config.maxTokens] - Maximum tokens
 * @param {number} [config.temperature] - Temperature setting
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
                        <span class="text-blue-400 font-mono text-xs" id="max-tokens-value">${
                          config.maxTokens ||
                          (provider === "gemini" ? 4096 : 4096)
                        }</span>
                    </label>
                    <input 
                        type="range" 
                        id="settings-max-tokens" 
                        min="512" 
                        max="8192" 
                        step="256" 
                        value="${
                          config.maxTokens ||
                          (provider === "gemini" ? 4096 : 4096)
                        }" 
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
                        }</span>
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
                                <span class="text-blue-400 font-mono text-xs" id="profile-max-tokens-value">${
                                  config.profileMaxTokens || 1024
                                }</span>
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
                                }</span>
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
                                <span>${t(
                                  "settings.consistentProfile",
                                )} (0.5)</span>
                                <span>${t(
                                  "settings.diverseProfile",
                                )} (2.0)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </details>
        </div>
    `;
}

/**
 * Renders the settings snapshots list.
 * Provides restore and delete buttons for each snapshot.
 * @param {Object} app - Application instance
 * @param {Object} app.state - Application state
 * @param {Array<Object>} app.state.settingsSnapshots - List of settings snapshots
 * @param {number} app.state.settingsSnapshots[].timestamp - Snapshot creation time
 * @returns {string} Snapshots list HTML
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
                    <button data-timestamp="${
                      snapshot.timestamp
                    }" class="restore-snapshot-btn p-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors" title="${t(
                      "settings.restore",
                    )}"><i data-lucide="history" class="w-4 h-4"></i></button>
                    <button data-timestamp="${
                      snapshot.timestamp
                    }" class="delete-snapshot-btn p-1.5 bg-red-600 hover:bg-red-700 rounded text-white transition-colors" title="${t(
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

/**
 * Renders the mobile-specific settings modal.
 * Includes AI settings, UI scale, user persona, proactive chat, appearance settings, and data management.
 * @param {Object} app - Application instance
 * @param {Object} app.state - Application state
 * @param {Object} app.state.settings - User settings
 * @param {Array<string>} app.state.openSettingsSections - List of open settings sections
 * @returns {string} Mobile settings modal HTML
 */
export function renderSettingsModal(app) {
  const { settings } = app.state;
  return `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div class="bg-gray-800 rounded-2xl w-full max-w-md mx-4 flex flex-col" style="max-height: 90vh;">
                <div class="flex items-center justify-between p-6 border-b border-gray-700 shrink-0">
                    <h3 class="text-lg font-semibold text-white">${t(
                      "settings.title",
                    )}</h3>
                    <button id="close-settings-modal" class="p-1 hover:bg-gray-700 rounded-full"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <div class="p-6 space-y-2 overflow-y-auto" id="settings-modal-content">
                    <details data-section="ai" class="group border-b border-gray-700 pb-2" ${
                      app.state.openSettingsSections.includes("ai")
                        ? "open"
                        : ""
                    }>
                        <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                            <span class="text-base font-medium text-gray-200">${t(
                              "settings.aiSettings",
                            )}</span>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                        </summary>
                        <div class="content-wrapper">
                            <div class="content-inner pt-4 space-y-4">
                                <div>
                                    <label class="flex items-center text-sm font-medium text-gray-300 mb-2"><i data-lucide="globe" class="w-4 h-4 mr-2"></i>${t(
                                      "settings.aiProvider",
                                    )}</label>
                                    <select id="settings-api-provider" class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-sm">
                                        <option value="gemini" ${
                                          (settings.apiProvider || "gemini") ===
                                          "gemini"
                                            ? "selected"
                                            : ""
                                        }>Google Gemini</option>
                                        <option value="claude" ${
                                          (settings.apiProvider || "gemini") ===
                                          "claude"
                                            ? "selected"
                                            : ""
                                        }>Anthropic Claude</option>
                                        <option value="openai" ${
                                          (settings.apiProvider || "gemini") ===
                                          "openai"
                                            ? "selected"
                                            : ""
                                        }>OpenAI ChatGPT</option>
                                        <option value="grok" ${
                                          (settings.apiProvider || "gemini") ===
                                          "grok"
                                            ? "selected"
                                            : ""
                                        }>xAI Grok</option>
                                        <option value="openrouter" ${
                                          (settings.apiProvider || "gemini") ===
                                          "openrouter"
                                            ? "selected"
                                            : ""
                                        }>OpenRouter</option>
                                        <option value="custom_openai" ${
                                          (settings.apiProvider || "gemini") ===
                                          "custom_openai"
                                            ? "selected"
                                            : ""
                                        }>Custom OpenAI</option>
                                    </select>
                                </div>
                                <div class="provider-settings-container">${renderCurrentProviderSettings(
                                  app,
                                )}</div>
                                
                                
                                <div>
                                    <button id="open-prompt-modal" class="w-full mt-2 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                                        <i data-lucide="file-pen-line" class="w-4 h-4"></i> ${t(
                                          "settings.editPrompt",
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </details>
                    <details data-section="scale" class="group border-b border-gray-700 pb-2" ${
                      app.state.openSettingsSections.includes("scale")
                        ? "open"
                        : ""
                    }>
                        <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                            <span class="text-base font-medium text-gray-200">${t(
                              "settings.scale",
                            )}</span>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                        </summary>
                        <div class="content-wrapper">
                            <div class="content-inner pt-4 space-y-4">
                                <div>
                                    <label class="flex items-center text-sm font-medium text-gray-300 mb-2"><i data-lucide="type" class="w-4 h-4 mr-2"></i>${t(
                                      "settings.uiSize",
                                    )}</label>
                                    <input id="settings-font-scale" type="range" min="0.8" max="1.4" step="0.1" value="${
                                      settings.fontScale
                                    }" class="w-full">
                                    <div class="flex justify-between text-xs text-gray-400 mt-1"><span>${t(
                                      "settings.small",
                                    )}</span><span>${t(
                                      "settings.large",
                                    )}</span></div>
                                </div>
                            </div>
                        </div>
                    </details>
                    <details data-section="persona" class="group border-b border-gray-700 pb-2" ${
                      app.state.openSettingsSections.includes("persona")
                        ? "open"
                        : ""
                    }>
                        <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                            <span class="text-base font-medium text-gray-200">${t(
                              "settings.yourPersona",
                            )}</span>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                        </summary>
                        <div class="content-wrapper">
                            <div class="content-inner pt-4 space-y-4">
                                <div>
                                    <label class="flex items-center text-sm font-medium text-gray-300 mb-2"><i data-lucide="user" class="w-4 h-4 mr-2"></i>${t(
                                      "settings.yourName",
                                    )}</label>
                                    <input id="settings-user-name" type="text" placeholder="${t(
                                      "settings.yourNamePlaceholder",
                                    )}" value="${
                                      settings.userName
                                    }" class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-sm" />
                                </div>
                                <div>
                                    <label class="flex items-center text-sm font-medium text-gray-300 mb-2"><i data-lucide="brain-circuit" class="w-4 h-4 mr-2"></i>${t(
                                      "settings.yourDescription",
                                    )}</label>
                                    <textarea id="settings-user-desc" placeholder="${t(
                                      "settings.yourDescriptionPlaceholder",
                                    )}" class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-sm" rows="3">${
                                      settings.userDescription
                                    }</textarea>
                                </div>
                            </div>
                        </div>
                    </details>
                    <details data-section="proactive" class="group border-b border-gray-700 pb-2" ${
                      app.state.openSettingsSections.includes("proactive")
                        ? "open"
                        : ""
                    }>
                        <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                            <span class="text-base font-medium text-gray-200">${t(
                              "settings.proactiveSettings",
                            )}</span>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                        </summary>
                        <div class="content-wrapper">
                            <div class="content-inner pt-4 space-y-4">
                                <div class="py-2">
                                    <label class="flex items-center justify-between text-sm font-medium text-gray-300 cursor-pointer">
                                        <span class="flex items-center"><i data-lucide="message-square-plus" class="w-4 h-4 mr-2"></i>${t(
                                          "settings.proactiveChat",
                                        )}</span>
                                        <div class="relative inline-block w-10 align-middle select-none">
                                            <input type="checkbox" name="toggle" id="settings-proactive-toggle" ${
                                              settings.proactiveChatEnabled
                                                ? "checked"
                                                : ""
                                            } class="absolute opacity-0 w-0 h-0 peer"/>
                                            <label for="settings-proactive-toggle" class="block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer peer-checked:bg-blue-600"></label>
                                            <span class="absolute left-0.5 top-0.5 block w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                        </div>
                                    </label>
                                </div>
                                <div class="py-2 border-t border-gray-700 mt-2 pt-2">
                                    <label class="flex items-center justify-between text-sm font-medium text-gray-300 cursor-pointer">
                                        <span class="flex items-center"><i data-lucide="shuffle" class="w-4 h-4 mr-2"></i>${t(
                                          "settings.randomFirstMessage",
                                        )}</span>
                                        <div class="relative inline-block w-10 align-middle select-none">
                                            <input type="checkbox" name="toggle" id="settings-random-first-message-toggle" ${
                                              settings.randomFirstMessageEnabled
                                                ? "checked"
                                                : ""
                                            } class="absolute opacity-0 w-0 h-0 peer"/>
                                            <label for="settings-random-first-message-toggle" class="block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer peer-checked:bg-blue-600"></label>
                                            <span class="absolute left-0.5 top-0.5 block w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                        </div>
                                    </label>
                                    <div id="random-chat-options" class="mt-4 space-y-4" style="display: ${
                                      settings.randomFirstMessageEnabled
                                        ? "block"
                                        : "none"
                                    }">
                                        <div>
                                            <label class="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
                                                <span>${t(
                                                  "settings.characterCount",
                                                )}</span>
                                                <span id="random-character-count-label" class="text-blue-400 font-semibold">${
                                                  settings.randomCharacterCount
                                                }${t(
                                                  "settings.characterCountUnit",
                                                )}</span>
                                            </label>
                                            <input id="settings-random-character-count" type="range" min="1" max="5" step="1" value="${
                                              settings.randomCharacterCount
                                            }" class="w-full">
                                        </div>
                                        <div>
                                            <label class="text-sm font-medium text-gray-300 mb-2 block">${t(
                                              "settings.messageFrequency",
                                            )}</label>
                                            <div class="flex items-center gap-2">
                                                <input id="settings-random-frequency-min" type="number" min="1" class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm" placeholder="${t(
                                                  "settings.min",
                                                )}" value="${
                                                  settings.randomMessageFrequencyMin
                                                }">
                                                <span class="text-gray-400">-</span>
                                                <input id="settings-random-frequency-max" type="number" min="1" class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm" placeholder="${t(
                                                  "settings.max",
                                                )}" value="${
                                                  settings.randomMessageFrequencyMax
                                                }">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </details>
                    <details data-section="snapshots" class="group border-b border-gray-700 pb-2" ${
                      app.state.openSettingsSections.includes("snapshots")
                        ? "open"
                        : ""
                    }>
                        <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                            <span class="text-base font-medium text-gray-200">${t(
                              "settings.snapshots",
                            )}</span>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                        </summary>
                        <div class="content-wrapper">
                            <div class="content-inner pt-4 space-y-4">
                                <div class="py-2">
                                    <label class="flex items-center justify-between text-sm font-medium text-gray-300 cursor-pointer">
                                        <span class="flex items-center"><i data-lucide="camera" class="w-4 h-4 mr-2"></i>${t(
                                          "settings.enableSnapshots",
                                        )}</span>
                                        <div class="relative inline-block w-10 align-middle select-none">
                                            <input type="checkbox" name="toggle" id="settings-snapshots-toggle" ${
                                              settings.snapshotsEnabled
                                                ? "checked"
                                                : ""
                                            } class="absolute opacity-0 w-0 h-0 peer"/>
                                            <label for="settings-snapshots-toggle" class="block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer peer-checked:bg-blue-600"></label>
                                            <span class="absolute left-0.5 top-0.5 block w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                        </div>
                                    </label>
                                </div>
                                <div id="snapshots-list" class="space-y-2" style="display: ${
                                  settings.snapshotsEnabled ? "block" : "none"
                                }">
                                    ${renderSnapshotList(app)}
                                </div>
                            </div>
                        </div>
                    </details>
                    <details data-section="language" class="group border-b border-gray-700 pb-2" ${
                      app.state.openSettingsSections.includes("language")
                        ? "open"
                        : ""
                    }>
                        <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                            <span class="text-base font-medium text-gray-200">${t(
                              "settings.language",
                            )}</span>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                        </summary>
                        <div class="content-wrapper">
                            <div class="content-inner pt-4 space-y-4">
                                <div class="space-y-3">
                                    <button 
                                        id="language-korean" 
                                        class="language-select-btn w-full p-3 rounded-lg border transition-all duration-200 flex items-center gap-3 ${
                                          getLanguage() === "ko"
                                            ? "bg-blue-600/20 border-blue-500 text-blue-400"
                                            : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                                        }"
                                        data-language="ko"
                                    >
                                        <div class="text-xl">🇰🇷</div>
                                        <div class="text-left flex-1">
                                            <div class="font-medium">${t(
                                              "settings.languageKorean",
                                            )}</div>
                                            <div class="text-xs opacity-75">한국어</div>
                                        </div>
                                        ${
                                          getLanguage() === "ko"
                                            ? '<i data-lucide="check" class="w-4 h-4 text-blue-400"></i>'
                                            : ""
                                        }
                                    </button>
                                    <button 
                                        id="language-english" 
                                        class="language-select-btn w-full p-3 rounded-lg border transition-all duration-200 flex items-center gap-3 ${
                                          getLanguage() === "en"
                                            ? "bg-blue-600/20 border-blue-500 text-blue-400"
                                            : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                                        }"
                                        data-language="en"
                                    >
                                        <div class="text-xl">🇺🇸</div>
                                        <div class="text-left flex-1">
                                            <div class="font-medium">${t(
                                              "settings.languageEnglish",
                                            )}</div>
                                            <div class="text-xs opacity-75">English</div>
                                        </div>
                                        ${
                                          getLanguage() === "en"
                                            ? '<i data-lucide="check" class="w-4 h-4 text-blue-400"></i>'
                                            : ""
                                        }
                                    </button>
                                </div>
                                <div class="bg-gray-600/50 rounded-lg p-3">
                                    <p class="text-xs text-gray-300">
                                        <i data-lucide="info" class="w-3 h-3 inline mr-1"></i>
                                        언어를 변경하면 페이지가 새로고침됩니다.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </details>
                    <details data-section="debug" class="group border-b border-gray-700 pb-2" ${
                      app.state.openSettingsSections.includes("debug")
                        ? "open"
                        : ""
                    }>
                        <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                            <span class="text-base font-medium text-gray-200">${t(
                              "settings.debugLogs",
                            )}</span>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                        </summary>
                        <div class="content-wrapper">
                            <div class="content-inner pt-4 space-y-4">
                                <div class="py-2">
                                    <label class="flex items-center justify-between text-sm font-medium text-gray-300 cursor-pointer">
                                        <span class="flex items-center"><i data-lucide="activity" class="w-4 h-4 mr-2"></i>${t(
                                          "settings.enableDebugLogs",
                                        )}</span>
                                        <div class="relative inline-block w-10 align-middle select-none">
                                            <input type="checkbox" name="toggle" id="settings-enable-debug-logs" ${
                                              app.state.enableDebugLogs
                                                ? "checked"
                                                : ""
                                            } onchange="window.personaApp.setState({ enableDebugLogs: this.checked, settings: { ...window.personaApp.state.settings, enableDebugLogs: this.checked } })" class="absolute opacity-0 w-0 h-0 peer"/>
                                            <label for="settings-enable-debug-logs" class="block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer peer-checked:bg-blue-600"></label>
                                            <span class="absolute left-0.5 top-0.5 block w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                        </div>
                                    </label>
                                    <p class="text-xs text-gray-500 mt-2">${t(
                                      "settings.debugLogsInfo",
                                    )}</p>
                                </div>
                                <div class="py-2 border-t border-gray-700 mt-2 pt-2 space-y-2">
                                    <div class="flex items-center justify-between text-sm text-gray-400">
                                        <span>${t(
                                          "settings.currentLogCount",
                                        )}</span>
                                        <span class="font-mono">${
                                          app.state.debugLogs
                                            ? app.state.debugLogs.length
                                            : 0
                                        }/1000</span>
                                    </div>
                                    <div class="flex gap-2">
                                        <button id="view-debug-logs" class="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                                            <i data-lucide="bar-chart-3" class="w-4 h-4 pointer-events-none"></i>${t(
                                              "settings.viewLogs",
                                            )}
                                        </button>
                                        <button id="clear-debug-logs-btn" class="flex-1 py-2 px-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                                            <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>${t(
                                              "settings.clearLogs",
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </details>
                    <details data-section="data" class="group" ${
                      app.state.openSettingsSections.includes("data")
                        ? "open"
                        : ""
                    }>
                        <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                            <span class="text-base font-medium text-gray-200">${t(
                              "settings.dataManagement",
                            )}</span>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                        </summary>
                        <div class="content-wrapper">
                            <div class="content-inner pt-4 space-y-3">
                                <!-- 백업 및 복원 -->
                                <div class="space-y-2">
                                    <button id="backup-data-btn" class="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                                        <i data-lucide="download" class="w-4 h-4"></i> ${t(
                                          "settings.backup",
                                        )}
                                    </button>
                                    <button id="restore-data-btn" class="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                                        <i data-lucide="upload" class="w-4 h-4"></i> ${t(
                                          "settings.restoreData",
                                        )}
                                    </button>
                                </div>
                                
                                <!-- 구분선 -->
                                <div class="border-t border-gray-600"></div>
                                
                                <!-- 데이터 초기화 -->
                                <div class="space-y-2">
                                    <div class="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                                        <div class="flex items-start gap-2">
                                            <i data-lucide="alert-triangle" class="w-4 h-4 text-red-400 mt-0.5 shrink-0"></i>
                                            <div class="text-xs text-gray-300">
                                                <p class="font-medium text-red-400 mb-1">${t(
                                                  "settings.warningNote",
                                                )}</p>
                                                <p>모든 데이터가 삭제됩니다: ${t(
                                                  "settings.resetDataList.allCharacters",
                                                )}, ${t(
                                                  "settings.resetDataList.allChatHistory",
                                                )}, ${t("settings.resetDataList.userSettings")}, ${t(
                                                  "settings.resetDataList.stickerData",
                                                )}, ${t("settings.resetDataList.debugLogs")}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button id="reset-all-data-btn" class="w-full py-2 px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                                        <i data-lucide="trash-2" class="w-4 h-4"></i> ${t(
                                          "settings.resetAllData",
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </details>
                </div>
                <div class="p-6 mt-auto border-t border-gray-700 shrink-0 flex justify-end space-x-3">
                    <button id="close-settings-modal" class="flex-1 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">${t(
                      "settings.cancel",
                    )}</button>
                    <button id="save-settings" class="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">${t(
                      "settings.done",
                    )}</button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Sets up event listeners for the mobile settings modal.
 * Handles debug log viewing, log clearing, advanced settings, and data management events.
 * Implements separation of concerns by separating event handling into dedicated functions.
 * @returns {void}
 */
export function setupSettingsModalEventListeners() {
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

  // Advanced settings event listeners for all providers
  setupAdvancedSettingsEventListeners();

  // Data management event listeners
  setupDataManagementEventListeners();
}

/**
 * Sets up event listeners for advanced settings UI elements.
 * Handles real-time value updates for Max Tokens, Temperature, Profile Max Tokens, and Profile Temperature sliders.
 * @returns {void}
 */
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
  const profileMaxTokensSlider = document.getElementById(
    "settings-profile-max-tokens",
  );
  const profileMaxTokensValue = document.getElementById(
    "profile-max-tokens-value",
  );
  if (profileMaxTokensSlider && profileMaxTokensValue) {
    profileMaxTokensSlider.addEventListener("input", (e) => {
      profileMaxTokensValue.textContent = e.target.value;
    });
  }

  // Profile Temperature slider
  const profileTemperatureSlider = document.getElementById(
    "settings-profile-temperature",
  );
  const profileTemperatureValue = document.getElementById(
    "profile-temperature-value",
  );
  if (profileTemperatureSlider && profileTemperatureValue) {
    profileTemperatureSlider.addEventListener("input", (e) => {
      profileTemperatureValue.textContent = parseFloat(e.target.value).toFixed(
        1,
      );
    });
  }
}

/**
 * Sets up event listeners for data management features.
 * Handles the reset all data button click event with double confirmation process.
 * @returns {void}
 */
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
