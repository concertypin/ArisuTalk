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

// Keep this the only test in the file: Home caches its lazily loaded components in module scope,
// so any earlier render in the same module registry would skip the loading state.
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
