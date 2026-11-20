/// <reference types="vitest/browser" />
import { test, expect, describe, vi } from "vitest";
import { renderWithAppContext } from "@test/utils/appContext.svelte";
import Home from "@/routes/Home.svelte";

// The loading state is covered in Home.loading.test.ts. Home caches its lazily loaded components
// in module scope, and `vi.resetModules()` cannot clear that in browser mode, so a test that needs
// a cold cache needs a test file of its own (every browser test file gets a fresh module registry).
describe("Home Component", () => {
    test("loads and renders layout", async () => {
        const { container } = renderWithAppContext(Home, {});

        await vi.waitFor(
            () => {
                const loadedContent = container.querySelector(".home-layout > div");
                expect(loadedContent).not.toBeNull();
            },
            { timeout: 5000 }
        );
    });
});
