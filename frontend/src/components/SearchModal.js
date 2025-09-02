import { t } from "../i18n.js";
import { renderCharacterItem } from "./CharacterListPage.js";

function renderSearchResults(app) {
  const searchQuery = app.state.searchQuery.toLowerCase().trim();
  const filteredCharacters = searchQuery
    ? app.state.characters.filter((char) =>
        char.name.toLowerCase().includes(searchQuery),
      )
    : [];

  let resultsHtml = "";
  if (searchQuery) {
    if (filteredCharacters.length > 0) {
      resultsHtml = filteredCharacters
        .map((char) => renderCharacterItem(app, char))
        .join("");
    } else {
      resultsHtml = `
        <div class="text-center text-gray-400 py-12 animate-fadeIn">
            <i data-lucide="search-x" class="w-12 h-12 mx-auto mb-4"></i>
            <p>${t("search.noResults")}</p>
        </div>`;
    }
  } else {
    resultsHtml = `
        <div class="text-center text-gray-400 py-12 animate-fadeIn">
            <i data-lucide="search" class="w-12 h-12 mx-auto mb-4"></i>
            <p>${t("search.prompt")}</p>
        </div>`;
  }
  return `<div class="character-list space-y-2 p-2">${resultsHtml}</div>`;
}

export function renderSearchModal(app) {
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
                ${renderSearchResults(app)}
            </div>
        </div>
    </div>
  `;
}

export function updateSearchResults(app) {
  const modalContent = document.querySelector(".search-modal-content");
  const container = document.querySelector(".search-results-container");

  if (app.isSearchModalAnimating) {
    app.pendingSearchUpdate = true;
    return;
  }

  if (container && modalContent) {
    requestAnimationFrame(() => {
      const oldHeight = modalContent.offsetHeight;

      container.innerHTML = renderSearchResults(app);
      lucide.createIcons();

      const scrollHeight = modalContent.scrollHeight;
      const vh85 = window.innerHeight * 0.85;
      const newHeight = Math.min(scrollHeight, vh85);

      if (Math.abs(oldHeight - newHeight) < 5) {
        if (modalContent.style.height) modalContent.style.height = "";
        return;
      }

      app.isSearchModalAnimating = true;

      modalContent.style.transition = "none";
      modalContent.style.height = `${oldHeight}px`;
      modalContent.offsetHeight; // Force reflow

      modalContent.style.transition = `height 0.4s cubic-bezier(0.4, 0, 0.2, 1)`;
      modalContent.style.height = `${newHeight}px`;

      setTimeout(() => {
        app.isSearchModalAnimating = false;
        modalContent.style.transition = "";
        modalContent.style.height = ""; // Reset height to allow natural flow

        if (app.pendingSearchUpdate) {
          app.pendingSearchUpdate = false;
          Promise.resolve().then(() => updateSearchResults(app));
        }
      }, 450);
    });
  }
}
