/**
 * @fileoverview Application entry point.
 * Mounts the root Svelte component to the DOM.
 */

import "@/global.css";
import { mount } from "svelte";
import App from "@/App.svelte";
import "@/lib/services/telemetry";

// Since this is just calling Svelte's mount function
// and no logic is executed here,
// We don't have to test it
/* v8 ignore next -- @preserve */
const app = mount(App, {
    target: document.getElementById("app")!,
});

export default app;
