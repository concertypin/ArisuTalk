import { t } from "../i18n.js";
import { formatBytes } from "../storage.js";
import { renderAvatar } from "./Avatar.js";

function renderSlider(id, description, left, right, value) {
  return `
        <div>
            <p class="text-sm font-medium text-gray-300 mb-2">${description}</p>
            <input id="character-${id}" type="range" min="1" max="10" value="${value}" class="w-full">
            <div class="flex justify-between text-xs text-gray-400 mt-1">
                <span>${left}</span>
                <span>${right}</span>
            </div>
        </div>
    `;
}

function renderMemoryInput(memoryText = "") {
  return `
        <div class="memory-item flex items-center gap-2">
            <input type="text" class="memory-input flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm" value="${memoryText}" placeholder="기억할 내용을 입력하세요...">
            <button class="delete-memory-btn p-2 text-gray-400 hover:text-red-400">
                <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
            </button>
        </div>
    `;
}

export function renderStickerGrid(app, stickers) {
  if (!stickers || stickers.length === 0) {
    return '<div class="col-span-4 text-center text-gray-400 text-sm py-4">아직 스티커가 없습니다.</div>';
  }

  const isSelectionMode = app.state.stickerSelectionMode;
  const selectedIndices = app.state.selectedStickerIndices || [];

  return stickers
    .map((sticker, index) => {
      const isSelected = selectedIndices.includes(index);
      const isVideo =
        sticker.type &&
        (sticker.type.startsWith("video/") ||
          sticker.type === "video/mp4" ||
          sticker.type === "video/webm");
      const isAudio = sticker.type && sticker.type.startsWith("audio/");

      let content = "";
      if (isAudio) {
        content = `
                <div class="w-full h-16 bg-gray-600 rounded-lg flex items-center justify-center">
                    <i data-lucide="music" class="w-6 h-6 text-gray-300"></i>
                </div>
                <div class="text-xs text-gray-300 text-center truncate mt-1">${sticker.name}</div>
            `;
      } else if (isVideo) {
        content = `
                <video class="w-full h-16 object-cover rounded-lg" muted loop autoplay>
                    <source src="${sticker.dataUrl}" type="${sticker.type}">
                </video>
                <div class="text-xs text-gray-300 text-center truncate mt-1">${sticker.name}</div>
            `;
      } else {
        content = `
                <img src="${sticker.dataUrl}" alt="${sticker.name}" class="w-full h-16 object-cover rounded-lg">
                <div class="text-xs text-gray-300 text-center truncate mt-1">${sticker.name}</div>
            `;
      }

      return `
            <div class="sticker-item relative group ${
              isSelected && isSelectionMode ? "ring-2 ring-blue-500" : ""
            }" ${isSelectionMode ? `data-index="${index}"` : ""}>${
        isSelectionMode
          ? `
                <div class="absolute -top-2 -left-2 z-10">
                    <input type="checkbox" class="sticker-checkbox w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" data-index="${index}" ${
              isSelected ? "checked" : ""
            }>
                </div>
            `
          : ""
      }${content}${
        !isSelectionMode
          ? `
                <div class="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button class="edit-sticker-name-btn p-1 bg-blue-600 rounded-full text-white" data-index="${index}" title="이름 변경">
                        <i data-lucide="edit-3" class="w-2 h-2 pointer-events-none"></i>
                    </button>
                    <button class="delete-sticker-btn p-1 bg-red-600 rounded-full text-white" data-index="${index}" title="삭제">
                        <i data-lucide="x" class="w-3 h-3 pointer-events-none"></i>
                    </button>
                </div>
            `
          : ""
      }</div>
        `;
    })
    .join("");
}

