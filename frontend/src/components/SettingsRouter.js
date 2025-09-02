import { renderDesktopSettingsUI } from "./DesktopSettingsUI.js";

/**
 * Router that returns appropriate settings UI
 * @param {Object} app - Application instance
 * @returns {string} Rendered settings UI HTML
 */
export function renderSettingsUI(app) {
  return renderDesktopSettingsUI(app);
}
