/// <reference types="vitest/browser" />
import { test, expect, vi } from "vitest";
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
    const { getByText, getByRole } = renderWithAppContext(Home, {});
    // The sidebar is rendered by the lazily loaded CharacterLayout, never by Home itself.
    const homeButton = getByRole("button", { name: "Home" });

    await expect.element(getByText("Loading...")).toBeVisible();
    await expect.element(homeButton).not.toBeInTheDocument();

    chatAreaGate.resolve();

    await expect.element(homeButton, { timeout: 5000 }).toBeVisible();
    await expect.element(getByText("Loading...")).not.toBeInTheDocument();
});
