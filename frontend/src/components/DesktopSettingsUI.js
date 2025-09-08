import { renderAPISettingsPanel } from "./settings/panels/APISettingsPanel.js";
import { renderAppearanceSettingsPanel } from "./settings/panels/AppearanceSettingsPanel.js";
import { renderCharacterDefaultsPanel } from "./settings/panels/CharacterDefaultsPanel.js";
import { renderDataManagementPanel } from "./settings/panels/DataManagementPanel.js";
import { renderAdvancedSettingsPanel } from "./settings/panels/AdvancedSettingsPanel.js";
import { renderNAISettingsPanel } from "./settings/panels/NAISettingsPanel.js";
import { setLanguage, t } from "../i18n.js";

/**
 * Renders the desktop-specific settings UI
 * @param {Object} app - Application instance
 * @returns {string} Desktop settings UI HTML
 */
export function renderDesktopSettingsUI(app) {
  const activePanel = app.state.ui?.desktopSettings?.activePanel || "api";

  return `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div class="bg-gray-800 rounded-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-700">
                <!-- 헤더 -->
                ${renderDesktopSettingsHeader()}
                
                <!-- 메인 콘텐츠 -->
                <div class="flex flex-1 min-h-0">
                    <!-- 사이드바 네비게이션 -->
                    ${renderDesktopSettingsNavigation(activePanel)}
                    
                    <!-- 콘텐츠 영역 -->
                    <div class="flex-1 flex flex-col min-w-0">
                        <!-- 콘텐츠 헤더 -->
                        ${renderContentHeader(activePanel)}
                        
                        <!-- 패널 콘텐츠 -->
                        <div class="flex-1 overflow-y-auto p-6" id="desktop-settings-content">
                            ${renderActivePanel(app, activePanel)}
                        </div>
                    </div>
                </div>
                
                <!-- 푸터 -->
                ${renderDesktopSettingsFooter()}
            </div>
        </div>
    `;
}

/**
 * Renders the desktop settings header
 * @returns {string} Header HTML
 */
function renderDesktopSettingsHeader() {
  return `
        <div class="flex items-center justify-between p-6 border-b border-gray-700 shrink-0">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <i data-lucide="settings" class="w-5 h-5 text-white"></i>
                </div>
                <div>
                    <h3 class="text-xl font-semibold text-white">${t(
                      "settings.title",
                    )}</h3>
                    <p class="text-sm text-gray-400">${t(
                      "settings.settingsDescription",
                    )}</p>
                </div>
            </div>
            <button id="close-settings-modal" class="p-2 hover:bg-gray-700 rounded-lg transition-colors group">
                <i data-lucide="x" class="w-6 h-6 text-gray-400 group-hover:text-white"></i>
            </button>
        </div>
    `;
}

/**
 * Renders the navigation sidebar
 * @param {string} activePanel - Currently active panel
 * @returns {string} Navigation HTML
 */
/**
 * 네비게이션 버튼의 CSS 클래스를 생성
 * @param {boolean} isActive - 활성 상태 여부
 * @returns {string} CSS 클래스 문자열
 */
function getNavButtonClasses(isActive) {
  const baseClasses = "w-full text-left p-3 rounded-lg transition-all duration-200 flex items-start gap-3";
  const activeClasses = "bg-blue-600/20 border border-blue-500/30 text-blue-400";
  const inactiveClasses = "hover:bg-gray-700/50 text-gray-300 hover:text-white";
  
  return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
}

function renderDesktopSettingsNavigation(activePanel) {
  const navItems = [
    {
      id: "api",
      icon: "globe",
      label: t("settings.aiSettings"),
      description: t("settings.apiDescription"),
    },
    {
      id: "nai",
      icon: "image", 
      label: "🧪 NAI 스티커 생성",
      description: "NovelAI 기반 스티커 자동 생성 설정",
    },
    {
      id: "appearance",
      icon: "palette",
      label: t("settings.appearanceSettings"),
      description: t("settings.appearanceDescription"),
    },
    {
      id: "character",
      icon: "user",
      label: t("settings.characterDefaults"),
      description: t("settings.characterDescription"),
    },
    {
      id: "data",
      icon: "hard-drive",
      label: t("settings.dataManagement"),
      description: t("settings.dataDescription"),
    },
    {
      id: "advanced",
      icon: "cog",
      label: t("settings.advancedSettings"),
      description: t("settings.advancedDescription"),
    },
  ];

  return `
        <div class="w-80 border-r border-gray-700 flex flex-col">
            <div class="p-4 border-b border-gray-700">
                <h4 class="text-sm font-medium text-gray-400 uppercase tracking-wider">${t(
                  "settings.settingsCategories",
                )}</h4>
            </div>
            <nav class="flex-1 p-4 space-y-2">
                ${navItems
                  .map(
                    (item) => `
                    <button 
                        class="${getNavButtonClasses(activePanel === item.id)}"
                        data-panel="${item.id}"
                        id="nav-${item.id}"
                    >
                        <div class="flex-shrink-0 w-5 h-5 mt-0.5">
                            <i data-lucide="${item.icon}" class="w-5 h-5"></i>
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="font-medium text-sm">${item.label}</div>
                            <div class="text-xs opacity-75 mt-0.5">${
                              item.description
                            }</div>
                        </div>
                    </button>
                `,
                  )
                  .join("")}
            </nav>
        </div>
    `;
}

