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
            <input type="text" class="memory-input flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm" value="${memoryText}" placeholder="${t(
              "characterModal.memoryPlaceholder",
            )}">
            <button class="delete-memory-btn p-2 text-gray-400 hover:text-red-400">
                <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
            </button>
        </div>
    `;
}

export function renderStickerGrid(app, stickers) {
  if (!stickers || stickers.length === 0) {
    return `<div class="col-span-4 text-center text-gray-400 text-sm py-4">${t(
      "characterModal.noStickers",
    )}</div>`;
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
                <div class="sticker-preview-trigger w-full h-16 bg-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-500 transition-colors" data-index="${index}">
                    <i data-lucide="music" class="w-6 h-6 text-gray-300 pointer-events-none"></i>
                </div>
                <div class="text-xs text-gray-300 text-center truncate mt-1">${sticker.name}</div>
            `;
      } else if (isVideo) {
        content = `
                <div class="sticker-preview-trigger cursor-pointer" data-index="${index}">
                    <video class="w-full h-16 object-cover rounded-lg hover:opacity-80 transition-opacity pointer-events-none" muted loop autoplay>
                        <source src="${sticker.dataUrl}" type="${sticker.type}">
                    </video>
                </div>
                <div class="text-xs text-gray-300 text-center truncate mt-1">${sticker.name}</div>
            `;
      } else {
        content = `
                <div class="sticker-preview-trigger cursor-pointer" data-index="${index}">
                    <img src="${sticker.dataUrl}" alt="${sticker.name}" class="w-full h-16 object-cover rounded-lg hover:opacity-80 transition-opacity pointer-events-none">
                </div>
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
                    <button class="edit-sticker-name-btn p-1 bg-blue-600 rounded-full text-white" data-index="${index}" title="${t(
                      "characterModal.editStickerName",
                    )}">
                        <i data-lucide="edit-3" class="w-2 h-2 pointer-events-none"></i>
                    </button>
                    <button class="delete-sticker-btn p-1 bg-red-600 rounded-full text-white" data-index="${index}" title="${t(
                      "characterModal.deleteSticker",
                    )}">
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
  const currentCharacterState = editingCharacter ? app.getCharacterState(editingCharacter.id) : null;
  const char = {
    name: editingCharacter?.name || "",
    prompt: editingCharacter?.prompt || "",
    appearance: editingCharacter?.appearance || "",
    avatar: editingCharacter?.avatar || null,
    responseTime: editingCharacter?.responseTime ?? 5,
    thinkingTime: editingCharacter?.thinkingTime ?? 5,
    reactivity: editingCharacter?.reactivity ?? 5,
    tone: editingCharacter?.tone ?? 5,
    memories: editingCharacter?.memories || [],
    proactiveEnabled: editingCharacter?.proactiveEnabled !== false,
    naiSettings: editingCharacter?.naiSettings || {},
    hypnosis: {
      ...editingCharacter?.hypnosis || {
        enabled: false,
        affection: null,
        intimacy: null,
        trust: null,
        romantic_interest: null,
        force_love_unlock: false,
        sns_full_access: false,
        secret_account_access: false,
        sns_edit_access: false,
        affection_override: false
      }
    }
  };

  return `
        <div id="character-modal-backdrop" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-all duration-300 ease-out">
            <div id="character-modal-panel" class="bg-gray-800 rounded-2xl w-full max-w-md mx-auto my-auto flex flex-col" style="max-height: 90vh;">
                <div class="flex items-center justify-between px-6 py-2 md:p-6 border-b border-gray-700 shrink-0">
                    <h3 class="text-xl font-semibold text-white">${
                      isNew
                        ? t("characterModal.addContact")
                        : t("characterModal.editContact")
                    }</h3>
                    <div class="flex items-center gap-2">
                        ${!isNew ? `
                            <button id="character-sns-btn" class="p-2 md:p-2 hover:bg-gray-700 rounded-full transition-colors z-20" title="${t('characterModal.openSNS')}">
                                <i data-lucide="instagram" class="w-6 h-6 md:w-5 md:h-5 text-gray-300 pointer-events-none"></i>
                            </button>
                        ` : ''}
                        <button id="close-character-modal" data-action="close-character-modal" class="p-3 md:p-1 hover:bg-gray-700 rounded-full"><i data-lucide="x" class="w-7 h-7 md:w-5 md:h-5"></i></button>
                    </div>
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
                                <i data-lucide="image" class="w-4 h-4"></i> ${t(
                                  "characterModal.profileImage",
                                )}
                            </button>
                            <button id="load-card-btn" class="py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                                <i data-lucide="upload" class="w-4 h-4"></i> ${t(
                                  "characterModal.importContact",
                                )}
                            </button>
                            <button id="save-card-btn" class="py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                                <i data-lucide="download" class="w-4 h-4"></i> ${t(
                                  "characterModal.shareContact",
                                )}
                            </button>
                        </div>
                        <input type="file" accept="image/png,image/jpeg" id="avatar-input" class="hidden" />
                        <input type="file" accept="image/png" id="card-input" class="hidden" />
                    </div>
                    <div>
                        <label class="text-sm font-medium text-gray-300 mb-2 block">${t(
                          "characterModal.nameLabel",
                        )}</label>
                        <input id="character-name" type="text" placeholder="${t(
                          "characterModal.namePlaceholder",
                        )}" value="${
                          char.name
                        }" class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 text-sm" />
                    </div>
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label class="text-sm font-medium text-gray-300">${t(
                              "characterModal.promptLabel",
                            )}</label>
                            <button id="ai-generate-character-btn" class="py-1 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs flex items-center gap-1">
                                <i data-lucide="sparkles" class="w-3 h-3"></i> AI ${t(
                                  "ui.generate",
                                )}
                            </button>
                        </div>
                        <textarea id="character-prompt" placeholder="${t(
                          "characterModal.promptPlaceholder",
                        )}" class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 text-sm" rows="6">${
                          char.prompt
                        }</textarea>
                    </div>
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label class="text-sm font-medium text-gray-300">외형 설명 (NAI 스티커 생성용)</label>
                            <div class="text-xs text-gray-400 bg-purple-900/20 px-2 py-1 rounded">
                                <i data-lucide="image" class="w-3 h-3 inline mr-1"></i>스티커 생성
                            </div>
                        </div>
                        <textarea id="character-appearance" placeholder="예: young Korean woman, long black hair, school uniform, bright smile, casual modern clothes..." class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-purple-500/50 text-sm" rows="3">${
                          char.appearance
                        }</textarea>
                        <div class="mt-2 flex justify-between items-center">
                            <div class="flex items-center gap-2">
                                <label class="text-xs text-gray-400">NAI 자동 생성</label>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        id="character-nai-enabled" 
                                        type="checkbox" 
                                        ${char.naiSettings?.autoGenerate ? "checked" : ""} 
                                        class="sr-only peer"
                                    >
                                    <div class="w-9 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                                </label>
                            </div>
                            <button id="test-appearance-prompt" class="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-1">
                                <i data-lucide="test-tube" class="w-3 h-3 pointer-events-none"></i>
                                외모 프롬프트 테스트
                            </button>
                        </div>
                    </div>
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label class="text-sm font-medium text-gray-300">품질 향상 프롬프트 (NAI 스티커 품질 개선용)</label>
                            <div class="text-xs text-gray-400 bg-purple-900/20 px-2 py-1 rounded">
                                <i data-lucide="sparkles" class="w-3 h-3 inline mr-1"></i>품질 개선
                            </div>
                        </div>
                        <textarea id="character-nai-quality-prompt" placeholder="masterpiece, best quality, high resolution, detailed..." class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-purple-500/50 text-sm" rows="2">${
                          char.naiSettings?.qualityPrompt || "masterpiece, best quality, high resolution, detailed"
                        }</textarea>
                        <div class="text-xs text-gray-400 mt-1">
                            NAI 스티커 생성 시 이미지 품질을 향상시키는 키워드들 (영문 권장)
                        </div>
                    </div>
                    
                    ${
                      app.state.settings.proactiveChatEnabled
                        ? `
                    <div class="border-t border-gray-700 pt-4">
                        <label class="flex items-center justify-between text-sm font-medium text-gray-300 cursor-pointer">
                            <span class="flex items-center"><i data-lucide="message-square-plus" class="w-4 h-4 mr-2"></i>${t(
                              "characterModal.proactiveToggle",
                            )}</span>
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
                            <span class="text-base font-medium text-gray-200">${t(
                              "characterModal.advancedSettings",
                            )}</span>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                        </summary>
                        <div class="content-wrapper">
                            <div class="content-inner pt-6 space-y-6">
                                <details class="group border-t border-gray-700 pt-2">
                                    <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                                       <h4 class="text-sm font-medium text-gray-300">${t(
                                         "characterModal.sticker",
                                       )}</h4>
                                       <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                                    </summary>
                                    <div class="content-wrapper">
                                        <div class="content-inner pt-4 space-y-4">
                                            <div class="flex items-center justify-between mb-3">
                                                <div class="flex items-center gap-2">
                                                    <button id="add-sticker-btn" class="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex flex-col items-center justify-center gap-1">
                                                        <i data-lucide="plus" class="w-4 h-4"></i> 
                                                        <span class="text-xs">${t(
                                                          "characterModal.addSticker",
                                                        )}</span>
                                                    </button>
                                                    <button id="generate-character-stickers" class="py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm flex flex-col items-center justify-center gap-1">
                                                        <i data-lucide="image" class="w-4 h-4"></i> 
                                                        <span class="text-xs">${t('naiHandlers.emotionListGeneration')}</span>
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
                                                            ? t(
                                                                "characterModal.deselect",
                                                              )
                                                            : t(
                                                                "characterModal.selectMode",
                                                              )
                                                        }</span>
                                                    </button>
                                                    ${
                                                      app.state
                                                        .stickerSelectionMode
                                                        ? `
                                                    <button id="select-all-stickers" class="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex flex-col items-center gap-1">
                                                        <i data-lucide="check-circle" class="w-4 h-4"></i> 
                                                        <span class="text-xs">${t(
                                                          "characterModal.selectAll",
                                                        )}</span>
                                                    </button>
                                                    `
                                                        : ""
                                                    }
                                                    <button id="delete-selected-stickers" class="py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm flex flex-col items-center gap-1 opacity-50 cursor-not-allowed" disabled>
                                                        <i data-lucide="trash-2" class="w-4 h-4"></i> 
                                                        <span class="text-xs">${t(
                                                          "characterModal.deleteSelected",
                                                        )}</span>
                                                    </button>
                                                </div>
                                                `
                                                    : ""
                                                }
                                            </div>
                                            <div class="flex items-center justify-between text-xs text-gray-400 mb-3">
                                                <span>${t(
                                                  "characterModal.stickerSupport",
                                                )}</span>
                                                <span>${t(
                                                  "characterModal.stickerCount",
                                                  {
                                                    count: (
                                                      editingCharacter?.stickers ||
                                                      []
                                                    ).length,
                                                  },
                                                )}</span>
                                            </div>
                                            <div class="flex items-center justify-between text-xs text-gray-500 mb-3">
                                                <span id="storage-usage-info">${t(
                                                  "characterModal.totalStorage",
                                                )}${t(
                                                  "groupChat.calculatingStorage",
                                                )}</span>
                                                <span>${t(
                                                  "characterModal.totalSize",
                                                )}${formatBytes(
                                                  app.calculateCharacterStickerSize(
                                                    editingCharacter || {},
                                                  ),
                                                )}</span>
                                            </div>
                                            <div id="sticker-container" class="grid grid-cols-4 gap-2">
                                                ${renderStickerGrid(
                                                  app,
                                                  editingCharacter?.stickers ||
                                                    [],
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </details>
                                <details class="group border-t border-gray-700 pt-2">
                                    <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                                       <h4 class="text-sm font-medium text-gray-300">${t(
                                         "characterModal.memory",
                                       )}</h4>
                                       <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                                    </summary>
                                    <div class="content-wrapper">
                                        <div class="content-inner pt-4 space-y-2">
                                            <div id="memory-container" class="space-y-2">
                                                ${char.memories
                                                  .map((mem, index) =>
                                                    renderMemoryInput(
                                                      mem,
                                                      index,
                                                    ),
                                                  )
                                                  .join("")}
                                            </div>
                                            <button id="add-memory-btn" class="mt-3 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2">
                                                <i data-lucide="plus-circle" class="w-4 h-4"></i> ${t(
                                                  "characterModal.addMemory",
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </details>
                                <details class="group border-t border-gray-700 pt-2">
                                    <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                                       <h4 class="text-sm font-medium text-gray-300">${t(
                                         "characterModal.responseSpeed",
                                       )}</h4>
                                       <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                                    </summary>
                                    <div class="content-wrapper">
                                        <div class="content-inner pt-4 space-y-4">
                                            ${renderSlider(
                                              "responseTime",
                                              t(
                                                "characterModalSlider.responseTime.description",
                                              ),
                                              t(
                                                "characterModalSlider.responseTime.low",
                                              ),
                                              t(
                                                "characterModalSlider.responseTime.high",
                                              ),
                                              char.responseTime,
                                            )}
                                            ${renderSlider(
                                              "thinkingTime",
                                              t(
                                                "characterModalSlider.thinkingTime.description",
                                              ),
                                              t(
                                                "characterModalSlider.thinkingTime.low",
                                              ),
                                              t(
                                                "characterModalSlider.thinkingTime.high",
                                              ),
                                              char.thinkingTime,
                                            )}
                                            ${renderSlider(
                                              "reactivity",
                                              t(
                                                "characterModalSlider.reactivity.description",
                                              ),
                                              t(
                                                "characterModalSlider.reactivity.low",
                                              ),
                                              t(
                                                "characterModalSlider.reactivity.high",
                                              ),
                                              char.reactivity,
                                            )}
                                            ${renderSlider(
                                              "tone",
                                              t(
                                                "characterModalSlider.tone.description",
                                              ),
                                              t(
                                                "characterModalSlider.tone.low",
                                              ),
                                              t(
                                                "characterModalSlider.tone.high",
                                              ),
                                              char.tone,
                                            )}
                                        </div>
                                    </div>
                                </details>
                            </div>
                        </div>
                    </details>
                    
                    ${!isNew ? `
                        <details class="group border-t border-gray-700 pt-4">
                            <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                                <h4 class="text-sm font-medium text-red-400">${t('hypnosis.hypnosisControl')}</h4>
                                <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                            </summary>
                            <div class="content-wrapper">
                                <div class="content-inner pt-4 space-y-4">
                                    <div class="bg-red-900/20 border border-red-700/30 rounded-lg p-3 text-xs text-red-300">
                                        <div class="flex items-center space-x-2 mb-2">
                                            <i data-lucide="alert-triangle" class="w-4 h-4"></i>
                                            <span class="font-medium">${t('hypnosis.dangerousFeature')}</span>
                                        </div>
                                        <p>${t('hypnosis.settingsWarning')}</p>
                                    </div>

                                    <div class="flex items-center justify-between">
                                        <label class="text-sm font-medium text-gray-300">${t('hypnosis.enabled')}</label>
                                        <input type="checkbox" id="hypnosis-enabled" ${char.hypnosis?.enabled ? 'checked' : ''} 
                                               class="bg-gray-700 border-gray-600 text-red-600 focus:ring-red-500 rounded">
                                    </div>

                                    <div id="hypnosis-controls" class="${char.hypnosis?.enabled ? '' : 'opacity-50 pointer-events-none'} space-y-4">
                                        
                                        <!-- SNS 편집 권한 -->
                                        <div class="flex items-center justify-between p-3 bg-red-900/20 rounded-lg border border-red-800/30">
                                            <div class="flex flex-col">
                                                <label class="text-sm font-medium text-gray-300">SNS 내용 편집 권한</label>
                                                <p class="text-xs text-gray-400">SNS 글 수정/삭제 기능 활성화</p>
                                            </div>
                                            <input type="checkbox" id="hypnosis-sns-edit" ${char.hypnosis?.sns_edit_access ? 'checked' : ''} 
                                                   class="accent-red-500">
                                        </div>
                                        
                                        <!-- 호감도 조작 활성화 토글 -->
                                        <div class="flex items-center justify-between p-3 bg-red-900/20 rounded-lg border border-red-800/30">
                                            <div class="flex flex-col">
                                                <label class="text-sm font-medium text-gray-300">호감도 조작 활성화</label>
                                                <p class="text-xs text-gray-400">호감도 수치를 강제로 조작합니다</p>
                                            </div>
                                            <input type="checkbox" id="hypnosis-affection-override" ${char.hypnosis?.affection_override ? 'checked' : ''} 
                                                   class="accent-red-500">
                                        </div>

                                        <!-- 호감도 조작 컨트롤 -->
                                        <div id="affection-controls" class="${char.hypnosis?.affection_override ? '' : 'opacity-50 pointer-events-none'} space-y-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-300 mb-2">${t('hypnosis.affectionControl')}</label>
                                            <input type="range" id="hypnosis-affection" min="0" max="100" 
                                                   value="${char.hypnosis?.enabled && char.hypnosis?.affection !== null ? Math.round(char.hypnosis.affection * 100) : (currentCharacterState?.affection !== undefined ? Math.round(currentCharacterState.affection * 100) : 50)}"
                                                   class="w-full accent-red-500"
                                                   oninput="document.getElementById('hypnosis-affection-value').textContent = this.value + '%'">
                                            <div class="flex justify-between text-xs text-gray-400 mt-1">
                                                <span>0%</span>
                                                <span id="hypnosis-affection-value">${char.hypnosis?.enabled && char.hypnosis?.affection !== null ? Math.round(char.hypnosis.affection * 100) : (currentCharacterState?.affection !== undefined ? Math.round(currentCharacterState.affection * 100) : 50)}%</span>
                                                <span>100%</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-300 mb-2">${t('hypnosis.intimacyControl')}</label>
                                            <input type="range" id="hypnosis-intimacy" min="0" max="100" 
                                                   value="${char.hypnosis?.enabled && char.hypnosis?.intimacy !== null ? Math.round(char.hypnosis.intimacy * 100) : (currentCharacterState?.intimacy !== undefined ? Math.round(currentCharacterState.intimacy * 100) : 50)}"
                                                   class="w-full accent-red-500"
                                                   oninput="document.getElementById('hypnosis-intimacy-value').textContent = this.value + '%'">
                                            <div class="flex justify-between text-xs text-gray-400 mt-1">
                                                <span>0%</span>
                                                <span id="hypnosis-intimacy-value">${char.hypnosis?.enabled && char.hypnosis?.intimacy !== null ? Math.round(char.hypnosis.intimacy * 100) : (currentCharacterState?.intimacy !== undefined ? Math.round(currentCharacterState.intimacy * 100) : 50)}%</span>
                                                <span>100%</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-300 mb-2">${t('hypnosis.trustControl')}</label>
                                            <input type="range" id="hypnosis-trust" min="0" max="100" 
                                                   value="${char.hypnosis?.enabled && char.hypnosis?.trust !== null ? Math.round(char.hypnosis.trust * 100) : (currentCharacterState?.trust !== undefined ? Math.round(currentCharacterState.trust * 100) : 50)}"
                                                   class="w-full accent-red-500"
                                                   oninput="document.getElementById('hypnosis-trust-value').textContent = this.value + '%'">
                                            <div class="flex justify-between text-xs text-gray-400 mt-1">
                                                <span>0%</span>
                                                <span id="hypnosis-trust-value">${char.hypnosis?.enabled && char.hypnosis?.trust !== null ? Math.round(char.hypnosis.trust * 100) : (currentCharacterState?.trust !== undefined ? Math.round(currentCharacterState.trust * 100) : 50)}%</span>
                                                <span>100%</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-300 mb-2">${t('hypnosis.romanceControl')}</label>
                                            <input type="range" id="hypnosis-romantic" min="0" max="100" 
                                                   value="${char.hypnosis?.enabled && char.hypnosis?.romantic_interest !== null ? Math.round(char.hypnosis.romantic_interest * 100) : (currentCharacterState?.romantic_interest !== undefined ? Math.round(currentCharacterState.romantic_interest * 100) : 0)}"
                                                   class="w-full accent-red-500"
                                                   oninput="document.getElementById('hypnosis-romantic-value').textContent = this.value + '%'">
                                            <div class="flex justify-between text-xs text-gray-400 mt-1">
                                                <span>0%</span>
                                                <span id="hypnosis-romantic-value">${char.hypnosis?.enabled && char.hypnosis?.romantic_interest !== null ? Math.round(char.hypnosis.romantic_interest * 100) : (currentCharacterState?.romantic_interest !== undefined ? Math.round(currentCharacterState.romantic_interest * 100) : 0)}%</span>
                                                <span>100%</span>
                                            </div>
                                        </div>
                                        </div>
                                        
                                        <!-- 추가 최면 제어 옵션들 -->
                                        <div class="border-t border-gray-700 pt-4 space-y-3">
                                            <div class="flex items-center justify-between">
                                                <label class="text-sm font-medium text-gray-300">${t('hypnosis.forceLoveUnlock')}</label>
                                                <input type="checkbox" id="hypnosis-force-love" ${char.hypnosis?.force_love_unlock ? 'checked' : ''} 
                                                       class="bg-gray-700 border-gray-600 text-red-600 focus:ring-red-500 rounded">
                                            </div>
                                            <div class="flex items-center justify-between">
                                                <label class="text-sm font-medium text-gray-300">${t('hypnosis.snsFullAccess')}</label>
                                                <input type="checkbox" id="hypnosis-sns-access" ${char.hypnosis?.sns_full_access ? 'checked' : ''} 
                                                       class="bg-gray-700 border-gray-600 text-red-600 focus:ring-red-500 rounded">
                                            </div>
                                            <div class="flex items-center justify-between">
                                                <label class="text-sm font-medium text-gray-300">${t('hypnosis.secretAccountAccess')}</label>
                                                <input type="checkbox" id="hypnosis-secret-account" ${char.hypnosis?.secret_account_access ? 'checked' : ''} 
                                                       class="bg-gray-700 border-gray-600 text-red-600 focus:ring-red-500 rounded">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </details>
                    ` : ''}
                </div>
                <div class="p-6 mt-auto border-t border-gray-700 shrink-0 flex justify-end space-x-3">
                    <button id="close-character-modal" data-action="close-character-modal" class="flex-1 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">${t(
                      "common.cancel",
                    )}</button>
                    <button id="save-character" class="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">${t(
                      "common.save",
                    )}</button>
                </div>
            </div>
        </div>
    `;
}
