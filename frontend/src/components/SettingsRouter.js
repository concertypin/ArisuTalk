import { renderSettingsModal } from './MobileSettingsModal.js';
import { renderDesktopSettingsUI } from './DesktopSettingsUI.js';

/**
 * 디바이스 유형을 감지하여 적절한 설정 UI를 반환하는 라우터
 * @param {Object} app - 애플리케이션 인스턴스
 * @returns {string} 렌더링된 설정 UI HTML
 */
export function renderSettingsUI(app) {
    const isMobile = detectMobileDevice();
    
    // 모바일 환경이거나 명시적으로 모바일 모드가 설정된 경우
    if (isMobile || app.state.ui?.settingsUIMode === 'mobile') {
        return renderSettingsModal(app);
    }
    
    // PC 환경 또는 명시적으로 데스크톱 모드가 설정된 경우
    return renderDesktopSettingsUI(app);
}

/**
 * 모바일 디바이스 감지 함수
 * @returns {boolean} 모바일 디바이스 여부
 */
function detectMobileDevice() {
    // 화면 크기 기반 감지 (768px 이하는 모바일로 간주)
    const isSmallScreen = window.innerWidth <= 768;
    
    // User Agent 기반 모바일 디바이스 감지
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = [
        'android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'
    ];
    const isMobileUserAgent = mobileKeywords.some(keyword => userAgent.includes(keyword));
    
    // 터치 이벤트 지원 여부
    const hasTouchEvents = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // 종합적인 모바일 감지: 화면 크기가 작거나, 모바일 UA이거나, 터치만 지원하는 경우
    return isSmallScreen || (isMobileUserAgent && hasTouchEvents);
}

/**
 * 설정 UI 모드를 강제로 변경하는 함수
 * @param {Object} app - 애플리케이션 인스턴스
 * @param {string} mode - 'mobile' 또는 'desktop'
 */
export function setSettingsUIMode(app, mode) {
    app.setState({
        ui: {
            ...app.state.ui,
            settingsUIMode: mode
        }
    });
}

/**
 * 현재 설정 UI 모드를 반환하는 함수
 * @param {Object} app - 애플리케이션 인스턴스
 * @returns {string} 현재 UI 모드 ('mobile' 또는 'desktop')
 */
export function getCurrentSettingsUIMode(app) {
    if (app.state.ui?.settingsUIMode) {
        return app.state.ui.settingsUIMode;
    }
    
    return detectMobileDevice() ? 'mobile' : 'desktop';
}