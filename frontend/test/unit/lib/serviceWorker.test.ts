import { describe, it, expect, afterEach, vi } from "vitest";
import { registerServiceWorker } from "@/lib/serviceWorker";
import { Logger } from "@common/logger/Logger";

describe("registerServiceWorker", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("logs and returns without registering when the browser has no service worker support", async () => {
        vi.stubGlobal("navigator", {});
        const info = vi.spyOn(Logger, "info").mockImplementation(() => {});

        await expect(registerServiceWorker()).resolves.toBeUndefined();

        expect(info).toHaveBeenCalledWith("Service Worker not supported in this browser");
    });

    it("registers /serviceWorker.js with root scope and logs the registration", async () => {
        const register = vi
            .fn<() => Promise<{ scope: string; active: { state: string } | null }>>()
            .mockResolvedValue({
                scope: "https://app.test/",
                active: { state: "activated" },
            });
        vi.stubGlobal("navigator", { serviceWorker: { register } });
        const info = vi.spyOn(Logger, "info").mockImplementation(() => {});

        await registerServiceWorker();

        expect(register).toHaveBeenCalledExactlyOnceWith("/serviceWorker.js", { scope: "/" });
        expect(info).toHaveBeenCalledWith("Service Worker registered", {
            scope: "https://app.test/",
            state: "activated",
        });
    });

    it("logs an undefined state when the worker is registered but not yet active", async () => {
        const register = vi
            .fn<() => Promise<{ scope: string; active: { state: string } | null }>>()
            .mockResolvedValue({ scope: "https://app.test/", active: null });
        vi.stubGlobal("navigator", { serviceWorker: { register } });
        const info = vi.spyOn(Logger, "info").mockImplementation(() => {});

        await registerServiceWorker();

        expect(info).toHaveBeenCalledWith("Service Worker registered", {
            scope: "https://app.test/",
            state: undefined,
        });
    });

    it("warns instead of throwing when registration rejects with an Error", async () => {
        const failure = new Error("script fetch failed");
        const register = vi.fn<() => Promise<never>>().mockRejectedValue(failure);
        vi.stubGlobal("navigator", { serviceWorker: { register } });
        const warn = vi.spyOn(Logger, "warn").mockImplementation(() => {});

        await expect(registerServiceWorker()).resolves.toBeUndefined();

        expect(warn).toHaveBeenCalledWith("Service Worker registration failed", failure);
    });

    it("wraps a non-Error rejection reason in an Error before warning", async () => {
        const register = vi.fn<() => Promise<never>>().mockRejectedValue("blocked by policy");
        vi.stubGlobal("navigator", { serviceWorker: { register } });
        const warn = vi.spyOn(Logger, "warn").mockImplementation(() => {});

        await registerServiceWorker();

        const [message, cause] = warn.mock.calls[0];
        expect(message).toBe("Service Worker registration failed");
        expect(cause).toBeInstanceOf(Error);
        expect(cause).toHaveProperty("message", "blocked by policy");
    });
});
