import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import App from "@/App.svelte";
import { settings } from "@/lib/stores/settings.svelte";
import { SettingsSchema } from "@/lib/types/IDataModel";
import { versionInfo } from "@/lib/stores/versionInfo.svelte";
import { toastStore } from "@/lib/stores/toast.svelte";
import { registerServiceWorker } from "@/lib/serviceWorker";
import { getCurrentPath } from "@/lib/router.svelte";
import { getPlugin } from "@/lib/plugins/types";
import { Logger } from "@common/logger/Logger";

/** Held shut until a test opens it, so a route can stay in its loading state on demand. */
const slowRoute = vi.hoisted(() => Promise.withResolvers<void>());

// The real route table would pull in the whole chat UI. A small table exercises App's own logic:
// picking the component for the current path, falling back, loading and failing.
vi.mock("@/lib/routeConfig", () => ({
    routes: {
        "/": () => import("@test/browser/wrappers/AppRouteHomeStub.svelte"),
        "/other": () => import("@test/browser/wrappers/AppRouteOtherStub.svelte"),
        "/slow": () =>
            slowRoute.promise.then(() => import("@test/browser/wrappers/AppRouteOtherStub.svelte")),
        "/broken": () => Promise.reject(new Error("chunk download failed")),
    },
}));
// The worker script is not served under the test server, so the registration call is a boundary.
vi.mock("@/lib/serviceWorker", () => ({ registerServiceWorker: vi.fn(async () => {}) }));

const root = document.documentElement;

/** Changes the URL hash, which is what the router follows. */
function goTo(path: string) {
    window.location.hash = path;
}

/** Installs known settings, standing in for loading them from storage. */
function installSettings(overrides: Parameters<typeof SettingsSchema.parse>[0], loaded = true) {
    vi.spyOn(settings, "init").mockImplementation(async () => {
        settings.value = SettingsSchema.parse(overrides);
        settings.isLoaded = loaded;
    });
}

