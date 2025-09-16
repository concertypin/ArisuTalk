import { t } from "../i18n.js";
import { extractExifData, formatExifInfo, extractRerollInfo } from "../utils/exifUtils.js";

/**
 * 스티커 미리보기 및 편집 모달 컴포넌트 (탭 시스템)
 * @param {Object} stickerData - 스티커 데이터 { isOpen, sticker, index, activeTab, exifData, rerollData }
 * @returns {string} 스티커 미리보기 모달 HTML
 */
export function renderStickerPreviewModal(stickerData) {
  if (!stickerData || !stickerData.isOpen || !stickerData.sticker) {
    return "";
  }

  const { sticker, index, activeTab = 'preview', exifData = null, rerollData = null, rerollResult = null, rerolling = false } = stickerData;
  const isVideo = sticker.type && (
    sticker.type.startsWith("video/") ||
    sticker.type === "video/mp4" ||
    sticker.type === "video/webm"
  );
  const isAudio = sticker.type && sticker.type.startsWith("audio/");
  const isImage = !isVideo && !isAudio;

  // 미디어 미리보기 컨텐츠
  let mediaContent = "";
  if (isAudio) {
    mediaContent = `
      <div class="w-full h-64 bg-gray-600 rounded-lg flex flex-col items-center justify-center">
        <i data-lucide="music" class="w-16 h-16 text-gray-300 mb-4"></i>
        <audio controls class="w-full max-w-xs">
          <source src="${sticker.dataUrl}" type="${sticker.type}">
        </audio>
      </div>
    `;
  } else if (isVideo) {
    mediaContent = `
      <div class="flex justify-center">
        <video controls class="max-w-full max-h-64 rounded-lg">
          <source src="${sticker.dataUrl}" type="${sticker.type}">
        </video>
      </div>
    `;
  } else {
    mediaContent = `
      <div class="flex justify-center">
        <img src="${sticker.dataUrl}" alt="${sticker.name}" class="max-w-full max-h-64 rounded-lg object-contain">
      </div>
    `;
  }

  // 탭 헤더
  const tabHeader = `
    <div class="flex border-b border-gray-600 mb-4">
      <button 
        id="tab-preview" 
        data-tab="preview"
        class="px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'preview' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}"
      >
        ${t('stickerPreview.tabs.preview')}
      </button>
      ${isImage ? `
        <button 
          id="tab-exif" 
          data-tab="exif"
          class="px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'exif' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}"
        >
          ${t('stickerPreview.tabs.exif')}
        </button>
        ${exifData && exifData.nai && exifData.nai.prompt ? `
          <button 
            id="tab-reroll" 
            data-tab="reroll"
            class="px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'reroll' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}"
          >
            ${t('stickerPreview.tabs.reroll')}
          </button>
        ` : ''}
      ` : ''}
      <button 
        id="tab-actions" 
        data-tab="actions"
        class="px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'actions' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}"
      >
        ${t('stickerPreview.tabs.actions')}
      </button>
    </div>
  `;

  // 탭 컨텐츠
  let tabContent = "";
  switch (activeTab) {
    case 'preview':
      tabContent = renderPreviewTab(sticker, mediaContent);
      break;
    case 'exif':
      tabContent = renderExifTab(exifData);
      break;
    case 'reroll':
      tabContent = renderRerollTab(rerollData, index, rerollResult, rerolling, sticker);
      break;
    case 'actions':
      tabContent = renderActionsTab(sticker, index);
      break;
  }

  return `
    <!-- 확장된 스티커 미리보기 모달 -->
    <div id="sticker-preview-modal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
      <div class="bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <!-- 모달 헤더 -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-white">${t('stickerPreview.title')}</h3>
          <button id="close-sticker-preview-modal" class="p-2 text-gray-400 hover:text-white transition-colors">
            <i data-lucide="x" class="w-5 h-5 pointer-events-none"></i>
          </button>
        </div>

        <!-- 탭 헤더 -->
        ${tabHeader}

        <!-- 탭 컨텐츠 -->
        <div id="tab-content">
          ${tabContent}
        </div>
      </div>
    </div>
  `;
}

