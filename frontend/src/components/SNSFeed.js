import { t } from "../i18n.js";

// 스티커 URL을 가져오는 헬퍼 함수
function getStickerUrl(character, stickerId) {
  if (!character.stickers) {
    return '';
  }
  
  // 문자열과 숫자 비교 모두 시도하여 스티커 찾기
  let sticker = character.stickers.find(s => s.id === stickerId);
  if (!sticker) {
    // 타입 변환해서 재시도
    sticker = character.stickers.find(s => s.id == stickerId); // == 사용 (타입 무시)
  }
  if (!sticker) {
    // 문자열로 변환해서 재시도
    sticker = character.stickers.find(s => String(s.id) === String(stickerId));
  }
  
  if (!sticker) {
    return '';
  }
  
  // 메인 채팅과 동일한 방식으로 data 또는 dataUrl 사용
  return sticker.data || sticker.dataUrl || '';
}

export function renderSNSFeed(app) {
  const character = app.state.characters.find(char => char.id === app.state.selectedSNSCharacter);
  if (!character) return '';

  const isSecretMode = app.state.snsSecretMode;
  const activeTab = app.state.snsActiveTab || 'posts';
  
  // Check access permissions
  const requiredLevel = isSecretMode ? 'private' : 'public';
  const hasAccess = app.checkSNSAccess(character, requiredLevel);
  
  return `
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-gray-900 rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl border border-gray-700">
        ${renderSNSHeader(character, isSecretMode, hasAccess)}
        
        ${hasAccess ? `
          ${renderSNSNav(activeTab, isSecretMode)}
          <div class="overflow-y-auto max-h-[calc(90vh-200px)]">
            ${renderSNSContent(character, activeTab, isSecretMode, app)}
          </div>
        ` : renderAccessDenied(character, requiredLevel)}
      </div>
    </div>
  `;
}

function renderSNSHeader(character, isSecretMode, hasAccess) {
  const hasWriteAccess = character?.hypnosis?.enabled && character?.hypnosis?.sns_edit_access;
  
  return `
    <div class="relative ${isSecretMode ? 'bg-gradient-to-r from-red-900 to-pink-900' : 'bg-gradient-to-r from-purple-900 to-pink-900'} p-6 text-white rounded-t-xl">
      <button id="close-sns-feed" class="absolute top-4 right-4 p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
        <i data-lucide="x" class="w-5 h-5 text-gray-300 pointer-events-none"></i>
      </button>
      
      ${hasWriteAccess ? `
        <button class="create-sns-post absolute top-4 right-16 p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                data-character-id="${character.id}"
                data-secret-mode="${isSecretMode}"
                title="새 포스트 작성">
          <i data-lucide="plus" class="w-5 h-5 text-gray-300 pointer-events-none"></i>
        </button>
      ` : ''}
      
      <div class="flex items-center space-x-4 mb-4">
        <div class="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center overflow-hidden">
          ${character.avatar ? 
            `<img src="${character.avatar}" alt="${character.name}" class="w-full h-full object-cover" />` : 
            `<i data-lucide="instagram" class="w-8 h-8"></i>`
          }
        </div>
        <div>
          <h2 class="text-xl font-bold">${character.name}</h2>
          <p class="text-sm opacity-90">
            ${isSecretMode ? t('sns.secretAccount') : t('sns.mainAccount')}
          </p>
        </div>
      </div>
      
      ${hasAccess ? `
        <div class="flex items-center justify-between">
          <div class="flex space-x-4 text-sm">
            <div class="text-center">
              <div class="font-bold">${getSNSPostCount(character, false, app)}</div>
              <div class="opacity-75">${t('sns.posts')}</div>
            </div>
            <div class="text-center">
              <div class="font-bold">${getSNSPostCount(character, true, app)}</div>
              <div class="opacity-75">${t('sns.secrets')}</div>
            </div>
            <div class="text-center">
              <div class="font-bold">${getSNSTagCount(character)}</div>
              <div class="opacity-75">${t('sns.tags')}</div>
            </div>
          </div>
          
          <button id="toggle-secret-mode" class="px-4 py-2 rounded-full ${isSecretMode ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-800 hover:bg-gray-700'} text-sm font-medium transition-colors">
            ${isSecretMode ? t('sns.mainAccount') : t('sns.secretAccount')}
          </button>
        </div>
      ` : ''}
      
      ${isSecretMode ? `
        <div class="mt-3 text-xs opacity-75">
          <i data-lucide="alert-triangle" class="w-3 h-3 inline mr-1"></i>
          ${t('sns.secretAccountWarning')}
        </div>
      ` : ''}
    </div>
  `;
}

