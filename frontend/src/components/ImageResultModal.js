/**
 * 이미지 결과 표시 모달 컴포넌트
 */
export function renderImageResultModal(modal) {
  if (!modal || !modal.isOpen) {
    return '';
  }

  const { imageUrl, promptText } = modal;

  return `
    <div id="image-result-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[9999] flex items-center justify-center">
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <!-- 헤더 -->
        <div class="border-b px-6 py-4 flex justify-between items-center sticky top-0 bg-white">
          <h3 class="text-xl font-semibold text-gray-900">외모 프롬프트 테스트 결과</h3>
          <button id="close-image-result-modal" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- 본문 -->
        <div class="p-6">
          <!-- 이미지 표시 영역 -->
          <div class="mb-6 flex justify-center">
            <img src="${imageUrl}" alt="생성된 이미지" class="max-w-full h-auto rounded-lg shadow-lg" style="max-height: 60vh;">
          </div>

          <!-- 프롬프트 정보 -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="text-sm font-semibold text-gray-700 mb-2">사용된 프롬프트:</h4>
            <p class="text-sm text-gray-600 leading-relaxed break-all">${promptText}</p>
          </div>

          <!-- 감정 정보 -->
          <div class="mt-4 text-center">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Happy (행복)
            </span>
          </div>
        </div>

        <!-- 푸터 -->
        <div class="border-t px-6 py-4 flex justify-between">
          <div class="text-sm text-gray-500">
            <i data-lucide="info" class="w-4 h-4 inline pointer-events-none"></i>
            이 이미지는 테스트용이며 저장되지 않습니다
          </div>
          <button id="close-image-result-modal-btn" class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
            닫기
          </button>
        </div>
      </div>
    </div>
  `;
}