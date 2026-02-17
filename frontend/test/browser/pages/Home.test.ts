/// <reference types="vitest/browser" />
import { test, expect, describe, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import Home from "@/routes/Home.svelte";

describe("Home Component", () => {
    test("renders loading state initially", async () => {
        const { getByText } = render(Home);
        await expect.element(getByText("Loading...")).toBeVisible();
    });

    test("loads and renders layout", async () => {
        const { container } = render(Home);

        await vi.waitFor(
            () => {
                const loadedContent = container.querySelector(".home-layout > div");
                expect(loadedContent).not.toBeNull();
            },
            { timeout: 5000 }
        );
    });
});
