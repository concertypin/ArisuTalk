import { t } from "../../../i18n.js";
import { DEFAULT_EMOTIONS, NovelAIClient } from "../../../api/novelai.js";

/**
 * NAI Sticker Auto-Generation Settings Panel
 * @param {Object} app - Application instance
 * @returns {string} NAI settings panel HTML
 */
export function renderNAISettingsPanel(app) {
  const { settings } = app.state;
  const naiSettings = settings.naiSettings || {};
  
  const {
    // Basic API settings
    apiKey = "",
    
    // Model and size settings
    model = "nai-diffusion-4-5-full",
    preferredSize = "square",
    
    // Generation parameters
    steps = 28,
    scale = 3,
    sampler = "k_euler_ancestral",
    noise_schedule = "native",
    
    // Advanced settings
    cfg_rescale = 0,
    dynamic_thresholding = false,
    dynamic_thresholding_percentile = 0.999,
    dynamic_thresholding_mimic_scale = 10,
    uncond_scale = 1.0,
    legacy = false,
    add_original_image = false,
    
    // Character and image settings
    useCharacterPrompts = false,
    vibeTransferEnabled = false,
    vibeTransferStrength = 0.6,
    vibeTransferInformationExtracted = 1.0,
    
    // Custom prompts
    customPositivePrompt = "",
    customNegativePrompt = "",
    
    // Safety settings
    minDelay = 20000,
    maxAdditionalDelay = 10000,
  } = naiSettings;

  const isApiKeySet = apiKey && apiKey.trim().length > 0;
  const maskedApiKey = isApiKeySet ? "●".repeat(8) + apiKey.slice(-4) : "";

  return `
    <div class="space-y-6">
      <!-- NAI API Settings -->
      <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
          <i data-lucide="image" class="w-5 h-5 mr-3 text-purple-400"></i>
          ${t("naiSettings.apiSettingsTitle")}
        </h4>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              ${t("naiSettings.apiKey")}
            </label>
            <div class="flex gap-2">
              <input 
                id="nai-api-key" 
                type="password" 
                value="${apiKey}" 
                placeholder="${t("naiSettings.apiKeyPlaceholder")}"
                class="flex-1 px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-purple-500/50 transition-all duration-200"
              >
              <button 
                id="toggle-nai-api-key" 
                type="button"
                class="px-3 py-3 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                title="${t("naiSettings.apiKeyToggle")}"
              >
                <i data-lucide="eye" class="w-4 h-4 pointer-events-none"></i>
              </button>
            </div>
            ${isApiKeySet ? 
              `<div class="text-xs text-green-400 mt-1">${t("naiSettings.apiKeySet", { maskedKey: maskedApiKey })}</div>` :
              `<div class="text-xs text-red-400 mt-1">${t("naiSettings.apiKeyRequired")}</div>`
            }
            <div class="text-xs text-gray-400 mt-2">
              <a href="https://novelai.net/account" target="_blank" class="text-purple-400 hover:text-purple-300">
                ${t("naiSettings.apiKeyHelp")}
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Model and Generation Settings -->
      <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
          <i data-lucide="cpu" class="w-5 h-5 mr-3 text-green-400"></i>
          ${t("naiSettings.modelSettingsTitle")}
        </h4>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              ${t("naiSettings.model")}
            </label>
            <select 
              id="nai-model" 
              class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-green-500/50"
            >
              ${Object.entries(NovelAIClient.MODELS).map(([modelId, modelInfo]) => `
                <option value="${modelId}" ${model === modelId ? "selected" : ""}>
                  ${modelInfo.name} (${modelInfo.version})
                </option>
              `).join("")}
            </select>
            <div class="text-xs text-gray-400 mt-1">
              ${t("naiSettings.modelHelp")}
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              ${t("naiSettings.imageSize")}
            </label>
            <select 
              id="nai-preferred-size" 
              class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-green-500/50"
            >
              <option value="square" ${preferredSize === "square" ? "selected" : ""}>
                ${t("naiSettings.imageSizeSquare")}
              </option>
              <option value="portrait" ${preferredSize === "portrait" ? "selected" : ""}>
                ${t("naiSettings.imageSizePortrait")}
              </option>
              <option value="landscape" ${preferredSize === "landscape" ? "selected" : ""}>
                ${t("naiSettings.imageSizeLandscape")}
              </option>
            </select>
            <div class="text-xs text-gray-400 mt-1">
              ${t("naiSettings.imageSizeHelp")}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                ${t("naiSettings.minDelayTime")}
              </label>
              <input 
                id="nai-min-delay" 
                type="number" 
                min="10" 
                max="60" 
                value="${minDelay / 1000}"
                class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-green-500/50"
              >
              <div class="text-xs text-gray-400 mt-1">
                ${t("naiSettings.minDelayHelp")}
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                ${t("naiSettings.maxAdditionalTime")}
              </label>
              <input 
                id="nai-max-additional-delay" 
                type="number" 
                min="0" 
                max="30" 
                value="${maxAdditionalDelay / 1000}"
                class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-green-500/50"
              >
              <div class="text-xs text-gray-400 mt-1">
                ${t("naiSettings.maxAdditionalHelp")}
              </div>
            </div>
          </div>

          <div class="border-t border-gray-600 pt-4"></div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                ${t("naiSettings.steps")}
              </label>
              <input 
                id="nai-steps" 
                type="range" 
                min="1" 
                max="50" 
                value="${steps}"
                class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              >
              <div class="flex justify-between text-xs text-gray-400 mt-1">
                <span>1</span>
                <span id="nai-steps-value">${steps}</span>
                <span>50</span>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                ${t("naiSettings.scale")}
              </label>
              <input 
                id="nai-scale" 
                type="range" 
                min="1" 
                max="30" 
                step="0.5"
                value="${scale}"
                class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
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
              ${t("naiSettings.sampler")}
            </label>
            <select 
              id="nai-sampler" 
              class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-green-500/50"
            >
              ${NovelAIClient.SAMPLERS.map(samplerOption => `
                <option value="${samplerOption}" ${sampler === samplerOption ? "selected" : ""}>
                  ${samplerOption.replace(/_/g, " ").toUpperCase()}
                </option>
              `).join("")}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              ${t("naiSettings.noiseSchedule")}
            </label>
            <select 
              id="nai-noise-schedule" 
              class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-green-500/50"
            >
              ${NovelAIClient.NOISE_SCHEDULES.map(schedule => `
                <option value="${schedule}" ${noise_schedule === schedule ? "selected" : ""}>
                  ${schedule.charAt(0).toUpperCase() + schedule.slice(1)}
                </option>
              `).join("")}
            </select>
          </div>
        </div>
      </div>

      <!-- Character and Image Settings -->
      <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
          <i data-lucide="user-plus" class="w-5 h-5 mr-3 text-pink-400"></i>
          ${t("naiSettings.characterImageSettingsTitle")}
        </h4>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-300">
                ${t("naiSettings.useCharacterPrompts")}
              </label>
              <p class="text-xs text-gray-400 mt-1">
                ${t("naiSettings.useCharacterPromptsHelp")}
              </p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                id="nai-use-character-prompts" 
                type="checkbox" 
                ${useCharacterPrompts ? "checked" : ""} 
                class="sr-only peer"
              >
              <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pink-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
            </label>
          </div>

          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-300">
                ${t("naiSettings.vibeTransfer")}
              </label>
              <p class="text-xs text-gray-400 mt-1">
                ${t("naiSettings.vibeTransferHelp")}
              </p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                id="nai-vibe-transfer-enabled" 
                type="checkbox" 
                ${vibeTransferEnabled ? "checked" : ""} 
                class="sr-only peer"
              >
              <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pink-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
            </label>
          </div>

          ${vibeTransferEnabled ? `
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  ${t("naiSettings.vibeStrength")}
                </label>
                <input 
                  id="nai-vibe-strength" 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1"
                  value="${vibeTransferStrength}"
                  class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                >
                <div class="text-xs text-gray-400 mt-1 text-center">
                  <span id="nai-vibe-strength-value">${vibeTransferStrength}</span>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  ${t("naiSettings.vibeInfoExtracted")}
                </label>
                <input 
                  id="nai-vibe-info-extracted" 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1"
                  value="${vibeTransferInformationExtracted}"
                  class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                >
                <div class="text-xs text-gray-400 mt-1 text-center">
                  <span id="nai-vibe-info-value">${vibeTransferInformationExtracted}</span>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                ${t("naiSettings.vibeImageUpload")}
              </label>
              <input 
                id="nai-vibe-image-upload" 
                type="file" 
                accept="image/*"
                class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-pink-500/50 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-600 file:text-white hover:file:bg-gray-500"
              >
              <div class="text-xs text-gray-400 mt-1">
                ${t("naiSettings.vibeImageHelp")}
              </div>
            </div>
          ` : ""}
        </div>
      </div>

      <!-- Advanced Settings -->
      <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
          <i data-lucide="settings" class="w-5 h-5 mr-3 text-yellow-400"></i>
          ${t("naiSettings.advancedSettingsTitle")}
        </h4>
        
        <div class="space-y-4">
          <!-- SMEA Settings (v3 models only) -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input 
                  id="nai-sm" 
                  type="checkbox" 
                  ${settings.sm ? 'checked' : ''}
                  class="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                >
                <span class="text-sm font-medium text-gray-300">
                  ${t("naiSettings.smeaEnable")}
                </span>
              </label>
              <div class="text-xs text-gray-400 mt-1 ml-6">
                ${t("naiSettings.smeaHelp")}
              </div>
            </div>
            
            <div>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input 
                  id="nai-sm-dyn" 
                  type="checkbox" 
                  ${settings.sm_dyn ? 'checked' : ''}
                  class="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                >
                <span class="text-sm font-medium text-gray-300">
                  ${t("naiSettings.smeaDynEnable")}
                </span>
              </label>
              <div class="text-xs text-gray-400 mt-1 ml-6">
                ${t("naiSettings.smeaDynHelp")}
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                ${t("naiSettings.cfgRescale")}
              </label>
              <input 
                id="nai-cfg-rescale" 
                type="range" 
                min="0" 
                max="1" 
                step="0.05"
                value="${cfg_rescale}"
                class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              >
              <div class="text-xs text-gray-400 mt-1 text-center">
                <span id="nai-cfg-rescale-value">${cfg_rescale}</span>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                ${t("naiSettings.uncondScale")}
              </label>
              <input 
                id="nai-uncond-scale" 
                type="range" 
                min="0" 
                max="2" 
                step="0.1"
                value="${uncond_scale}"
                class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              >
              <div class="text-xs text-gray-400 mt-1 text-center">
                <span id="nai-uncond-scale-value">${uncond_scale}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-300">
                ${t("naiSettings.dynamicThresholding")}
              </label>
              <p class="text-xs text-gray-400 mt-1">
                ${t("naiSettings.dynamicThresholdingHelp")}
              </p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                id="nai-dynamic-thresholding" 
                type="checkbox" 
                ${dynamic_thresholding ? "checked" : ""} 
                class="sr-only peer"
              >
              <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
            </label>
          </div>

          ${dynamic_thresholding ? `
            <div class="grid grid-cols-2 gap-4 pl-4 border-l-2 border-yellow-500/30">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  ${t("naiSettings.dtPercentile")}
                </label>
                <input 
                  id="nai-dt-percentile" 
                  type="range" 
                  min="0.9" 
                  max="1" 
                  step="0.001"
                  value="${dynamic_thresholding_percentile}"
                  class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                >
                <div class="text-xs text-gray-400 mt-1 text-center">
                  <span id="nai-dt-percentile-value">${dynamic_thresholding_percentile}</span>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  ${t("naiSettings.dtMimicScale")}
                </label>
                <input 
                  id="nai-dt-mimic-scale" 
                  type="range" 
                  min="1" 
                  max="20" 
                  step="0.5"
                  value="${dynamic_thresholding_mimic_scale}"
                  class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                >
                <div class="text-xs text-gray-400 mt-1 text-center">
                  <span id="nai-dt-mimic-scale-value">${dynamic_thresholding_mimic_scale}</span>
                </div>
              </div>
            </div>
          ` : ""}

          <div class="flex flex-wrap gap-4">
            <label class="flex items-center cursor-pointer">
              <input 
                id="nai-legacy" 
                type="checkbox" 
                ${legacy ? "checked" : ""} 
                class="mr-2 rounded border-gray-600 text-yellow-600 focus:ring-yellow-500"
              >
              <span class="text-sm text-gray-300">${t("naiSettings.legacyMode")}</span>
            </label>
            
            <label class="flex items-center cursor-pointer">
              <input 
                id="nai-add-original-image" 
                type="checkbox" 
                ${add_original_image ? "checked" : ""} 
                class="mr-2 rounded border-gray-600 text-yellow-600 focus:ring-yellow-500"
              >
              <span class="text-sm text-gray-300">${t("naiSettings.addOriginalImage")}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 커스텀 프롬프트 -->
      <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
          <i data-lucide="edit" class="w-5 h-5 mr-3 text-purple-400"></i>
          ${t("naiSettings.customPromptsTitle")}
        </h4>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              ${t("naiSettings.customPositive")}
            </label>
            <textarea 
              id="nai-custom-positive" 
              placeholder="${t("naiSettings.customPositivePlaceholder")}"
              class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-purple-500/50 resize-none"
              rows="3"
            >${customPositivePrompt}</textarea>
            <div class="text-xs text-gray-400 mt-1">
              ${t("naiSettings.customPositiveHelp")}
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              ${t("naiSettings.customNegative")}
            </label>
            <textarea 
              id="nai-custom-negative" 
              placeholder="${t("naiSettings.customNegativePlaceholder")}"
              class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-purple-500/50 resize-none"
              rows="3"
            >${customNegativePrompt}</textarea>
            <div class="text-xs text-gray-400 mt-1">
              ${t("naiSettings.customNegativeHelp")}
            </div>
          </div>
        </div>
      </div>

      <!-- 기본 감정 목록 -->
      <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center justify-between">
          <div class="flex items-center">
            <i data-lucide="smile" class="w-5 h-5 mr-3 text-blue-400"></i>
            ${t("naiSettings.naiGenerationListTitle")}
          </div>
          <button id="edit-nai-list" class="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors">
            ${t("naiHandlers.editList")}
          </button>
        </h4>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
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
                love: "😍 사랑",
                embarrassed: "😳 당황",
                confused: "😕 혼란",
                sleepy: "😴 졸림",
                excited: "🤩 흥분",
                neutral: "😐 무표정"
              };
              displayText = emotionLabels[item] || item;
            }

            return `
              <div class="bg-gray-600/50 rounded-lg px-3 py-2 text-center">
                <span class="text-xs text-gray-300">${displayText}</span>
              </div>
            `;
          }).join("")}
        </div>

        <!-- 편집 모드 인터페이스 -->
        <div id="nai-list-editor" class="hidden mt-6 bg-gray-800/50 rounded-lg p-4">
          <h5 class="text-white font-medium mb-4">${t("naiHandlers.editingMode")}</h5>

          <!-- 새 항목 추가 -->
          <div class="mb-4 p-4 bg-gray-700/50 rounded-lg">
            <h6 class="text-sm font-medium text-gray-300 mb-3">${t("naiHandlers.addNewItem")}</h6>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label class="block text-xs text-gray-400 mb-1">${t("naiHandlers.title")}</label>
                <input type="text" id="new-item-title" placeholder="${t("naiHandlers.titlePlaceholder")}"
                       class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-sm border-0 focus:ring-2 focus:ring-blue-500/50">
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1">${t("naiHandlers.emotion")}</label>
                <input type="text" id="new-item-emotion" placeholder="${t("naiHandlers.emotionPlaceholder")}"
                       class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-sm border-0 focus:ring-2 focus:ring-blue-500/50">
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1">${t("naiHandlers.action")}</label>
                <input type="text" id="new-item-action" placeholder="${t("naiHandlers.actionPlaceholder")}"
                       class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-sm border-0 focus:ring-2 focus:ring-blue-500/50">
              </div>
            </div>
            <button id="add-nai-item" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors">
              ${t("naiHandlers.addItem")}
            </button>
          </div>

          <!-- 기존 항목 목록 -->
          <div id="editable-nai-list" class="space-y-2 mb-4">
            <!-- 동적으로 채워짐 -->
          </div>

          <!-- 버튼 -->
          <div class="flex gap-2">
            <button id="save-nai-list" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
              ${t("naiHandlers.saveChanges")}
            </button>
            <button id="cancel-edit-nai-list" class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors">
              ${t("naiHandlers.cancelEdit")}
            </button>
          </div>
        </div>

        <div class="text-xs text-gray-400">
          ${t("naiSettings.emotionStickersHelp")}
        </div>
      </div>

      <!-- Batch Generation -->
      <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
          <i data-lucide="download" class="w-5 h-5 mr-3 text-green-400"></i>
          ${t("naiSettings.batchGenerationTitle")}
        </h4>
        
        <div class="space-y-4">
          <div>
            <button 
              id="generate-all-characters-stickers" 
              class="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              ${!isApiKeySet ? "disabled" : ""}
            >
              <i data-lucide="users" class="w-4 h-4 pointer-events-none"></i>
              ${t("naiSettings.generateAllCharacters")}
            </button>
          </div>
          
          ${!isApiKeySet ? 
            `<div class="text-xs text-yellow-400 text-center">
              ${t("naiSettings.batchGenerationDisabled")}
            </div>` :
            `<div class="text-xs text-gray-400 text-center">
              ${t("naiSettings.batchGenerationHelp")}
            </div>`
          }
        </div>
      </div>

      <!-- Generation Statistics -->
      <div class="bg-gray-700/30 rounded-xl p-6" id="nai-stats-container">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
          <i data-lucide="bar-chart-3" class="w-5 h-5 mr-3 text-orange-400"></i>
          ${t("naiSettings.statsTitle")}
        </h4>
        <div id="nai-stats-content">
          <!-- Statistics content will be dynamically inserted here -->
        </div>
      </div>

      <!-- Help Guide -->
      <div class="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-blue-300 mb-3 flex items-center">
          <i data-lucide="help-circle" class="w-5 h-5 mr-3"></i>
          ${t("naiSettings.helpTitle")}
        </h4>
        <div class="space-y-2 text-sm text-blue-200">
          <p>${t("naiSettings.helpApiKey")}</p>
          <p>${t("naiSettings.helpImageSizes")}</p>
          <p>${t("naiSettings.helpDelay")}</p>
          <p>${t("naiSettings.helpAutoGeneration")}</p>
          <p>${t("naiSettings.helpBatchGeneration")}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders NAI statistics information
 * @param {Object} app - Application instance
 * @returns {string} Statistics HTML
 */
export function renderNAIStats(app) {
  const characters = app.state.characters || [];
  let totalGenerated = 0;
  let charactersWithGenerated = 0;
  let totalStickers = 0;

  characters.forEach(character => {
    if (character.stickers && character.stickers.length > 0) {
      totalStickers += character.stickers.length;
      const generatedStickers = character.stickers.filter(s => s.generated);
      totalGenerated += generatedStickers.length;
      if (generatedStickers.length > 0) {
        charactersWithGenerated++;
      }
    }
  });

  const generationRate = totalStickers > 0 ? (totalGenerated / totalStickers * 100).toFixed(1) : 0;

  return `
    <div class="grid grid-cols-2 gap-4">
      <div class="bg-gray-600/30 rounded-lg p-4 text-center">
        <div class="text-2xl font-bold text-white">${totalGenerated}</div>
        <div class="text-xs text-gray-400">${t("naiSettings.generatedStickers")}</div>
      </div>
      <div class="bg-gray-600/30 rounded-lg p-4 text-center">
        <div class="text-2xl font-bold text-white">${charactersWithGenerated}</div>
        <div class="text-xs text-gray-400">${t("naiSettings.generatedCharacters")}</div>
      </div>
      <div class="bg-gray-600/30 rounded-lg p-4 text-center">
        <div class="text-2xl font-bold text-white">${totalStickers}</div>
        <div class="text-xs text-gray-400">${t("naiSettings.totalStickers")}</div>
      </div>
      <div class="bg-gray-600/30 rounded-lg p-4 text-center">
        <div class="text-2xl font-bold text-white">${generationRate}%</div>
        <div class="text-xs text-gray-400">${t("naiSettings.generationRate")}</div>
      </div>
    </div>
    
    ${totalGenerated > 0 ? `
      <div class="mt-4">
        <h5 class="text-sm font-medium text-gray-300 mb-2">${t("naiSettings.characterStats")}</h5>
        <div class="space-y-1 max-h-32 overflow-y-auto">
          ${characters.map(character => {
            const generatedCount = character.stickers ? 
              character.stickers.filter(s => s.generated).length : 0;
            if (generatedCount === 0) return '';
            
            return `
              <div class="flex justify-between text-xs">
                <span class="text-gray-300">${character.name}</span>
                <span class="text-gray-400">${t("naiSettings.stickerCount", { count: generatedCount })}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : ''}
  `;
}