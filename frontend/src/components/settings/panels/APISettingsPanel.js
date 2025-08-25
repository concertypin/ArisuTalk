import { renderProviderConfig } from "../../MobileSettingsModal.js";
import {
  PROVIDERS,
  PROVIDER_MODELS,
  DEFAULT_PROVIDER,
} from "../../../constants/providers.js";
import { t } from "../../../i18n.js";

/**
 * API 설정 패널 렌더링
 * @param {Object} app - 애플리케이션 인스턴스
 * @returns {string} API 설정 패널 HTML
 */
export function renderAPISettingsPanel(app) {
  const { settings } = app.state;
  const provider = settings.apiProvider || DEFAULT_PROVIDER;
  const config = settings.apiConfigs?.[provider];

  // 레거시 호환성 처리
  let providerConfig = config;
  if (!config && provider === PROVIDERS.GEMINI) {
    providerConfig = {
      apiKey: settings.apiKey || "",
      model: settings.model || "gemini-2.5-flash",
      customModels: [],
    };
  }

  if (!providerConfig) {
    providerConfig = {
      apiKey: "",
      model: "",
      customModels: [],
      baseUrl: provider === PROVIDERS.CUSTOM_OPENAI ? "" : undefined,
    };
  }

  return `
        <div class="space-y-6">
            <!-- API 제공업체 선택 -->
            <div class="bg-gray-700/30 rounded-xl p-6">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <i data-lucide="globe" class="w-5 h-5 mr-3 text-blue-400"></i>
                    ${t("settings.aiProvider")}
                </h4>
                <select id="settings-api-provider" class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200">
                    <option value="gemini" ${
                      provider === "gemini" ? "selected" : ""
                    }>Google Gemini</option>
                    <option value="claude" ${
                      provider === "claude" ? "selected" : ""
                    }>Anthropic Claude</option>
                    <option value="openai" ${
                      provider === "openai" ? "selected" : ""
                    }>OpenAI ChatGPT</option>
                    <option value="grok" ${
                      provider === "grok" ? "selected" : ""
                    }>xAI Grok</option>
                    <option value="openrouter" ${
                      provider === "openrouter" ? "selected" : ""
                    }>OpenRouter</option>
                    <option value="custom_openai" ${
                      provider === "custom_openai" ? "selected" : ""
                    }>Custom OpenAI</option>
                </select>
            </div>

            <!-- 현재 제공업체 설정 -->
            <div class="bg-gray-700/30 rounded-xl p-6">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <i data-lucide="settings" class="w-5 h-5 mr-3 text-blue-400"></i>
                    ${getProviderDisplayName(provider)} ${t(
    "settings.providerSettings"
  )}
                </h4>
                <div class="provider-settings-container">
                    ${renderProviderConfig(provider, providerConfig)}
                </div>
            </div>

            <!-- 프롬프트 설정 -->
            <div class="bg-gray-700/30 rounded-xl p-6">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <i data-lucide="file-pen-line" class="w-5 h-5 mr-3 text-blue-400"></i>
                    ${t("settings.promptManagement")}
                </h4>
                <p class="text-gray-300 text-sm mb-4">${t(
                  "settings.promptInfo"
                )}</p>
                <button id="open-prompt-modal" class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center justify-center gap-2">
                    <i data-lucide="edit" class="w-4 h-4"></i>
                    ${t("settings.editPrompt")}
                </button>
            </div>
        </div>
    `;
}

/**
 * 제공업체 표시 이름 반환
 * @param {string} provider - 제공업체 코드
 * @returns {string} 표시 이름
 */
function getProviderDisplayName(provider) {
  const displayNames = {
    gemini: "Google Gemini",
    claude: "Anthropic Claude",
    openai: "OpenAI ChatGPT",
    grok: "xAI Grok",
    openrouter: "OpenRouter",
    custom_openai: "Custom OpenAI",
  };
  return displayNames[provider] || provider;
}