export function renderCharacterModal(app) {
  const { editingCharacter } = app.state;
  const isNew = !editingCharacter || !editingCharacter.id;
  const char = {
    name: editingCharacter?.name || "",
    prompt: editingCharacter?.prompt || "",
    avatar: editingCharacter?.avatar || null,
    responseTime: editingCharacter?.responseTime ?? 5,
    thinkingTime: editingCharacter?.thinkingTime ?? 5,
    reactivity: editingCharacter?.reactivity ?? 5,
    tone: editingCharacter?.tone ?? 5,
    memories: editingCharacter?.memories || [],
    proactiveEnabled: editingCharacter?.proactiveEnabled !== false,
  };

  return `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div class="bg-gray-800 rounded-2xl w-full max-w-md mx-auto my-auto flex flex-col" style="max-height: 90vh;">
                <div class="flex items-center justify-between p-6 border-b border-gray-700 shrink-0">
                    <h3 class="text-xl font-semibold text-white">${
                      isNew ? "연락처 추가" : "연락처 수정"
                    }</h3>
                    <button id="close-character-modal" data-action="close-character-modal" class="p-1 hover:bg-gray-700 rounded-full"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <div class="p-6 space-y-6 overflow-y-auto">
                    <div class="flex items-center space-x-4">
                        <div id="avatar-preview" class="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                            ${
                              char.avatar
                                ? `<img src="${char.avatar}" alt="Avatar Preview" class="w-full h-full object-cover">`
                                : `<i data-lucide="image" class="w-8 h-8 text-gray-400"></i>`
                            }
                        </div>
                        <div class="flex flex-col gap-2">
                            <button id="select-avatar-btn" class="py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                                <i data-lucide="image" class="w-4 h-4"></i> 프로필 이미지
                            </button>
                            <button id="load-card-btn" class="py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                                <i data-lucide="upload" class="w-4 h-4"></i> 연락처 불러오기
                            </button>
                            <button id="save-card-btn" class="py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                                <i data-lucide="download" class="w-4 h-4"></i> 연락처 공유하기
                            </button>
                        </div>
                        <input type="file" accept="image/png,image/jpeg" id="avatar-input" class="hidden" />
                        <input type="file" accept="image/png" id="card-input" class="hidden" />
                    </div>
                    <div>
                        <label class="text-sm font-medium text-gray-300 mb-2 block">이름</label>
                        <input id="character-name" type="text" placeholder="이름을 입력하세요" value="${
                          char.name
                        }" class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 text-sm" />
                    </div>
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label class="text-sm font-medium text-gray-300">인물 정보</label>
                            <button id="ai-generate-character-btn" class="py-1 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs flex items-center gap-1">
                                <i data-lucide="sparkles" class="w-3 h-3"></i> AI 생성
                            </button>
                        </div>
                        <textarea id="character-prompt" placeholder="특징, 배경, 관계, 기억 등을 자유롭게 서술해주세요. 또는 간단한 정보를 입력하고 AI 생성 버튼을 클릭하세요." class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 text-sm" rows="6">${
                          char.prompt
                        }</textarea>
                    </div>
                    
                    ${
                      app.state.settings.proactiveChatEnabled
                        ? `
                    <div class="border-t border-gray-700 pt-4">
                        <label class="flex items-center justify-between text-sm font-medium text-gray-300 cursor-pointer">
                            <span class="flex items-center"><i data-lucide="message-square-plus" class="w-4 h-4 mr-2"></i>개별 선톡 허용</span>
                            <div class="relative inline-block w-10 align-middle select-none">
                                <input type="checkbox" name="toggle" id="character-proactive-toggle" ${
                                  char.proactiveEnabled ? "checked" : ""
                                } class="absolute opacity-0 w-0 h-0 peer"/>
                                <label for="character-proactive-toggle" class="block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer peer-checked:bg-blue-600"></label>
                                <span class="absolute left-0.5 top-0.5 block w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                            </div>
                        </label>
                    </div>`
                        : ""
                    }

                    <details class="group border-t border-gray-700 pt-4">
                        <summary class="flex items-center justify-between cursor-pointer list-none">
                            <span class="text-base font-medium text-gray-200">추가 설정</span>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                        </summary>
                        <div class="content-wrapper">
                            <div class="content-inner pt-6 space-y-6">
                                <details class="group border-t border-gray-700 pt-2">
                                    <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                                       <h4 class="text-sm font-medium text-gray-300">스티커</h4>
                                       <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                                    </summary>
                                    <div class="content-wrapper">
                                        <div class="content-inner pt-4 space-y-4">
                                            <div class="flex items-center justify-between mb-3">
                                                <div class="flex items-center gap-2">
                                                    <button id="add-sticker-btn" class="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex flex-col items-center justify-center gap-1">
                                                        <i data-lucide="plus" class="w-4 h-4"></i> 
                                                        <span class="text-xs">스티커<br>추가</span>
                                                    </button>
                                                    <input type="file" accept="image/jpeg,image/jpg,image/gif,image/png,image/bmp,image/webp,video/webm,video/mp4,audio/mpeg,audio/mp3" id="sticker-input" class="hidden" multiple />
                                                </div>
                                                ${
                                                  (
                                                    editingCharacter?.stickers ||
                                                    []
                                                  ).length > 0
                                                    ? `
                                                <div class="flex items-center gap-2">
                                                    <button id="toggle-sticker-selection" class="py-2 px-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm flex flex-col items-center gap-1" data-selection-mode="${
                                                      app.state
                                                        .stickerSelectionMode
                                                        ? "true"
                                                        : "false"
                                                    }">
                                                        <i data-lucide="check-square" class="w-4 h-4"></i> 
                                                        <span class="toggle-text text-xs">${
                                                          app.state
                                                            .stickerSelectionMode
                                                            ? "선택<br>해제"
                                                            : "선택<br>모드"
                                                        }</span>
                                                    </button>
                                                    ${
                                                      app.state
                                                        .stickerSelectionMode
                                                        ? `
                                                    <button id="select-all-stickers" class="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex flex-col items-center gap-1">
                                                        <i data-lucide="check-circle" class="w-4 h-4"></i> 
                                                        <span class="text-xs">전체<br>선택</span>
                                                    </button>
                                                    `
                                                        : ""
                                                    }
                                                    <button id="delete-selected-stickers" class="py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm flex flex-col items-center gap-1 opacity-50 cursor-not-allowed" disabled>
                                                        <i data-lucide="trash-2" class="w-4 h-4"></i> 
                                                        <span class="text-xs">삭제<br>(<span id="selected-count">0</span>)</span>
                                                    </button>
                                                </div>
                                                `
                                                    : ""
                                                }
                                            </div>
                                            <div class="flex items-center justify-between text-xs text-gray-400 mb-3">
                                                <span>jpg, gif, png, bmp, webp, webm, mp4, mp3 지원 (개당 최대 30MB)</span>
                                                <span>스티커 개수: ${
                                                  (
                                                    editingCharacter?.stickers ||
                                                    []
                                                  ).length
                                                }개</span>
                                            </div>
                                            <div class="flex items-center justify-between text-xs text-gray-500 mb-3">
                                                <span id="storage-usage-info">전체 저장 용량: 계산 중...</span>
                                                <span>총 용량: ${formatBytes(
                                                  app.calculateCharacterStickerSize(
                                                    editingCharacter || {}
                                                  )
                                                )}</span>
                                            </div>
                                            <div id="sticker-container" class="grid grid-cols-4 gap-2">
                                                ${renderStickerGrid(
                                                  app,
                                                  editingCharacter?.stickers ||
                                                    []
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </details>
                                <details class="group border-t border-gray-700 pt-2">
                                    <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                                       <h4 class="text-sm font-medium text-gray-300">메모리</h4>
                                       <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                                    </summary>
                                    <div class="content-wrapper">
                                        <div class="content-inner pt-4 space-y-2">
                                            <div id="memory-container" class="space-y-2">
                                                ${char.memories
                                                  .map((mem, index) =>
                                                    renderMemoryInput(
                                                      mem,
                                                      index
                                                    )
                                                  )
                                                  .join("")}
                                            </div>
                                            <button id="add-memory-btn" class="mt-3 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2">
                                                <i data-lucide="plus-circle" class="w-4 h-4"></i> 메모리 추가
                                            </button>
                                        </div>
                                    </div>
                                </details>
                                <details class="group border-t border-gray-700 pt-2">
                                    <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                                       <h4 class="text-sm font-medium text-gray-300">메시지 응답성</h4>
                                       <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                                    </summary>
                                    <div class="content-wrapper">
                                        <div class="content-inner pt-4 space-y-4">
                                            ${renderSlider(
                                              "responseTime",
                                              t('characterModalSlider.responseTime.description'),
                                              t('characterModalSlider.responseTime.low'),
                                              t('characterModalSlider.responseTime.high'),
                                              char.responseTime
                                            )}
                                            ${renderSlider(
                                              "thinkingTime",
                                              t('characterModalSlider.thinkingTime.description'),
                                              t('characterModalSlider.thinkingTime.low'),
                                              t('characterModalSlider.thinkingTime.high'),
                                              char.thinkingTime
                                            )}
                                            ${renderSlider(
                                              "reactivity",
                                              t('characterModalSlider.reactivity.description'),
                                              t('characterModalSlider.reactivity.low'),
                                              t('characterModalSlider.reactivity.high'),
                                              char.reactivity
                                            )}
                                            ${renderSlider(
                                              "tone",
                                              t('characterModalSlider.tone.description'),
                                              t('characterModalSlider.tone.low'),
                                              t('characterModalSlider.tone.high'),
                                              char.tone
                                            )}
                                        </div>
                                    </div>
                                </details>
                            </div>
                        </div>
                    </details>
                </div>
                <div class="p-6 mt-auto border-t border-gray-700 shrink-0 flex justify-end space-x-3">
                    <button id="close-character-modal" data-action="close-character-modal" class="flex-1 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">취소</button>
                    <button id="save-character" class="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">저장</button>
                </div>
            </div>
        </div>
    `;
}
