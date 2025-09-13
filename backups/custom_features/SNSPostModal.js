import { t } from "../i18n.js";

export function renderSNSPostModal(app) {
  const editingPost = app.state.editingSNSPost;
  if (!editingPost) return '';

  const character = app.state.characters.find(char => char.id === editingPost.characterId);
  if (!character) return '';

  const isNew = editingPost.isNew;
  const title = isNew ? t('sns.createPost') : t('sns.editPost');
  const secretText = editingPost.isSecret ? `(${t('sns.secretAccount')})` : `(${t('sns.mainAccount')})`;

  // 스티커 URL 가져오기 헬퍼 함수
  function getStickerUrl(stickerId) {
    if (!character.stickers || !stickerId) return '';
    const sticker = character.stickers.find(s => s.id === stickerId || s.id == stickerId);
    return sticker ? (sticker.data || sticker.dataUrl || '') : '';
  }

  return `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-white">${title} ${secretText}</h2>
          <button id="close-sns-post-modal" class="text-gray-400 hover:text-white">
            <i data-lucide="x" class="w-5 h-5 pointer-events-none"></i>
          </button>
        </div>
        
        <div class="mb-4">
          <div class="flex items-center gap-3 mb-3">
            ${character.avatar ? 
              `<img src="${character.avatar}" alt="${character.name}" class="w-10 h-10 rounded-full object-cover">` :
              `<div class="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                <i data-lucide="user" class="w-6 h-6 text-gray-400"></i>
              </div>`
            }
            <div>
              <span class="text-white font-medium">${character.name}</span>
              <div class="text-xs text-gray-400">${editingPost.isSecret ? t('sns.secretAccountWarning') : ''}</div>
            </div>
          </div>
          
          <!-- 스티커 선택 영역 -->
          ${editingPost.stickerId ? `
            <div class="mb-4 bg-gray-700 rounded-lg p-4">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm text-gray-300">${t('sns.selectedSticker')}</span>
                <button id="remove-post-sticker" class="text-red-400 hover:text-red-300 text-sm">
                  ${t('common.remove')}
                </button>
              </div>
              <div class="bg-gray-600 rounded p-3">
                <img src="${getStickerUrl(editingPost.stickerId)}" 
                     alt="Selected sticker" 
                     class="max-w-full max-h-32 mx-auto object-contain" />
              </div>
            </div>
          ` : ''}
          
          <div class="mb-3">
            <button id="select-post-sticker" class="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors">
              <i data-lucide="image" class="w-4 h-4 inline mr-2 pointer-events-none"></i>
              ${editingPost.stickerId ? t('sns.changeSticker') : t('sns.selectSticker')}
            </button>
          </div>
          
          <!-- 스티커 선택 패널 (숨김 상태) -->
          <div id="sticker-selection-panel" class="hidden mb-4 bg-gray-700 rounded-lg p-3 max-h-48 overflow-y-auto">
            <div class="grid grid-cols-4 gap-2">
              ${character.stickers && character.stickers.length > 0 ? 
                character.stickers.map(sticker => `
                  <button class="sticker-option p-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors" 
                          data-sticker-id="${sticker.id}">
                    <img src="${sticker.data || sticker.dataUrl}" 
                         alt="${sticker.name}" 
                         class="w-full h-16 object-contain" />
                    <div class="text-xs text-gray-400 mt-1 truncate">${sticker.name || ''}</div>
                  </button>
                `).join('') : 
                `<div class="col-span-4 text-center text-gray-400 py-4">${t('sns.noStickers')}</div>`
              }
            </div>
          </div>
          
          <textarea 
            id="sns-post-content" 
            class="w-full bg-gray-700 text-white rounded-lg p-3 resize-none h-32 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            placeholder="${t('sns.postPlaceholder')}"
          >${editingPost.content || ''}</textarea>
          
          <!-- 태그 입력 영역 -->
          <div class="mt-3">
            <label class="text-sm text-gray-400 mb-1 block">${t('sns.tags')}</label>
            <div class="flex flex-wrap gap-1 mb-2" id="post-tags-display">
              ${editingPost.tags && editingPost.tags.length > 0 ? 
                editingPost.tags.map(tag => `
                  <span class="px-2 py-1 bg-blue-900 bg-opacity-30 text-blue-400 text-xs rounded-full flex items-center gap-1">
                    #${tag}
                    <button class="remove-tag text-blue-300 hover:text-red-400" data-tag="${tag}">
                      <i data-lucide="x" class="w-3 h-3 pointer-events-none"></i>
                    </button>
                  </span>
                `).join('') : ''
              }
            </div>
            <div class="flex gap-2">
              <input 
                type="text" 
                id="sns-post-tag-input" 
                class="flex-1 bg-gray-700 text-white rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="${t('sns.addTag')}"
              />
              <button id="add-post-tag" class="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors">
                ${t('common.add')}
              </button>
            </div>
          </div>
          
          <!-- 접근 권한 설정 -->
          <div class="mt-3">
            <label class="text-sm text-gray-400 mb-1 block">${t('sns.accessLevel')}</label>
            <select id="post-access-level" class="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              ${editingPost.isSecret ? `
                <option value="secret-public" ${editingPost.accessLevel === 'secret-public' ? 'selected' : ''}>
                  ${t('sns.secretPublic')} - ${t('sns.secretPublicDesc')}
                </option>
                <option value="secret-private" ${editingPost.accessLevel === 'secret-private' ? 'selected' : ''}>
                  ${t('sns.secretPrivate')} - ${t('sns.secretPrivateDesc')}
                </option>
              ` : `
                <option value="main-public" ${!editingPost.accessLevel || editingPost.accessLevel === 'main-public' ? 'selected' : ''}>
                  ${t('sns.mainPublic')} - ${t('sns.mainPublicDesc')}
                </option>
                <option value="main-private" ${editingPost.accessLevel === 'main-private' ? 'selected' : ''}>
                  ${t('sns.mainPrivate')} - ${t('sns.mainPrivateDesc')}
                </option>
              `}
            </select>
          </div>
          
          <!-- 중요도 설정 -->
          <div class="mt-3">
            <label class="text-sm text-gray-400 mb-1 block">
              ${t('sns.importance')}: <span id="importance-value">${editingPost.importance || 5}</span>
            </label>
            <input 
              type="range" 
              id="post-importance" 
              min="1" 
              max="10" 
              value="${editingPost.importance || 5}"
              class="w-full"
            />
          </div>
        </div>
        
        <div class="flex gap-3 justify-end">
          <button id="cancel-sns-post" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors">
            ${t('common.cancel')}
          </button>
          <button id="save-sns-post" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors">
            ${isNew ? t('common.create') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  `;
}