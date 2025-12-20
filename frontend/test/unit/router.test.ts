import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import {
    navigate,
    getCurrentPath,
    isActive,
    initRouter,
} from "@/lib/router.svelte";

describe("Router", () => {
    beforeAll(() => {
        initRouter();
    });

    beforeEach(() => {
        window.location.hash = "";
        // Give time for hashchange to fire?
        // Or manually trigger it if happy-dom doesn't auto-fire on hash assignment?
        // happy-dom usually fires hashchange.
    });

    it("should return root path initially", () => {
        // Assuming hash is empty
        expect(getCurrentPath()).toBe("/");
    });

    it("should navigate to a new path", async () => {
        navigate("settings");
        // Wait for event loop
        await new Promise((r) => setTimeout(r, 0));
        expect(window.location.hash).toBe("#settings");
        expect(getCurrentPath()).toBe("settings");
    });

    it("should update path on external hash change", async () => {
        window.location.hash = "#chat";
        await new Promise((r) => setTimeout(r, 0));
        expect(getCurrentPath()).toBe("chat");
    });

    it("should correctly identify active path", async () => {
        navigate("about");
        await new Promise((r) => setTimeout(r, 0));
        expect(isActive("about")).toBe(true);
        expect(isActive("settings")).toBe(false);
    });

    it("should handle root path", async () => {
        navigate("/");
        await new Promise((r) => setTimeout(r, 0));
        // navigate("/") sets hash to "#/"
        expect(getCurrentPath()).toBe("/");

        // Empty hash also means root
        window.location.hash = "";
        await new Promise((r) => setTimeout(r, 0));
        expect(getCurrentPath()).toBe("/");
    });
});
