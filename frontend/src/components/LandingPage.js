import { t } from "../i18n.js";

export function renderLandingPage() {
  return `
    <div class="flex-1 flex flex-col items-center justify-center text-center p-4 bg-gray-950">
        <div class="max-w-md">
            <div class="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <i data-lucide="message-circle" class="w-12 h-12 text-white"></i>
            </div>
            <h2 class="text-3xl font-bold text-white mb-3">${t("landing.welcomeTitle")}</h2>
            <p class="text-gray-400 leading-relaxed mb-8">${t("landing.welcomeMessage")}</p>
            <div class="flex justify-center gap-4">
                <button id="landing-new-character-btn" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md">
                    <i data-lucide="plus" class="w-4 h-4 mr-2 inline-block"></i>
                    ${t("landing.newCharacterButton")}
                </button>
                <button id="landing-select-character-btn" class="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors">
                    ${t("landing.selectCharacterButton")}
                </button>
            </div>
        </div>
    </div>
  `;
}

export function setupLandingPageEventListeners() {
  const newCharacterBtn = document.getElementById("landing-new-character-btn");
  if (newCharacterBtn) {
    newCharacterBtn.addEventListener("click", () => {
      window.personaApp.openNewCharacterModal();
    });
  }

  const selectCharacterBtn = document.getElementById(
    "landing-select-character-btn",
  );
  if (selectCharacterBtn) {
    selectCharacterBtn.addEventListener("click", () => {
      const sidebar = document.getElementById("sidebar");
      if (sidebar.classList.contains("-translate-x-full")) {
        window.personaApp.setState({ sidebarCollapsed: false });
      }
    });
  }
}
