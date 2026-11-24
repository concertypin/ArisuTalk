import { test, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/svelte";
import { renderWithAppContext } from "@test/utils/appContext.svelte";
import Home from "@/routes/Home.svelte";

/** Held shut until the test opens it, so the lazy import of ChatArea stays pending on demand. */
const chatAreaGate = vi.hoisted(() => Promise.withResolvers<void>());

vi.mock("@/components/ChatArea.svelte", async (importOriginal) => {
    await chatAreaGate.promise;
    return await importOriginal();
});

// Keep this the only test here: Home caches its lazy components in module scope, so an earlier render
// skips the loading state.
test("shows the loading state until the lazy components arrive", async () => {
    const { container } = renderWithAppContext(Home, {});

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(container.querySelector(".home-layout > div")).toBeNull();

    chatAreaGate.resolve();

    await waitFor(
        () => {
            expect(container.querySelector(".home-layout > div")).not.toBeNull();
        },
        { timeout: 5000 }
    );
    expect(container.textContent).not.toContain("Loading...");
});
