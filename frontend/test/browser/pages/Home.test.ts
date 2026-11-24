import { test, expect, describe } from "vitest";
import { waitFor } from "@testing-library/svelte";
import { renderWithAppContext } from "@test/utils/appContext.svelte";
import Home from "@/routes/Home.svelte";

// The loading state is covered in Home.loading.test.ts. Home caches its lazily loaded components
// in module scope, so a test that needs a cold cache needs a test file of its own (every test file
// gets a fresh module registry).
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
