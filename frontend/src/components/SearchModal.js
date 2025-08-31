import { t } from '../i18n.js';
import { renderCharacterItem } from './CharacterListPage.js';

export function renderSearchModal(app) {
  const searchQuery = app.state.searchQuery.toLowerCase().trim();
  const filteredCharacters = searchQuery
    ? app.state.characters.filter((char) =>
        char.name.toLowerCase().includes(searchQuery),
      )
    : [];

  let resultsHtml = ``;
  if (searchQuery) {
    if (filteredCharacters.length > 0) {
      resultsHtml = filteredCharacters.map((char) => renderCharacterItem(app, char)).join("");
    } else {
      resultsHtml = `
        <div class="text-center text-gray-400 py-12">
            <i data-lucide="search-x" class="w-12 h-12 mx-auto mb-4"></i>
            <p>${t("search.noResults")}</p>
        </div>`;
    }
  } else {
    resultsHtml = `
        <div class="text-center text-gray-400 py-12">
            <i data-lucide="search" class="w-12 h-12 mx-auto mb-4"></i>
            <p>${t("search.prompt")}</p>
        </div>`;
  }

  return `
    <div id="search-modal-backdrop" class="modal-backdrop animate-fadeIn"></div>
    <div class="search-modal-container p-4 pt-16 md:pt-24 fixed inset-0 z-50 overflow-y-auto animate-fadeIn">
        <div class="search-modal-content bg-gray-800 rounded-2xl shadow-lg w-full max-w-lg mx-auto flex flex-col max-h-[85vh]">
            <header class="p-4 flex-shrink-0 flex items-center gap-4 border-b border-gray-700">
                <i data-lucide="search" class="w-5 h-5 text-gray-400"></i>
                <input id="search-modal-input" type="text" placeholder="${t("sidebar.searchPlaceholder")}" value="${app.state.searchQuery}" 
                       class="flex-1 w-full bg-transparent text-white placeholder-gray-500 focus:outline-none text-lg" autofocus />
                <button id="close-search-modal-btn" class="p-2 -mr-2 rounded-full hover:bg-gray-700">
                    <i data-lucide="x" class="w-5 h-5 text-gray-300"></i>
                </button>
            </header>
            <div class="search-results-container flex-1 overflow-y-auto p-2">
                <div class="character-list space-y-2 p-2">
                    ${resultsHtml}
                </div>
            </div>
        </div>
    </div>
  `;
}
