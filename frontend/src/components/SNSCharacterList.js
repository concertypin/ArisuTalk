import { t } from "../i18n.js";

export function renderSNSCharacterList(app) {
  const characters = app.state.characters.filter(char => char.id !== 0);
  const searchTerm = app.state.snsCharacterSearchTerm || '';
  
  const filteredCharacters = characters.filter(char => 
    char.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const accessibleCharacters = [];
  const inaccessibleCharacters = [];

  filteredCharacters.forEach(char => {
    const hasAccess = app.checkSNSAccess(char, 'public');
    if (hasAccess) {
      accessibleCharacters.push(char);
    } else {
      inaccessibleCharacters.push(char);
    }
  });

  return `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-gray-900 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-white">${t('sns.characterListTitle')}</h2>
          <button id="close-sns-character-list" class="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
            <i data-lucide="x" class="w-5 h-5 text-gray-300 pointer-events-none"></i>
          </button>
        </div>

        <div class="mb-4">
          <div class="relative">
            <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              id="sns-character-search"
              placeholder="${t('sns.characterList.searchPlaceholder')}"
              class="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
              value="${searchTerm}"
            />
          </div>
        </div>

        ${accessibleCharacters.length > 0 ? `
          <div class="mb-6">
            <h3 class="text-sm font-medium text-green-400 mb-3">${t('sns.characterList.availableCharacters')}</h3>
            <div class="space-y-2">
              ${accessibleCharacters.map(char => renderCharacterListItem(app, char, true)).join('')}
            </div>
          </div>
        ` : ''}

        ${inaccessibleCharacters.length > 0 ? `
          <div>
            <h3 class="text-sm font-medium text-red-400 mb-3">${t('sns.characterList.noAccessCharacters')}</h3>
            <div class="space-y-2">
              ${inaccessibleCharacters.map(char => renderCharacterListItem(app, char, false)).join('')}
            </div>
          </div>
        ` : ''}

        ${filteredCharacters.length === 0 ? `
          <div class="text-center py-8 text-gray-400">
            ${searchTerm ? t('sns.characterList.noSearchResults', { searchTerm }) : t('sns.characterList.noCharacters')}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function renderCharacterListItem(app, char, hasAccess) {
  const state = app.getCharacterState(char.id) || {
    affection: 0.2,
    intimacy: 0.2,
    trust: 0.2,
    romantic_interest: 0
  };

  return `
    <div class="character-list-item ${hasAccess ? 'accessible' : 'inaccessible'} bg-gray-800 p-3 rounded-lg ${hasAccess ? 'cursor-pointer hover:bg-gray-700' : 'cursor-not-allowed opacity-60'}" 
         data-character-id="${char.id}" 
         ${hasAccess ? 'data-action="open-sns"' : ''}>
      <div class="flex items-center space-x-3">
        <div class="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
          ${char.avatar ? 
            `<img src="${char.avatar}" alt="${char.name}" class="w-full h-full object-cover" />` : 
            `<i data-lucide="instagram" class="w-6 h-6 text-gray-400"></i>`
          }
        </div>
        <div class="flex-1">
          <h4 class="font-medium text-white">${char.name}</h4>
          <div class="text-xs text-gray-400 space-y-1">
            <div class="flex justify-between">
              <span>${t('sns.characterList.affectionLevel', { level: Math.round(state.affection * 100) })}</span>
              <span>${t('sns.characterList.intimacyLevel', { level: Math.round(state.intimacy * 100) })}</span>
            </div>
            <div class="flex justify-between">
              <span>${t('sns.characterList.trustLevel', { level: Math.round(state.trust * 100) })}</span>
              <span>${t('sns.characterList.romanceLevel', { level: Math.round(state.romantic_interest * 100) })}</span>
            </div>
          </div>
        </div>
        ${hasAccess ? `
          <i data-lucide="chevron-right" class="w-4 h-4 text-gray-400"></i>
        ` : `
          <i data-lucide="lock" class="w-4 h-4 text-red-400"></i>
        `}
      </div>
    </div>
  `;
}