function renderSNSNav(activeTab, isSecretMode) {
  const tabs = ['posts', 'secrets', 'tags'];
  
  return `
    <div class="flex border-b border-gray-800">
      ${tabs.map(tab => `
        <button 
          class="sns-tab flex-1 py-4 text-sm font-medium ${activeTab === tab ? 
            `text-${isSecretMode ? 'red' : 'pink'}-500 border-b-2 border-${isSecretMode ? 'red' : 'pink'}-500 bg-gray-800/50` : 
            'text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
          } transition-colors relative" 
          data-tab="${tab}">
          ${t(`sns.${tab}Tab`)}
        </button>
      `).join('')}
    </div>
  `;
}

function renderSNSContent(character, activeTab, isSecretMode, app) {
  const themeClass = isSecretMode ? 'secret-theme' : 'main-theme';
  
  switch (activeTab) {
    case 'posts':
      return renderPosts(character, isSecretMode, themeClass, app);
    case 'secrets':
      return renderSecrets(character, isSecretMode, themeClass, app);
    case 'tags':
      return renderTags(character, isSecretMode, themeClass);
    default:
      return renderPosts(character, isSecretMode, themeClass, app);
  }
}

function renderPosts(character, isSecretMode, themeClass, app) {
  // Get real SNS posts from character data
  const posts = getCharacterSNSPosts(character, isSecretMode, app);
  
  if (posts.length === 0) {
    return `
      <div class="text-center py-12 text-gray-400">
        <i data-lucide="image" class="w-12 h-12 mx-auto mb-4 opacity-50"></i>
        <p>${t('sns.noPostsAvailable')}</p>
      </div>
    `;
  }
  
  return `
    <div class="p-4 space-y-6">
      ${posts.map(post => renderSNSPost(post, isSecretMode, character)).join('')}
    </div>
  `;
}

