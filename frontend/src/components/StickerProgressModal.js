import { t } from "../i18n.js";

/**
 * 스티커 생성 진행상황 모달 컴포넌트
 * 실시간으로 스티커 생성 과정을 시각화하여 보여줌
 */

export function renderStickerProgressModal(progress) {
  if (!progress || !progress.isVisible) {
    return '';
  }

  const { character, emotions, currentIndex, totalCount, currentEmotion, status, error, generatedStickers } = progress;

  return `
    <div id="sticker-progress-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-gray-900">
            ${t("stickerProgress.title", { name: character?.name || t("stickerProgress.defaultCharacter") })}
          </h3>
          <div class="flex items-center space-x-2">
            ${status === 'generating' ? `
              <button id="cancel-sticker-generation" class="text-red-400 hover:text-red-600 p-1" title="${t("stickerProgress.cancel")}">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            ` : ''}
            ${status === 'completed' || status === 'error' ? `
              <button id="close-sticker-progress" class="text-gray-400 hover:text-gray-600 p-1">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- 전체 진행률 -->
        <div class="mb-4">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-medium text-gray-700">${t("stickerProgress.overallProgress")}</span>
            <span class="text-sm text-gray-500">${currentIndex}/${totalCount}</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: ${Math.round((currentIndex / totalCount) * 100)}%"></div>
          </div>
        </div>

        <!-- 현재 상태 -->
        <div class="mb-4 p-3 rounded-lg ${getStatusBgColor(status)}">
          <div class="flex items-center">
            ${getStatusIcon(status)}
            <div class="ml-3">
              <p class="text-sm font-medium ${getStatusTextColor(status)}">
                ${getStatusText(status, currentEmotion)}
              </p>
              ${error ? `<p class="text-xs text-red-600 mt-1">${error}</p>` : ''}
            </div>
          </div>
        </div>

        <!-- 감정 목록 -->
        <div class="mb-4">
          <h4 class="text-sm font-medium text-gray-700 mb-2">${t("stickerProgress.emotionsToGenerate")}</h4>
          <div class="grid grid-cols-5 gap-2">
            ${emotions.map((emotion, index) => {
              // 감정 키 추출 (객체 또는 문자열 처리)
              let emotionKey, emotionDisplayName;
              if (typeof emotion === 'object' && emotion.emotion) {
                emotionKey = emotion.emotion;
                emotionDisplayName = emotion.title || emotion.emotion;
              } else if (typeof emotion === 'string') {
                emotionKey = emotion;
                emotionDisplayName = emotion;
              } else {
                emotionKey = 'unknown';
                emotionDisplayName = 'Unknown';
              }

              const isCompleted = generatedStickers.some(s => s.emotion === emotionKey);
              const isCurrent = index === currentIndex - 1;
              const isError = progress.failedEmotions?.includes(emotionKey);

              return `
                <div class="text-center">
                  <div class="w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center text-xs font-medium ${
                    isError ? 'bg-red-100 text-red-700' :
                    isCompleted ? 'bg-green-100 text-green-700' :
                    isCurrent ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-500'
                  }">
                    ${isError ? '✗' : isCompleted ? '✓' : isCurrent ? '⟳' : '○'}
                  </div>
                  <span class="text-xs text-gray-600">${typeof emotion === 'object' && emotion.title ? emotionDisplayName : (t(`stickerProgress.emotions.${emotionKey}`) || emotionDisplayName)}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 생성된 스티커 미리보기 -->
        ${generatedStickers.length > 0 ? `
          <div class="mb-4">
            <h4 class="text-sm font-medium text-gray-700 mb-2">${t("stickerProgress.completedStickers")}</h4>
            <div class="flex flex-wrap gap-2">
              ${generatedStickers.slice(-3).map(sticker => `
                <div class="relative">
                  <img src="${sticker.dataUrl}" alt="${sticker.name}" class="w-12 h-12 rounded object-cover">
                  <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <svg class="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                </div>
              `).join('')}
              ${generatedStickers.length > 3 ? `
                <div class="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                  +${generatedStickers.length - 3}
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}

        <!-- 대기 시간 안내 -->
        ${status === 'waiting' ? `
          <div class="bg-yellow-50 p-3 rounded-lg">
            <p class="text-sm text-yellow-800">
              ${t("stickerProgress.waitingMessage", { seconds: Math.ceil(progress.waitTime / 1000) })}
            </p>
          </div>
        ` : ''}

        <!-- 완료 또는 오류 시 버튼 -->
        ${status === 'completed' || status === 'error' ? `
          <div class="flex justify-end space-x-3">
            ${status === 'error' && progress.canRetry ? `
              <button id="retry-sticker-generation" class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                ${t("stickerProgress.retry")}
              </button>
            ` : ''}
            <button id="close-sticker-progress" class="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400">
              ${status === 'completed' ? t("stickerProgress.completed") : t("stickerProgress.close")}
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function getStatusBgColor(status) {
  switch (status) {
    case 'generating': return 'bg-blue-50';
    case 'completed': return 'bg-green-50';
    case 'error': return 'bg-red-50';
    case 'waiting': return 'bg-yellow-50';
    default: return 'bg-gray-50';
  }
}

function getStatusTextColor(status) {
  switch (status) {
    case 'generating': return 'text-blue-800';
    case 'completed': return 'text-green-800';
    case 'error': return 'text-red-800';
    case 'waiting': return 'text-yellow-800';
    default: return 'text-gray-800';
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'generating':
      return `
        <div class="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
      `;
    case 'completed':
      return `
        <div class="rounded-full h-5 w-5 bg-green-600 flex items-center justify-center">
          <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
        </div>
      `;
    case 'error':
      return `
        <div class="rounded-full h-5 w-5 bg-red-600 flex items-center justify-center">
          <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
        </div>
      `;
    case 'waiting':
      return `
        <div class="rounded-full h-5 w-5 bg-yellow-600 flex items-center justify-center">
          <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
          </svg>
        </div>
      `;
    default:
      return `<div class="w-5 h-5 bg-gray-400 rounded-full"></div>`;
  }
}

function getStatusText(status, currentEmotion) {
  switch (status) {
    case 'generating': {
      // 감정 키 추출 (객체 또는 문자열 처리)
      let emotionKey, emotionDisplayName;
      if (typeof currentEmotion === 'object' && currentEmotion.emotion) {
        emotionKey = currentEmotion.emotion;
        emotionDisplayName = currentEmotion.title || currentEmotion.emotion;
      } else if (typeof currentEmotion === 'string') {
        emotionKey = currentEmotion;
        emotionDisplayName = currentEmotion;
      } else {
        emotionKey = 'unknown';
        emotionDisplayName = 'Unknown';
      }

      const emotionTranslation = typeof currentEmotion === 'object' && currentEmotion.title ?
        emotionDisplayName :
        (t(`stickerProgress.emotions.${emotionKey}`) || emotionDisplayName);
      return t("stickerProgress.statuses.generating", { emotion: emotionTranslation });
    }
    case 'completed':
      return t("stickerProgress.statuses.completed");
    case 'error':
      return t("stickerProgress.statuses.error");
    case 'waiting':
      return t("stickerProgress.statuses.waiting");
    default:
      return t("stickerProgress.statuses.preparing");
  }
}

