/**
 * @fileoverview Application entry point.
 * Mounts the root Svelte component to the DOM.
 */

import "@/global.css";
import { mount } from "svelte";
import App from "@/App.svelte";
import "@/lib/services/telemetry";

const app = mount(App, {
    target: document.getElementById("app")!,
});

export default app;