function renderPost(post, isSecretMode) {
  return `
    <div class="bg-gray-800 rounded-lg overflow-hidden">
      ${post.image ? `
        <img src="${post.image}" alt="Post image" class="w-full h-64 object-cover" />
      ` : ''}
      
      <div class="p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-3">
            <i data-lucide="heart" class="w-5 h-5 text-red-500"></i>
            <span class="text-sm text-gray-400">${post.likes} ${t('sns.likes')}</span>
            <i data-lucide="message-circle" class="w-5 h-5 text-gray-400"></i>
            <span class="text-sm text-gray-400">${post.comments} ${t('sns.comments')}</span>
          </div>
          <span class="text-xs text-gray-500">${formatTimeAgo(post.timestamp)}</span>
        </div>
        
        <p class="text-gray-300 text-sm leading-relaxed">${post.caption}</p>
        
        ${post.accessLevel !== 'public' ? `
          <div class="mt-2 text-xs ${isSecretMode ? 'text-red-400' : 'text-pink-400'}">
            <i data-lucide="lock" class="w-3 h-3 inline mr-1"></i>
            ${t(`sns.accessLevel.${post.accessLevel}`)}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function renderSecrets(character, isSecretMode, themeClass, app) {
  // Get real secret SNS posts from character data
  const secretPosts = getCharacterSNSPosts(character, true, app); // Always secret posts
  
  if (secretPosts.length === 0) {
    return `
      <div class="text-center py-12 text-gray-400">
        <i data-lucide="lock" class="w-12 h-12 mx-auto mb-4 opacity-50"></i>
        <p>${t('sns.noSecretsAvailable')}</p>
      </div>
    `;
  }
  
  return `
    <div class="p-4 space-y-6">
      <div class="text-center py-2 text-red-400 text-xs border-b border-gray-800 mb-4">
        <i data-lucide="shield-alert" class="w-4 h-4 inline mr-1"></i>
        ${t('sns.secretPostsWarning')}
      </div>
      ${secretPosts.map(post => renderSNSPost(post, true, character)).join('')}
    </div>
  `;
}

function renderTags(character, isSecretMode, themeClass) {
  // Get real tags from character's SNS posts
  const allTags = getCharacterSNSTags(character);
  
  if (allTags.length === 0) {
    return `
      <div class="text-center py-12 text-gray-400">
        <i data-lucide="hash" class="w-12 h-12 mx-auto mb-4 opacity-50"></i>
        <p>${t('sns.noTagsAvailable')}</p>
      </div>
    `;
  }
  
  return `
    <div class="p-4 space-y-4">
      <div class="text-center py-2 text-gray-400 text-xs border-b border-gray-800 mb-4">
        ${t('sns.tagsDescription')}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${allTags.map(tag => renderTagCard(tag, isSecretMode)).join('')}
      </div>
    </div>
  `;
}

function renderAccessDenied(character, requiredLevel) {
  return `
    <div class="p-8 text-center">
      <i data-lucide="lock" class="w-16 h-16 mx-auto mb-4 text-red-500"></i>
      <h3 class="text-xl font-bold text-white mb-2">${t('sns.accessDenied')}</h3>
      <p class="text-gray-400 mb-4">${t('sns.accessDeniedDescription')}</p>
      
      <div class="bg-gray-800 rounded-lg p-4 mb-4">
        <h4 class="text-sm font-medium text-gray-300 mb-2">필요 권한:</h4>
        <div class="text-xs text-red-400 space-y-1">
          <div>${t('sns.requiresAffection', { level: 75 })}</div>
          <div>${t('sns.requiresIntimacy', { level: 60 })}</div>
          <div>${t('sns.requiresTrust', { level: 80 })}</div>
          <div>${t('sns.requiresRomance', { level: 50 })}</div>
        </div>
      </div>
      
      <div class="space-y-3">
        <button id="back-to-main-account" class="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-colors">
          ${t('sns.backToMain')}
        </button>
        <button id="close-sns-feed" class="px-4 py-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
          ${t('common.close')}
        </button>
      </div>
    </div>
  `;
}

function getCharacterSNSPosts(character, secretMode = false, app = null) {
  if (!character.snsPosts || character.snsPosts.length === 0) {
    return [];
  }

  // Filter posts based on mode and show with access check
  return character.snsPosts
    .filter(post => {
      if (secretMode) {
        // In secret mode, show private and secret posts
        return post.access_level && (post.access_level.includes('private') || post.access_level.includes('secret'));
      } else {
        // In main mode, show only public posts
        return !post.access_level || post.access_level === 'main-public';
      }
    })
    .map(post => {
      // Check if user has access to this specific post
      const hasAccess = app && app.checkSNSAccess ? 
        app.checkSNSAccess(character, post.access_level || 'public') : true;
      
      return {
        id: post.id,
        caption: hasAccess ? post.content : t('sns.lockedContent'),
        content: hasAccess ? post.content : t('sns.lockedContent'), // content 필드도 추가
        likes: Math.floor(Math.random() * 100) + 1, // Mock likes for now
        comments: Math.floor(Math.random() * 20), // Mock comments for now  
        timestamp: new Date(post.timestamp).getTime(),
        image: null, // Could be extended later
        accessLevel: post.access_level,
        tags: hasAccess ? (post.tags || []) : ["🔒"],
        importance: post.memory_importance || 5,
        isBlocked: !hasAccess,
        stickerId: hasAccess ? post.stickerId : null // 스티커 ID 추가 (접근 권한 있을 때만)
      };
    })
    .sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first
}

function formatTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return t('sns.justNow');
  if (diff < 3600000) return t('sns.minutesAgo', { minutes: Math.floor(diff / 60000) });
  if (diff < 86400000) return t('sns.hoursAgo', { hours: Math.floor(diff / 3600000) });
  if (diff < 604800000) return t('sns.daysAgo', { days: Math.floor(diff / 86400000) });
  if (diff < 2592000000) return t('sns.weeksAgo', { weeks: Math.floor(diff / 604800000) });
  if (diff < 31536000000) return t('sns.monthsAgo', { months: Math.floor(diff / 2592000000) });
  
  return t('sns.yearsAgo', { years: Math.floor(diff / 31536000000) });
}