/**
 * 미리보기 탭 렌더링
 */
function renderPreviewTab(sticker, mediaContent) {
  return `
    <!-- 미디어 미리보기 -->
    <div class="mb-6">
      ${mediaContent}
    </div>

    <!-- 스티커 정보 편집 -->
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          ${t('stickerPreview.stickerName')}
        </label>
        <input 
          id="sticker-name-input" 
          type="text" 
          value="${sticker.name || ''}" 
          class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm"
          placeholder="${t('stickerPreview.enterStickerName')}"
        >
      </div>

      <!-- 스티커 타입 정보 -->
      <div class="text-xs text-gray-400 space-y-1">
        <div>${t('stickerPreview.fileType')}: ${sticker.type || 'Unknown'}</div>
        ${sticker.size ? `<div>${t('stickerPreview.fileSize')}: ${formatStickerSize(sticker.size)}</div>` : ''}
        ${sticker.timestamp ? `<div>${t('stickerPreview.dateAdded')}: ${new Date(sticker.timestamp).toLocaleString()}</div>` : ''}
      </div>
    </div>

    <!-- 저장 버튼 -->
    <div class="flex gap-3 mt-6">
      <button 
        id="save-sticker-name" 
        data-index="${sticker.index || 0}"
        class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
      >
        ${t('common.save')}
      </button>
    </div>
  `;
}

/**
 * EXIF 정보 탭 렌더링
 */
function renderExifTab(exifData) {
  if (!exifData) {
    return `
      <div class="text-center py-8">
        <i data-lucide="loader" class="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin"></i>
        <p class="text-gray-400">${t('stickerPreview.loadingExif')}</p>
      </div>
    `;
  }

  if (!exifData.basic && !exifData.nai && !exifData.raw) {
    return `
      <div class="text-center py-8">
        <i data-lucide="info" class="w-8 h-8 text-gray-400 mx-auto mb-2"></i>
        <p class="text-gray-400">${t('stickerPreview.noExifData')}</p>
      </div>
    `;
  }

  let content = `<div class="space-y-4">`;

  // NAI 생성 정보 (우선 표시)
  if (exifData.nai && Object.keys(exifData.nai).length > 0) {
    content += `
      <div>
        <h4 class="text-sm font-medium text-white mb-2">${t('stickerPreview.naiInfo')}</h4>
        <div class="bg-gray-700 rounded-lg p-3 space-y-3 text-xs">
          ${exifData.nai.prompt ? `
            <div>
              <span class="text-gray-300 block mb-1">${t('stickerPreview.prompt')}:</span>
              <div class="bg-gray-600 rounded p-2 text-white text-xs max-h-32 overflow-y-auto">${exifData.nai.prompt}</div>
            </div>
          ` : ''}
          ${exifData.nai.negativePrompt ? `
            <div>
              <span class="text-gray-300 block mb-1">${t('stickerPreview.negativePrompt')}:</span>
              <div class="bg-gray-600 rounded p-2 text-white text-xs max-h-24 overflow-y-auto">${exifData.nai.negativePrompt}</div>
            </div>
          ` : ''}
          ${Object.entries(exifData.nai).filter(([key]) => !['prompt', 'negativePrompt'].includes(key)).map(([key, value]) => 
            `<div class="flex justify-between">
              <span class="text-gray-300">${key}:</span>
              <span class="text-white">${value}</span>
            </div>`
          ).join('')}
        </div>
      </div>
    `;
  }

  // 전체 메타데이터 섹션 (접을 수 있는 형태)
  const allMetadata = exifData.raw || {};
  if (Object.keys(allMetadata).length > 0) {
    content += `
      <div>
        <details class="group">
          <summary class="cursor-pointer text-sm font-medium text-white mb-2 flex items-center">
            <i data-lucide="chevron-right" class="w-4 h-4 mr-1 transition-transform group-open:rotate-90"></i>
            ${t('stickerPreview.allMetadata')}
          </summary>
          <div class="bg-gray-700 rounded-lg p-3 mt-2 space-y-2 text-xs max-h-96 overflow-y-auto">
            ${Object.entries(allMetadata).map(([key, value]) => {
              // 전체 값을 표시 (길이 제한 없음)
              const displayValue = String(value);

              return `<div class="border-b border-gray-600 pb-2 last:border-b-0">
                <div class="text-gray-300 font-medium mb-1">${key}:</div>
                <div class="text-white break-all whitespace-pre-wrap">${displayValue}</div>
              </div>`;
            }).join('')}
          </div>
        </details>
      </div>
    `;
  }

  content += `</div>`;
  return content;
}

