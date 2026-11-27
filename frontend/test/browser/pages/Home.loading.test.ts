import { test, expect, vi } from "vitest";
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
    const { getByText, queryByText, queryByRole, findByRole } = renderWithAppContext(Home, {});

    expect(getByText("Loading...")).toBeVisible();
    // The sidebar is rendered by the lazily loaded CharacterLayout, never by Home itself.
    expect(queryByRole("button", { name: "Home" })).not.toBeInTheDocument();

    chatAreaGate.resolve();

    expect(await findByRole("button", { name: "Home" }, { timeout: 5000 })).toBeVisible();
    expect(queryByText("Loading...")).not.toBeInTheDocument();
});
