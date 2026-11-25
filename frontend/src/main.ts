/**
 * @fileoverview Application entry point.
 * Installs the setHTML polyfill if the browser needs it, then mounts the root Svelte component.
 */

import "@/global.css";
import { mount } from "svelte";
import App from "@/App.svelte";
import "@/lib/services/telemetry";
import { Logger } from "@common/logger/Logger";
import { installSetHTMLPolyfill } from "@/lib/polyfills/setHTML";

// Installed before mounting so components can call `setHTML` synchronously.
// If it fails, the app still mounts and SanitizedHtml shows plain text.
try {
    await installSetHTMLPolyfill();
} catch (error) {
    Logger.error("Failed to install the setHTML polyfill", error);
}

// The only logic in this file is the polyfill install above, covered by test/browser/main.test.ts.
// This line just calls Svelte's `mount`.
/* v8 ignore next -- @preserve */
const app = mount(App, {
    target: document.getElementById("app")!,
});

export default app;
