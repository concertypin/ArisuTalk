import { test, expect, describe, beforeAll } from "vitest";
import { waitFor } from "@testing-library/svelte";
import { renderWithAppContext } from "@test/utils/appContext.svelte";
import Home from "@/routes/Home.svelte";

// The loading state is in Home.loading.test.ts: Home caches its lazy components in module scope.
describe("Home Component", () => {
    // Load the lazily imported modules up front, so the test does not depend on how long a cold
    // transform of the app's largest module graph takes on a busy machine.
    beforeAll(async () => {
        await import("@/features/character/components/CharacterLayout.svelte");
        await import("@/components/ChatArea.svelte");
    });

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
