import { renderDesktopSettingsUI } from "./DesktopSettingsUI.js";

/**
 * Renders the desktop settings modal.
 * @param {Object} app - Application instance
 * @returns {string} Rendered settings modal HTML
 */
export function renderDesktopSettingsModal(app) {
  return renderDesktopSettingsUI(app);
}
