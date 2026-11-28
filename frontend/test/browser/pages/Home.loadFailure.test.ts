import { test, expect, vi } from "vitest";
import { screen } from "@testing-library/svelte";
import { renderWithAppContext } from "@test/utils/appContext.svelte";
import Home from "@/routes/Home.svelte";
import { Logger } from "@common/logger/Logger";

// Home caches its lazily loaded components in module scope, so the failing import needs a test file
// of its own (every test file gets a fresh module registry).
// A throwing factory is reported by vitest as an unhandled error, so the failure is raised when
// the module's default export is read, which is the first thing Home does with the loaded module.
vi.mock("@/features/character/components/CharacterLayout.svelte", () => ({
    get default(): never {
        throw new Error("layout chunk failed");
    },
}));

test("shows the load error instead of the app when a lazy component fails to load", async () => {
    const logged = vi.spyOn(Logger, "error").mockImplementation(() => {});

    renderWithAppContext(Home, {});

    expect(await screen.findByText(/Failed to load:/, {}, { timeout: 5000 })).toHaveTextContent(
        "layout chunk failed"
    );
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(logged).toHaveBeenCalledWith("Failed to load components.");
});
