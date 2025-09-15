import { t } from "../../../i18n.js";
import { DEFAULT_EMOTIONS, NovelAIClient } from "../../../api/novelai.js";

/**
 * NAI 스티커 자동 생성 설정 패널
 * @param {Object} app - 애플리케이션 인스턴스
 * @returns {string} NAI 설정 패널 HTML
 */
export function renderNAISettingsPanel(app) {
  const { settings } = app.state;
  const naiSettings = settings.naiSettings || {};
  
  const {
    // 기본 API 설정
    apiKey = "",
    
    // 모델 및 크기 설정
    model = "nai-diffusion-4-5-full",
    preferredSize = "square",
    
    // 생성 파라미터
    steps = 28,
    scale = 3,
    sampler = "k_euler_ancestral",
    noise_schedule = "native",
    
    // 고급 설정
    cfg_rescale = 0,
    dynamic_thresholding = false,
    dynamic_thresholding_percentile = 0.999,
    dynamic_thresholding_mimic_scale = 10,
    uncond_scale = 1.0,
    legacy = false,
    add_original_image = false,
    
    // 캐릭터 및 이미지 설정
    useCharacterPrompts = false,
    vibeTransferEnabled = false,
    vibeTransferStrength = 0.6,
    vibeTransferInformationExtracted = 1.0,
    
    // 커스텀 프롬프트
    customPositivePrompt = "",
    customNegativePrompt = "",
    
    // 안전 설정
    minDelay = 20000,
    maxAdditionalDelay = 10000,
  } = naiSettings;

  const isApiKeySet = apiKey && apiKey.trim().length > 0;
  const maskedApiKey = isApiKeySet ? "●".repeat(8) + apiKey.slice(-4) : "";

  return `
    <div class="space-y-6">
      <!-- NAI API 설정 -->
      <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
          <i data-lucide="image" class="w-5 h-5 mr-3 text-purple-400"></i>
          ${t('naiSettings.apiSettings')}
        </h4>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              ${t('naiSettings.apiKey')}
            </label>
            <div class="flex gap-2">
              <input 
                id="nai-api-key" 
                type="password" 
                value="${apiKey}" 
                placeholder="${t('naiSettings.apiKeyPlaceholder')}"
                class="flex-1 px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-purple-500/50 transition-all duration-200"
              >
              <button 
                id="toggle-nai-api-key" 
                type="button"
                class="px-3 py-3 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                title="${t('naiSettings.toggleApiKey')}"
              >
                <i data-lucide="eye" class="w-4 h-4 pointer-events-none"></i>
              </button>
            </div>
            ${isApiKeySet ? 
              `<div class="text-xs text-green-400 mt-1">✓ ${t('naiSettings.apiKeySet', { key: maskedApiKey })}</div>` :
              `<div class="text-xs text-red-400 mt-1">⚠ ${t('naiSettings.apiKeyRequired')}</div>`
            }
            <div class="text-xs text-gray-400 mt-2">
              <a href="https://novelai.net/account" target="_blank" class="text-purple-400 hover:text-purple-300">
                ${t('naiSettings.getApiKeyHint')}
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- 모델 및 생성 설정 -->
      <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
          <i data-lucide="cpu" class="w-5 h-5 mr-3 text-green-400"></i>
          ${t('naiSettings.modelSettings')}
        </h4>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              ${t('naiSettings.model')}
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
              ${t('naiSettings.modelSupportsCharacterPrompts')}
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              ${t('naiSettings.imageSize')}
            </label>
            <select 
              id="nai-preferred-size" 
              class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-green-500/50"
            >
              <option value="square" ${preferredSize === "square" ? "selected" : ""}>
                ${t('naiSettings.sizeSquare')}
              </option>
              <option value="portrait" ${preferredSize === "portrait" ? "selected" : ""}>
                ${t('naiSettings.sizePortrait')}
              </option>
              <option value="landscape" ${preferredSize === "landscape" ? "selected" : ""}>
                ${t('naiSettings.sizeLandscape')}
              </option>
            </select>
            <div class="text-xs text-gray-400 mt-1">
              ${t('naiSettings.unlimitedGeneration')}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                ${t('naiSettings.minDelaySeconds')}
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
                ${t('naiSettings.minDelayDescription')}
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                ${t('naiSettings.additionalRandomSeconds')}
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
                ${t('naiSettings.additionalRandomDescription')}
              </div>
            </div>
          </div>

          <div class="border-t border-gray-600 pt-4"></div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                ${t('naiSettings.generationSteps')}
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
                ${t('naiSettings.promptGuidance')}
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
              ${t('naiSettings.sampler')}
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
              ${t('naiSettings.noiseSchedule')}
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

      <!-- 캐릭터 및 이미지 설정 -->
      <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
          <i data-lucide="user-plus" class="w-5 h-5 mr-3 text-pink-400"></i>
          ${t('naiSettings.characterImageSettings')}
        </h4>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-300">
                ${t('naiSettings.useCharacterPrompts')}
              </label>
              <p class="text-xs text-gray-400 mt-1">
                ${t('naiSettings.characterPromptsDescription')}
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
                ${t('naiSettings.useVibeTransfer')}
              </label>
              <p class="text-xs text-gray-400 mt-1">
                ${t('naiSettings.vibeTransferDescription')}
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
                  ${t('naiSettings.referenceStrength')}
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
                  ${t('naiSettings.informationExtraction')}
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
                ${t('naiSettings.vibeImageUpload')}
              </label>
              <input 
                id="nai-vibe-image-upload" 
                type="file" 
                accept="image/*"
                class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-pink-500/50 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-600 file:text-white hover:file:bg-gray-500"
              >
              <div class="text-xs text-gray-400 mt-1">
                ${t('naiSettings.imageUploadFormats')}
              </div>
            </div>
          ` : ""}
        </div>
      </div>

      <!-- 고급 설정 -->
      <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
          <i data-lucide="settings" class="w-5 h-5 mr-3 text-yellow-400"></i>
          ${t('naiSettings.advancedSettings')}
        </h4>
        
        <div class="space-y-4">
          <!-- SMEA 설정 (v3 모델 전용) -->
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
                  ${t('naiSettings.enableSMEA')}
                </span>
              </label>
              <div class="text-xs text-gray-400 mt-1 ml-6">
                ${t('naiSettings.smeaDescription')}
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
                  ${t('naiSettings.enableSMEADYN')}
                </span>
              </label>
              <div class="text-xs text-gray-400 mt-1 ml-6">
                ${t('naiSettings.smeaDynDescription')}
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                ${t('naiSettings.cfgRescale')}
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
                ${t('naiSettings.unconditionalScale')}
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
                ${t('naiSettings.dynamicThresholding')}
              </label>
              <p class="text-xs text-gray-400 mt-1">
                ${t('naiSettings.dynamicThresholdingDescription')}
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
                  백분위수
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
                  모방 스케일
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
              <span class="text-sm text-gray-300">Legacy 모드</span>
            </label>
            
            <label class="flex items-center cursor-pointer">
              <input 
                id="nai-add-original-image" 
                type="checkbox" 
                ${add_original_image ? "checked" : ""} 
                class="mr-2 rounded border-gray-600 text-yellow-600 focus:ring-yellow-500"
              >
              <span class="text-sm text-gray-300">원본 이미지 추가</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 커스텀 프롬프트 -->
      <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
          <i data-lucide="edit" class="w-5 h-5 mr-3 text-purple-400"></i>
          커스텀 프롬프트
        </h4>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              추가 Positive 프롬프트
            </label>
            <textarea 
              id="nai-custom-positive" 
              placeholder="기본 프롬프트에 추가할 내용을 입력하세요..."
              class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-purple-500/50 resize-none"
              rows="3"
            >${customPositivePrompt}</textarea>
            <div class="text-xs text-gray-400 mt-1">
              캐릭터 프롬프트와 감정 프롬프트에 추가됩니다
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              추가 Negative 프롬프트
            </label>
            <textarea 
              id="nai-custom-negative" 
              placeholder="제외할 요소들을 입력하세요..."
              class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-purple-500/50 resize-none"
              rows="3"
            >${customNegativePrompt}</textarea>
            <div class="text-xs text-gray-400 mt-1">
              기본 negative 프롬프트에 추가됩니다
            </div>
          </div>
        </div>
      </div>

      <!-- NAI 일괄 생성 목록 -->
      <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center justify-between">
          <div class="flex items-center">
            <i data-lucide="smile" class="w-5 h-5 mr-3 text-blue-400"></i>
            ${t('naiHandlers.emotionListTitle')}
          </div>
          <button 
            id="edit-nai-generation-list" 
            class="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1"
          >
            <i data-lucide="edit-3" class="w-3 h-3 pointer-events-none"></i>
            ${t('naiHandlers.editNaiGenerationList')}
          </button>
        </h4>
        
        <!-- 현재 목록 표시 -->
        <div id="nai-generation-list-display" class="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
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
                love: "💕 사랑",
                embarrassed: "😳 부끄러움",
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
        
        <!-- 편집 UI (초기에는 숨겨져 있음) -->
        <div id="nai-generation-list-editor" class="hidden">
          <div class="space-y-4">
            <!-- 현재 목록 편집 -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                ${t('naiHandlers.currentList')}
              </label>
              <div id="nai-editable-list" class="space-y-2 max-h-32 overflow-y-auto">
                <!-- 동적으로 생성되는 목록 -->
              </div>
            </div>
            
            <!-- 새 항목 추가 -->
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  ${t('naiHandlers.itemTitleLabel')}
                </label>
                <input
                  id="new-nai-item-title"
                  type="text"
                  placeholder="${t('naiHandlers.itemTitlePlaceholder')}"
                  class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  ${t('naiHandlers.emotionLabel')}
                </label>
                <input
                  id="new-nai-item-emotion"
                  type="text"
                  placeholder="${t('naiHandlers.emotionPlaceholder')}"
                  class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  ${t('naiHandlers.actionSituationLabel')}
                </label>
                <textarea
                  id="new-nai-item-action"
                  rows="3"
                  placeholder="${t('naiHandlers.actionSituationPlaceholder')}"
                  class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm resize-none"
                ></textarea>
              </div>

              <button
                id="add-nai-item-btn"
                class="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i data-lucide="plus" class="w-4 h-4 pointer-events-none"></i>
                ${t('naiHandlers.addNaiGenerationItem')}
              </button>
            </div>
            
            <!-- 버튼 영역 -->
            <div class="flex gap-2 pt-4 border-t border-gray-600">
              <button 
                id="save-nai-generation-list" 
                class="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i data-lucide="check" class="w-4 h-4 pointer-events-none"></i>
                ${t('naiHandlers.saveList')}
              </button>
              <button 
                id="cancel-edit-nai-generation-list" 
                class="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i data-lucide="x" class="w-4 h-4 pointer-events-none"></i>
                ${t('naiHandlers.cancel')}
              </button>
              <button 
                id="reset-nai-generation-list" 
                class="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i data-lucide="refresh-cw" class="w-4 h-4 pointer-events-none"></i>
                ${t('naiHandlers.resetToDefault')}
              </button>
            </div>
          </div>
        </div>
        
        <div class="text-xs text-gray-400 mt-4">
          ${t('naiHandlers.emotionListInfo')}
        </div>
      </div>

      <!-- 배치 생성 -->
      <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
          <i data-lucide="download" class="w-5 h-5 mr-3 text-green-400"></i>
          배치 생성
        </h4>
        
        <div class="space-y-4">
          <div>
            <button 
              id="generate-all-characters-stickers" 
              class="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              ${!isApiKeySet ? "disabled" : ""}
            >
              <i data-lucide="users" class="w-4 h-4 pointer-events-none"></i>
              ${t('naiHandlers.generateAllCharacterEmotions')}
            </button>
          </div>
          
          ${!isApiKeySet ? 
            `<div class="text-xs text-yellow-400 text-center">
              ⚠ API 키를 설정해야 배치 생성을 사용할 수 있습니다
            </div>` :
            `<div class="text-xs text-gray-400 text-center">
              ${t('naiHandlers.emotionListBatchDescription')}
            </div>`
          }
        </div>
      </div>

      <!-- 생성 통계 -->
      <div class="bg-gray-700/30 rounded-xl p-6" id="nai-stats-container">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
          <i data-lucide="bar-chart-3" class="w-5 h-5 mr-3 text-orange-400"></i>
          생성 통계
        </h4>
        <div id="nai-stats-content">
          <!-- 통계 내용이 여기에 동적으로 삽입됩니다 -->
        </div>
      </div>

      <!-- 도움말 -->
      <div class="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-blue-300 mb-3 flex items-center">
          <i data-lucide="help-circle" class="w-5 h-5 mr-3"></i>
          사용 안내
        </h4>
        <div class="space-y-2 text-sm text-blue-200">
          <p>• NovelAI Persistent API Token이 필요합니다</p>
          <p>• 무제한 생성 크기만 지원: 1024×1024, 832×1216, 1216×832</p>
          <p>• 부정사용 방지를 위해 생성 간 20-30초 대기시간이 적용됩니다</p>
          <p>• 대화 중 감정이 감지되면 자동으로 해당 감정 스티커를 생성합니다</p>
          <p>• 일괄 생성으로 모든 NAI 스티커를 한 번에 만들 수 있습니다</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * NAI 통계 정보를 렌더링
 * @param {Object} app - 애플리케이션 인스턴스
 * @returns {string} 통계 HTML
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
        <div class="text-xs text-gray-400">생성된 스티커</div>
      </div>
      <div class="bg-gray-600/30 rounded-lg p-4 text-center">
        <div class="text-2xl font-bold text-white">${charactersWithGenerated}</div>
        <div class="text-xs text-gray-400">생성된 캐릭터</div>
      </div>
      <div class="bg-gray-600/30 rounded-lg p-4 text-center">
        <div class="text-2xl font-bold text-white">${totalStickers}</div>
        <div class="text-xs text-gray-400">총 스티커 수</div>
      </div>
      <div class="bg-gray-600/30 rounded-lg p-4 text-center">
        <div class="text-2xl font-bold text-white">${generationRate}%</div>
        <div class="text-xs text-gray-400">생성 비율</div>
      </div>
    </div>
    
    ${totalGenerated > 0 ? `
      <div class="mt-4">
        <h5 class="text-sm font-medium text-gray-300 mb-2">캐릭터별 생성 현황</h5>
        <div class="space-y-1 max-h-32 overflow-y-auto">
          ${characters.map(character => {
            const generatedCount = character.stickers ? 
              character.stickers.filter(s => s.generated).length : 0;
            if (generatedCount === 0) return '';
            
            return `
              <div class="flex justify-between text-xs">
                <span class="text-gray-300">${character.name}</span>
                <span class="text-gray-400">${generatedCount}개</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : ''}
  `;
}