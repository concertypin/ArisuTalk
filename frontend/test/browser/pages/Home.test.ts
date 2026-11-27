import { test, expect, describe } from "vitest";
import { waitFor } from "@testing-library/svelte";
import { renderWithAppContext } from "@test/utils/appContext.svelte";
import Home from "@/routes/Home.svelte";

// The loading state is in Home.loading.test.ts: Home caches its lazy components in module scope.
describe("Home Component", () => {
    test("loads and renders layout", async () => {
        const { container } = renderWithAppContext(Home, {});

        await waitFor(
            () => {
                const loadedContent = container.querySelector(".home-layout > div");
                expect(loadedContent).not.toBeNull();
            },
            { timeout: 5000 }
        );
    });
});
