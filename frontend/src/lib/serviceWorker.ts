/**
 * @fileoverview Service Worker registration for PWA support.
 * Registers the service worker served from /serviceWorker.js.
 */

import { Logger } from "@common/logger/Logger";

/**
 * Registers the Service Worker for offline support and caching.
 * Safe to call only in browser environments — no-op when unsupported.
 */
export async function registerServiceWorker(): Promise<void> {
    if (!("serviceWorker" in navigator)) {
        Logger.info("Service Worker not supported in this browser");
        return;
    }

    try {
        const registration = await navigator.serviceWorker.register("/serviceWorker.js", {
            scope: "/",
        });

        Logger.info("Service Worker registered", {
            scope: registration.scope,
            state: registration.active?.state,
        });
    } catch (error) {
        const cause = error instanceof Error ? error : new Error(String(error));
        Logger.warn("Service Worker registration failed", cause);
    }
}