describe("App", () => {
    beforeEach(() => {
        vi.mocked(registerServiceWorker).mockClear();
        settings.isLoaded = false;
        installSettings({ theme: "light", fontFamily: "system-ui", fontSize: 20 });
        vi.spyOn(settings, "save").mockResolvedValue(undefined);
        vi.spyOn(Logger, "error").mockImplementation(() => {});
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        goTo("");
        // Router listeners from earlier mounts stay registered, so the path settles back to "/".
        await vi.waitFor(() => expect(getCurrentPath()).toBe("/"));
        root.removeAttribute("data-theme");
        root.style.colorScheme = "";
        root.style.removeProperty("--app-font-family");
        root.style.removeProperty("--app-font-size");
        for (const id of toastStore.toasts.map((toast) => toast.id)) toastStore.dismiss(id);
    });

    describe("routing", () => {
        it("renders the component of the current path once it is loaded", async () => {
            render(App);

            await screen.findByText("Home route");
        });

        it("switches to the component of a new path when the hash changes", async () => {
            render(App);
            await screen.findByText("Home route");

            goTo("/other");

            await screen.findByText("Other route");
            await waitFor(() => expect(screen.queryByText("Home route")).not.toBeInTheDocument());
        });

        it("falls back to the home route for a path that has no route", async () => {
            render(App);
            await screen.findByText("Home route");
            goTo("/other");
            await screen.findByText("Other route");

            goTo("/no-such-page");

            await screen.findByText("Home route");
            await waitFor(() => expect(screen.queryByText("Other route")).not.toBeInTheDocument());
        });

        it("shows a loading message instead of the old page while the next route is loading", async () => {
            render(App);
            await screen.findByText("Home route");

            goTo("/slow");

            await screen.findByText("Loading...");
            await waitFor(() => expect(screen.queryByText("Home route")).not.toBeInTheDocument());

            slowRoute.resolve();
            await screen.findByText("Other route");
            await waitFor(() => expect(screen.queryByText("Loading...")).not.toBeInTheDocument());
        });

        it("logs and keeps the current page when a route fails to load", async () => {
            render(App);
            await screen.findByText("Home route");

            goTo("/broken");

            await vi.waitFor(() =>
                expect(Logger.error).toHaveBeenCalledWith("Failed to load route", expect.any(Error))
            );
            await waitFor(() => expect(screen.queryByText("Loading...")).not.toBeInTheDocument());
            await screen.findByText("Home route");
        });
    });

    describe("startup", () => {
        it("titles the document with the app name and release channel", async () => {
            render(App);

            await vi.waitFor(() => expect(document.title).toBe(versionInfo.displayLabel));
            expect(document.title).toContain("ArisuTalk");
        });

        it("loads the settings and registers the service worker once", async () => {
            render(App);

            await vi.waitFor(() => expect(registerServiceWorker).toHaveBeenCalledOnce());
            expect(settings.init).toHaveBeenCalledOnce();
        });

        it("registers and initializes the first-party memory plugin", async () => {
            const info = vi.spyOn(Logger, "info").mockImplementation(() => {});

            render(App);

            await vi.waitFor(() => expect(info).toHaveBeenCalledWith("[MemoryPlugin] Initialized"));
            expect(getPlugin("arisutalk.memory")?.meta.name).toBe("Character Memory");
        });
    });

    describe("theme and font", () => {
        it("applies the theme from the settings once they are loaded", async () => {
            render(App);

            await vi.waitFor(() => expect(root.getAttribute("data-theme")).toBe("winter"));
            expect(root.style.colorScheme).toBe("light");
        });

        it("leaves the theme alone until the settings have loaded", async () => {
            installSettings({ theme: "dark" }, false);
            render(App);
            await vi.waitFor(() => expect(settings.value.theme).toBe("dark"));
            expect(root.getAttribute("data-theme")).toBeNull();

            settings.isLoaded = true;

            await vi.waitFor(() => expect(root.getAttribute("data-theme")).toBe("night"));
        });

        it("follows later theme changes", async () => {
            render(App);
            await vi.waitFor(() => expect(root.getAttribute("data-theme")).toBe("winter"));

            settings.value.theme = "dark";

            await vi.waitFor(() => expect(root.getAttribute("data-theme")).toBe("night"));
        });

        it("exposes the configured font family and size as CSS variables", async () => {
            render(App);

            await vi.waitFor(() =>
                expect(root.style.getPropertyValue("--app-font-family")).toBe("system-ui")
            );
            expect(root.style.getPropertyValue("--app-font-size")).toBe("20px");
        });

        it("does not set a font family variable when the setting is empty", async () => {
            installSettings({ theme: "light", fontFamily: "", fontSize: 18 });
            render(App);

            await vi.waitFor(() =>
                expect(root.style.getPropertyValue("--app-font-size")).toBe("18px")
            );
            expect(root.style.getPropertyValue("--app-font-family")).toBe("");
        });
    });

    describe("global UI", () => {
        it("shows toasts raised anywhere in the app", async () => {
            render(App);
            await screen.findByText("Home route");

            toastStore.success("저장되었습니다!", 0);

            await screen.findByText("저장되었습니다!");
        });

        it("opens the app settings modal when a page asks for it and removes it when closed", async () => {
            const user = userEvent.setup();
            render(App);
            const modalTitle = () =>
                screen.queryByRole("heading", { name: "App Settings", level: 2 });
            await screen.findByText("Home route");
            expect(modalTitle()).not.toBeInTheDocument();

            await user.click(screen.getByRole("button", { name: "Open app settings" }));

            // The modal's chunk is loaded on demand, which can take a while on a cold start.
            await screen.findByRole(
                "heading",
                { name: "App Settings", level: 2 },
                { timeout: 5000 }
            );

            await user.click(screen.getByText("Close", { exact: true }));

            await waitFor(() => expect(modalTitle()).not.toBeInTheDocument());
            expect(settings.save).toHaveBeenCalled();
        });
    });
});
