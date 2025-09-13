import { t } from "../i18n.js";

export function renderImageZoomModal(app) {
  const zoomModal = app.state.imageZoomModal;
  if (!zoomModal || !zoomModal.isOpen) return '';

  const { imageUrl, title } = zoomModal;

  return `
    <div id="image-zoom-modal" class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999] p-4">
      <div class="relative max-w-[90vw] max-h-[90vh] flex flex-col">
        <!-- 닫기 버튼 -->
        <div class="absolute top-4 right-4 z-10">
          <button id="close-image-zoom" class="p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full text-white transition-all">
            <i data-lucide="x" class="w-6 h-6 pointer-events-none"></i>
          </button>
        </div>
        
        <!-- 이미지 -->
        <div class="flex-1 flex items-center justify-center">
          <img 
            id="zoomed-image"
            src="${imageUrl}" 
            alt="${title || t('common.image')}"
            class="max-w-full max-h-full object-contain cursor-pointer transition-transform duration-200 ease-out"
            style="max-width: min(90vw, 1200px); max-height: min(90vh, 800px);"
          />
        </div>
        
        <!-- 제목 (있는 경우) -->
        ${title ? `
          <div class="mt-4 text-center">
            <p class="text-white text-sm opacity-80">${title}</p>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}