/**
 * Renders the content header
 * @param {string} activePanel - Currently active panel
 * @returns {string} Content header HTML
 */
export function renderContentHeader(activePanel) {
  const panelTitles = {
    api: {
      title: t("settings.aiSettings"),
      subtitle: t("settings.apiSubtitle"),
    },
    nai: {
      title: "NAI 스티커 자동 생성",
      subtitle: "NovelAI를 활용한 캐릭터별 감정 스티커 자동 생성 설정",
    },
    appearance: {
      title: t("settings.appearanceSettings"),
      subtitle: t("settings.appearanceSubtitle"),
    },
    character: {
      title: t("settings.characterDefaults"),
      subtitle: t("settings.characterSubtitle"),
    },
    data: {
      title: t("settings.dataManagement"),
      subtitle: t("settings.dataSubtitle"),
    },
    advanced: {
      title: t("settings.advancedSettings"),
      subtitle: t("settings.advancedSubtitle"),
    },
  };

  const panel = panelTitles[activePanel] || panelTitles["api"];

  return `
        <div class="border-b border-gray-700 px-6 py-4 bg-gray-800/50">
            <h4 class="text-lg font-semibold text-white">${panel.title}</h4>
            <p class="text-sm text-gray-400 mt-1">${panel.subtitle}</p>
        </div>
    `;
}

/**
 * Renders the active panel content
 * @param {Object} app - Application instance
 * @param {string} activePanel - Currently active panel
 * @returns {string} Panel content HTML
 */
export function renderActivePanel(app, activePanel) {
  switch (activePanel) {
    case "api":
      return renderAPISettingsPanel(app);
    case "nai":
      return renderNAISettingsPanel(app);
    case "appearance":
      return renderAppearanceSettingsPanel(app);
    case "character":
      return renderCharacterDefaultsPanel(app);
    case "data":
      return renderDataManagementPanel(app);
    case "advanced":
      return renderAdvancedSettingsPanel(app);
    default:
      return renderAPISettingsPanel(app);
  }
}

/**
 * 데스크톱 설정 푸터 렌더링
 * @returns {string} 푸터 HTML
 */