function renderSNSPost(post, isSecretMode, character) {
  const hasEditAccess = character?.hypnosis?.enabled && character?.hypnosis?.sns_edit_access;
  
  return `
    <div class="bg-gray-800/90 backdrop-blur-sm rounded-xl overflow-hidden relative group hover:shadow-lg transition-all duration-200 border border-gray-700/50" data-post-id="${post.id}">
      ${hasEditAccess ? `
        <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 flex space-x-2">
          <button class="edit-sns-post p-2 rounded-full bg-gray-800 hover:bg-blue-600 transition-colors" 
                  data-character-id="${character.id}" 
                  data-post-id="${post.id}"
                  title="포스트 편집">
            <i data-lucide="edit-3" class="w-4 h-4 text-gray-300 pointer-events-none"></i>
          </button>
          <button class="delete-sns-post p-2 rounded-full bg-gray-800 hover:bg-red-600 transition-colors" 
                  data-character-id="${character.id}" 
                  data-post-id="${post.id}"
                  title="포스트 삭제">
            <i data-lucide="trash-2" class="w-4 h-4 text-gray-300 pointer-events-none"></i>
          </button>
        </div>
      ` : ''}
      ${post.image ? `
        <img src="${post.image}" alt="Post image" class="w-full h-64 object-cover" />
      ` : ''}
      
      <div class="p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-3">
            <i data-lucide="heart" class="w-5 h-5 text-red-500"></i>
            <span class="text-sm text-gray-400">${post.likes} ${t('sns.likes')}</span>
            <i data-lucide="message-circle" class="w-5 h-5 text-gray-400"></i>
            <span class="text-sm text-gray-400">${post.comments} ${t('sns.comments')}</span>
            ${post.importance ? `
              <div class="flex items-center space-x-1">
                <i data-lucide="star" class="w-4 h-4 text-yellow-500"></i>
                <span class="text-xs text-yellow-400">${post.importance}</span>
              </div>
            ` : ''}
          </div>
          <span class="text-xs text-gray-500">${formatTimeAgo(post.timestamp)}</span>
        </div>
        
        <div class="sns-post-content">
          ${post.stickerId ? `
            <div class="mb-6 flex justify-center">
              <div class="bg-gray-700 rounded-xl p-6 max-w-sm w-full">
                <img src="${getStickerUrl(character, post.stickerId)}" 
                     alt="Sticker" 
                     class="w-full h-auto max-w-xs max-h-60 object-contain mx-auto" />
              </div>
            </div>
          ` : ''}
          <p class="text-gray-300 text-sm leading-relaxed">${post.content || post.caption || ''}</p>
        </div>
        
        ${post.tags && post.tags.length > 0 ? `
          <div class="mt-3 flex flex-wrap gap-1">
            ${post.tags.map(tag => `
              <span class="px-2 py-1 bg-blue-900 bg-opacity-30 text-blue-400 text-xs rounded-full">
                #${tag}
              </span>
            `).join('')}
          </div>
        ` : ''}
        
        ${post.accessLevel && post.accessLevel !== 'main-public' ? `
          <div class="mt-2 text-xs ${isSecretMode ? 'text-red-400' : 'text-pink-400'}">
            <i data-lucide="lock" class="w-3 h-3 inline mr-1"></i>
            ${t(`sns.accessLevel.${post.accessLevel}`) || post.accessLevel}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function getCharacterSNSTags(character) {
  if (!character.snsPosts || character.snsPosts.length === 0) {
    return [];
  }

  // Collect all tags from SNS posts
  const tagCounts = {};
  const tagLastUsed = {};
  const tagSecretStatus = {};

  character.snsPosts.forEach(post => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        const postTimestamp = new Date(post.timestamp).getTime();
        if (!tagLastUsed[tag] || postTimestamp > tagLastUsed[tag]) {
          tagLastUsed[tag] = postTimestamp;
        }
        // Tag is secret if used in any secret post
        if (post.access_level && post.access_level.includes('secret')) {
          tagSecretStatus[tag] = true;
        }
      });
    }
  });

  // Convert to array format
  return Object.keys(tagCounts).map(tagName => ({
    name: tagName,
    count: tagCounts[tagName],
    lastUsed: tagLastUsed[tagName] || Date.now(),
    isSecret: tagSecretStatus[tagName] || false
  })).sort((a, b) => b.count - a.count); // Sort by most used
}

function renderTagCard(tag, isSecretMode) {
  const tagColor = tag.isSecret ? 'text-red-400 border-red-900' : 'text-blue-400 border-blue-900';
  const bgColor = tag.isSecret ? 'bg-red-900 bg-opacity-20' : 'bg-blue-900 bg-opacity-20';
  
  return `
    <div class="tag-card ${bgColor} border ${tagColor} rounded-lg p-3 cursor-pointer hover:bg-opacity-30 transition-all">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center space-x-1">
          <i data-lucide="${tag.isSecret ? 'lock' : 'hash'}" class="w-3 h-3 ${tagColor}"></i>
          <span class="text-sm font-medium text-white">${tag.name}</span>
        </div>
        ${tag.isSecret ? `
          <i data-lucide="eye-off" class="w-3 h-3 text-red-400"></i>
        ` : ''}
      </div>
      
      <div class="text-xs text-gray-400 space-y-1">
        <div>${t('sns.postsCount', { count: tag.count })}</div>
        <div class="opacity-75">${formatTimeAgo(tag.lastUsed)}</div>
      </div>
    </div>
  `;
}

// Helper functions for getting real statistics
function getSNSPostCount(character, secretMode = false, app = null) {
  if (!character.snsPosts) return 0;
  
  return character.snsPosts.filter(post => {
    if (secretMode) {
      return post.access_level && (post.access_level.includes('private') || post.access_level.includes('secret'));
    } else {
      return !post.access_level || post.access_level === 'main-public';
    }
  }).length;
}

function getSNSTagCount(character) {
  if (!character.snsPosts) return 0;
  
  const uniqueTags = new Set();
  character.snsPosts.forEach(post => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach(tag => uniqueTags.add(tag));
    }
  });
  
  return uniqueTags.size;
}