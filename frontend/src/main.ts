import { mount } from "svelte";

import "./app.css";
import App from "./lib/App.svelte";

// 개발 서버에서 항상 디버그 모드 활성화
if (import.meta.env.DEV) {
    import("$root/dev-init");
}

const appTarget = document.getElementById("app");
if (!appTarget) {
    throw new Error("App target element not found");
}

const app = mount(App, {
    target: appTarget,
});

export default app;
