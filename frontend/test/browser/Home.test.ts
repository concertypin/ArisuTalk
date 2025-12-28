/// <reference types="vitest/browser" />
import { test, expect, describe, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import Home from "@/routes/Home.svelte";

describe("Home Component", () => {
    test("renders loading state initially", async () => {
        const { getByText } = render(Home);
        await expect.element(getByText("Loading chat experience...")).toBeVisible();
    });

    test("loads and renders layout and chat area", async () => {
        const { container } = render(Home);

        // In a browser test, dynamic imports resolve. We should wait for the loading state
        // to be replaced by the content. A good way is to wait for an element that only
        // exists in the loaded state.
        await vi.waitFor(
            () => {
                // The loaded state wraps CharacterLayout in a div, while the loading state does not.
                const loadedContent = container.querySelector(".home-layout > div");
                expect(loadedContent).not.toBeNull();
            },
            { timeout: 5000 }
        ); // Use a reasonable timeout for dynamic imports
    });
});
