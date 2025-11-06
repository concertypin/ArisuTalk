import "./app.css";
import { mount } from "svelte";
import App from "./lib/App.svelte";

// 개발 서버에서 항상 디버그 모드 활성화
if (import.meta.env.DEV) {
    import("./dev-init.ts");
}

const appTarget = document.getElementById("app");
if (!appTarget) {
    throw new Error("App target element not found");
}

const app = mount(App, {
    target: appTarget,
});

export default app;
