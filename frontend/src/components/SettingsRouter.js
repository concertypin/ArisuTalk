import { renderMobileSettingsUI } from "./MobileSettingsUI.js";
import { renderDesktopSettingsUI } from "./DesktopSettingsUI.js";

/**
 * Router that detects device type and returns appropriate settings UI
 * @param {Object} app - Application instance
 * @returns {string} Rendered settings UI HTML
 */
export function renderSettingsUI(app) {
  const isMobile = detectMobileDevice();

  // 모바일 환경이거나 명시적으로 모바일 모드가 설정된 경우
  if (isMobile || app.state.ui?.settingsUIMode === "mobile") {
    return renderMobileSettingsUI(app);
  }

  // PC 환경 또는 명시적으로 데스크톱 모드가 설정된 경우
  return renderDesktopSettingsUI(app);
}

/**
 * Mobile device detection function
 * @returns {boolean} Whether it's a mobile device
 */
function detectMobileDevice() {
  // 화면 크기 기반 감지 (768px 이하는 모바일로 간주)
  const isSmallScreen = window.innerWidth <= 768;

  // User Agent 기반 모바일 디바이스 감지
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    "android",
    "webos",
    "iphone",
    "ipad",
    "ipod",
    "blackberry",
    "windows phone",
  ];
  const isMobileUserAgent = mobileKeywords.some((keyword) =>
    userAgent.includes(keyword),
  );

  // 터치 이벤트 지원 여부
  const hasTouchEvents =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // 종합적인 모바일 감지: 화면 크기가 작거나, 모바일 UA이거나, 터치만 지원하는 경우
  return isSmallScreen || (isMobileUserAgent && hasTouchEvents);
}

/**
 * Forces a change to the settings UI mode
 * @param {Object} app - Application instance
 * @param {string} mode - 'mobile' or 'desktop'
 */
export function setSettingsUIMode(app, mode) {
  app.setState({
    ui: {
      ...app.state.ui,
      settingsUIMode: mode,
    },
  });
}

/**
 * Returns the current settings UI mode
 * @param {Object} app - Application instance
 * @returns {string} Current UI mode ('mobile' or 'desktop')
 */
export function getCurrentSettingsUIMode(app) {
  if (app.state.ui?.settingsUIMode) {
    return app.state.ui.settingsUIMode;
  }

  return detectMobileDevice() ? "mobile" : "desktop";
}