/**
 * 리롤 탭 렌더링
 */
function renderRerollTab(rerollData, index, rerollResult = null, rerolling = false, currentSticker = null) {
  if (!rerollData) {
    return `
      <div class="text-center py-8">
        <i data-lucide="refresh-cw" class="w-8 h-8 text-gray-400 mx-auto mb-2"></i>
        <p class="text-gray-400">${t('stickerPreview.noRerollData')}</p>
      </div>
    `;
  }

  // 현재 이미지 크기를 기반으로 기본값 결정
  let defaultSize = 'square';
  if (currentSticker && currentSticker.dataUrl) {
    const img = new Image();
    img.src = currentSticker.dataUrl;
    // 동기적으로 처리 (이미 로드된 이미지이므로 가능)
    if (img.width && img.height) {
      const ratio = img.width / img.height;
      if (ratio < 0.9) {
        defaultSize = 'portrait';  // 세로가 더 긴 경우
      } else if (ratio > 1.1) {
        defaultSize = 'landscape'; // 가로가 더 긴 경우
      } else {
        defaultSize = 'square';    // 거의 정사각형인 경우
      }
    }
  }

  return `
    <div class="space-y-4">
      <!-- 이미지 비교 섹션 (맨 위) -->
      ${rerollResult ? `
        <div id="reroll-comparison">
          <h4 class="text-sm font-medium text-white mb-2">${t('stickerPreview.imageComparison')}</h4>
          <div class="grid grid-cols-2 gap-4">
            <!-- 현재 이미지 -->
            <div class="bg-gray-700 rounded-lg p-3">
              <div class="text-xs text-gray-300 mb-2 text-center">${t('stickerPreview.currentImage')}</div>
              <div class="flex justify-center">
                <div class="max-w-full">
                  ${currentSticker ? `<img src="${currentSticker.dataUrl}" alt="${currentSticker.name}" class="max-w-full rounded-lg">` : ''}
                </div>
              </div>
            </div>

            <!-- 리롤 결과 -->
            <div class="bg-gray-700 rounded-lg p-3">
              <div class="text-xs text-gray-300 mb-2 text-center">${t('stickerPreview.rerollResult')}</div>
              <div class="flex justify-center">
                <div class="max-w-full">
                  <img src="${rerollResult.dataUrl}" alt="${rerollResult.name}" class="max-w-full rounded-lg">
                </div>
              </div>
            </div>
          </div>

          <!-- 선택 버튼 -->
          <div class="flex gap-2 mt-4">
            <button
              id="select-original"
              data-index="${index}"
              class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              <i data-lucide="arrow-left" class="w-4 h-4 mr-2 pointer-events-none"></i>
              ${t('stickerPreview.selectOriginal')}
            </button>
            <button
              id="select-reroll"
              data-index="${index}"
              class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
            >
              <i data-lucide="arrow-right" class="w-4 h-4 mr-2 pointer-events-none"></i>
              ${t('stickerPreview.selectReroll')}
            </button>
          </div>
        </div>
      ` : `
        <!-- 현재 이미지만 표시 (리롤 전) -->
        <div>
          <h4 class="text-sm font-medium text-white mb-2">${t('stickerPreview.currentImage')}</h4>
          <div class="bg-gray-700 rounded-lg p-3">
            <div class="flex justify-center">
              <div class="max-w-xs">
                ${currentSticker ? `<img src="${currentSticker.dataUrl}" alt="${currentSticker.name}" class="max-w-full rounded-lg">` : ''}
              </div>
            </div>
          </div>
        </div>
      `}

      <!-- 리롤 설정 (아래쪽) -->
      <div>
        <h4 class="text-sm font-medium text-white mb-2">${t('stickerPreview.rerollSettings')}</h4>
        <div class="bg-gray-700 rounded-lg p-3 space-y-3">
          <div>
            <label class="block text-xs text-gray-300 mb-1">${t('stickerPreview.prompt')}:</label>
            <textarea
              id="reroll-prompt"
              class="w-full px-2 py-1 bg-gray-600 text-white rounded text-xs resize-none"
              rows="2"
              placeholder="${t('stickerPreview.enterPrompt')}"
            >${rerollData.prompt || ''}</textarea>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block text-xs text-gray-300 mb-1">${t('stickerPreview.steps')}:</label>
              <input
                id="reroll-steps"
                type="number"
                value="${rerollData.steps || 28}"
                min="1" max="50"
                class="w-full px-2 py-1 bg-gray-600 text-white rounded text-xs"
              >
            </div>
            <div>
              <label class="block text-xs text-gray-300 mb-1">${t('stickerPreview.scale')}:</label>
              <input
                id="reroll-scale"
                type="number"
                value="${rerollData.scale || 3}"
                min="1" max="20"
                step="0.5"
                class="w-full px-2 py-1 bg-gray-600 text-white rounded text-xs"
              >
            </div>
            <div>
              <label class="block text-xs text-gray-300 mb-1">${t('stickerPreview.imageSize')}:</label>
              <select
                id="reroll-size"
                class="w-full px-2 py-1 bg-gray-600 text-white rounded text-xs"
              >
                <option value="portrait" ${defaultSize === 'portrait' ? 'selected' : ''}>세로형</option>
                <option value="square" ${defaultSize === 'square' ? 'selected' : ''}>정사각형</option>
                <option value="landscape" ${defaultSize === 'landscape' ? 'selected' : ''}>가로형</option>
              </select>
            </div>
          </div>

          <!-- 리롤 버튼 -->
          <div class="flex gap-3 pt-2">
            <button
              id="start-reroll"
              data-index="${index}"
              class="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <i data-lucide="refresh-cw" class="w-4 h-4 mr-2 pointer-events-none"></i>
              ${t('stickerPreview.startReroll')}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 액션 탭 렌더링
 */
function renderActionsTab(sticker, index) {
  return `
    <div class="space-y-4">
      <!-- 위험한 액션 -->
      <div>
        <h4 class="text-sm font-medium text-red-400 mb-3">${t('stickerPreview.dangerZone')}</h4>
        <div class="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <i data-lucide="trash-2" class="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0"></i>
            <div class="flex-1">
              <h5 class="text-sm font-medium text-red-400 mb-1">${t('stickerPreview.deleteSticker')}</h5>
              <p class="text-xs text-gray-300 mb-3">${t('stickerPreview.deleteWarning')}</p>
              <button 
                id="delete-sticker" 
                data-index="${index}"
                class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
              >
                ${t('stickerPreview.deleteConfirm')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 기타 액션 -->
      <div>
        <h4 class="text-sm font-medium text-white mb-3">${t('stickerPreview.otherActions')}</h4>
        <div class="space-y-2">
          <button 
            id="copy-sticker-data" 
            data-index="${index}"
            class="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <i data-lucide="copy" class="w-4 h-4 pointer-events-none"></i>
            ${t('stickerPreview.copyToClipboard')}
          </button>
          
          <button 
            id="download-sticker" 
            data-index="${index}"
            class="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <i data-lucide="download" class="w-4 h-4 pointer-events-none"></i>
            ${t('stickerPreview.downloadSticker')}
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * 파일 크기를 읽기 쉬운 형태로 포맷팅
 * @param {number} bytes - 바이트 수
 * @returns {string} 포맷된 크기
 */
function formatStickerSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}