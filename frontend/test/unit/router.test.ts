import { describe, it, expect, beforeEach, beforeAll, expectTypeOf, vi } from "vitest";
import { navigate, getCurrentPath, isActive, initRouter } from "@/lib/router.svelte";
import { Logger } from "@common/logger/Logger";

describe("Router", () => {
    beforeAll(() => {
        initRouter();
    });

    describe("Type Tests", () => {
        it("getCurrentPath returns string", () => {
            expectTypeOf(getCurrentPath()).toEqualTypeOf<string>();
        });

        it("isActive returns boolean", () => {
            expectTypeOf(isActive("/")).toEqualTypeOf<boolean>();
        });

        it("navigate returns void", () => {
            expectTypeOf(navigate).parameters.toEqualTypeOf<[string]>();
            expectTypeOf(navigate).returns.toEqualTypeOf<void>();
        });
    });

    beforeEach(async () => {
        window.location.hash = "";
        // Reset reactive state by navigating to root and waiting
        navigate("/");
        await new Promise((r) => setTimeout(r, 0));
        vi.spyOn(Logger, "structured").mockImplementation(() => {});
    });

    it("should log page.view on navigation", async () => {
        navigate("settings");
        await new Promise((r) => setTimeout(r, 0));
        
        expect(Logger.structured).toHaveBeenCalledWith("page.view", expect.objectContaining({
            pageName: "settings"
        }));
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