function renderDesktopSettingsFooter() {
  return `
        <div class="border-t border-gray-700 p-6 bg-gray-800/50">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-sm text-gray-400">
                    <i data-lucide="info" class="w-4 h-4"></i>
                    <span>${t("settings.autoSaveInfo")}</span>
                </div>
                <div class="flex gap-3">
                    <button id="close-settings-modal" class="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                        ${t("settings.close")}
                    </button>
                    <button id="save-settings" class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                        ${t("settings.saveAndClose")}
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * 데스크톱 설정 콘텐츠를 즉시 업데이트하는 함수
 * @param {Object} app - 애플리케이션 인스턴스
 * @param {string} panelId - 활성화할 패널 ID
 */
export function updateDesktopSettingsContent(app, panelId) {
  // 콘텐츠 영역 업데이트
  const contentArea = document.getElementById("desktop-settings-content");
  const contentHeader = document.querySelector(
    ".border-b.border-gray-700.px-6.py-4",
  );

  if (contentArea) {
    contentArea.innerHTML = renderActivePanel(app, panelId);
  }

  if (contentHeader) {
    contentHeader.innerHTML = renderContentHeader(panelId).replace(
      /<div[^>]*>|<\/div>/g,
      "",
    );
  }

  // 네비게이션 버튼 활성 상태 업데이트
  document.querySelectorAll("[data-panel]").forEach((btn) => {
    const isActive = btn.dataset.panel === panelId;
    btn.className = getNavButtonClasses(isActive);
  });

  // 아이콘 다시 생성
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 새로운 콘텐츠에 대해 이벤트 리스너 다시 설정
  setupDesktopSettingsEventListeners(app);
}

/**
 * 데스크톱 설정 UI 이벤트 리스너 설정
 * @param {Object} app - 애플리케이션 인스턴스
 */
export function setupDesktopSettingsEventListeners(app) {
  // DOM이 완전히 로드될 때까지 기다린 후 이벤트 리스너 설정
  requestAnimationFrame(() => {
    // 네비게이션 패널 전환
    const panelButtons = document.querySelectorAll("[data-panel]");
    // console.log("Found panel buttons:", panelButtons.length); // 디버그 로그

    panelButtons.forEach((button) => {
      // 이미 이벤트 리스너가 추가된 경우 제거
      if (button.dataset.listenerAdded === "true") {
        return;
      }

      // 이벤트 리스너 추가
      const handlePanelClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const panelId = e.currentTarget.dataset.panel;
        // console.log("Panel clicked:", panelId); // 디버그 로그

        if (panelId) {
          // 상태 업데이트
          app.setState({
            ui: {
              ...app.state.ui,
              desktopSettings: {
                ...app.state.ui?.desktopSettings,
                activePanel: panelId,
              },
            },
          });

          // 즉시 UI 업데이트
          updateDesktopSettingsContent(app, panelId);
        }
      };

      button.addEventListener("click", handlePanelClick);
      button.dataset.listenerAdded = "true";
    });

    // 랜덤 선톡 토글 처리
    const randomToggle = document.getElementById(
      "settings-random-first-message-toggle",
    );
    const randomOptions = document.getElementById("random-chat-options");

    if (randomToggle && randomOptions) {
      randomToggle.addEventListener("change", (e) => {
        randomOptions.classList.toggle("hidden", !e.target.checked);
      });
    }

    // 스냅샷 토글 처리
    const snapshotsToggle = document.getElementById(
      "settings-snapshots-toggle",
    );
    const snapshotsList = document.getElementById("snapshots-list");

    if (snapshotsToggle && snapshotsList) {
      snapshotsToggle.addEventListener("change", (e) => {
        snapshotsList.classList.toggle("hidden", !e.target.checked);
      });
    }

    // 폰트 스케일 실시간 업데이트
    const fontScaleSlider = document.getElementById("settings-font-scale");
    const fontScaleValue = document.getElementById("font-scale-value");

    if (fontScaleSlider && fontScaleValue) {
      fontScaleSlider.addEventListener("input", (e) => {
        const value = parseFloat(e.target.value);
        fontScaleValue.textContent = Math.round(value * 100) + "%";
      });
    }

    // 랜덤 캐릭터 카운트 실시간 업데이트
    const characterCountSlider = document.getElementById(
      "settings-random-character-count",
    );
    const characterCountLabel = document.getElementById(
      "random-character-count-label",
    );

    if (characterCountSlider && characterCountLabel) {
      characterCountSlider.addEventListener("input", (e) => {
        characterCountLabel.textContent = e.target.value + t("settings.characterCountUnit");
      });
    }

    // API 제공업체 변경 처리
    const apiProviderSelect = document.getElementById("settings-api-provider");
    if (apiProviderSelect && !apiProviderSelect.dataset.listenerAdded) {
      apiProviderSelect.addEventListener("change", (e) => {
        // console.log("API Provider changed to:", e.target.value);
        app.handleAPIProviderChange(e.target.value);
      });
      apiProviderSelect.dataset.listenerAdded = "true";
    }

    // 디버그 로그 관련 버튼 처리
    const viewDebugLogsBtn = document.getElementById("view-debug-logs");
    if (viewDebugLogsBtn && !viewDebugLogsBtn.dataset.listenerAdded) {
      viewDebugLogsBtn.addEventListener("click", () => {
        // console.log("View logs button clicked");
        app.setState({
          showSettingsModal: false,
          showDebugLogsModal: true,
        });
      });
      viewDebugLogsBtn.dataset.listenerAdded = "true";
    }

    const clearDebugLogsBtn = document.getElementById("clear-debug-logs-btn");
    if (clearDebugLogsBtn && !clearDebugLogsBtn.dataset.listenerAdded) {
      clearDebugLogsBtn.addEventListener("click", () => {
        // console.log("Clear logs button clicked");
        app.clearDebugLogs();
      });
      clearDebugLogsBtn.dataset.listenerAdded = "true";
    }

    // 언어 설정 버튼 처리
    const languageButtons = document.querySelectorAll(".language-select-btn");
    languageButtons.forEach((button) => {
      if (!button.dataset.listenerAdded) {
        button.addEventListener("click", (e) => {
          const selectedLanguage = e.currentTarget.dataset.language;
          if (selectedLanguage) {
            // 언어 변경
            setLanguage(selectedLanguage);

            // 확인 메시지 표시 후 페이지 새로고침
            alert(t("system.languageChangeMessage"));

            // 짧은 지연 후 새로고침
            setTimeout(() => {
              window.location.reload();
            }, 500);
          }
        });
        button.dataset.listenerAdded = "true";
      }
    });
  });
}
