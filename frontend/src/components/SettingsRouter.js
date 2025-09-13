
import { renderDesktopSettingsUI } from './DesktopSettingsUI.js';
import { renderMobileSettingsUI } from './MobileSettingsUI.js';

/**
 * Determines the current settings UI mode based on window width and app state.
 * @param {object} app - The application instance.
 * @returns {('mobile'|'desktop')}
 */
export function getCurrentSettingsUIMode(app) {
  const isForcedMobile = app.state.ui?.settingsUIMode === 'mobile';
  const isForcedDesktop = app.state.ui?.settingsUIMode === 'desktop';

  if (isForcedDesktop) return 'desktop';
  if (isForcedMobile) return 'mobile';

  return window.innerWidth < 768 ? 'mobile' : 'desktop';
}

/**
 * Renders the appropriate settings UI based on the current mode.
 * @param {object} app - The application instance.
 * @returns {string} The HTML for the settings UI.
 */
export function renderSettingsUI(app) {
  const mode = getCurrentSettingsUIMode(app);
  if (mode === 'desktop') {
    return renderDesktopSettingsUI(app);
  }
  return renderMobileSettingsUI(app);
}
