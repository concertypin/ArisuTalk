import { test, expect, vi } from "vitest";
import { Logger } from "@common/logger/Logger";
import { withoutSetHTML } from "@test/utils/setHTML";

const mocks = vi.hoisted(() => ({
    mount: vi.fn<() => void>(),
    chunkLoadError: new Error("Failed to fetch dynamically imported module"),
}));
vi.mock("svelte", () => ({ mount: mocks.mount }));
vi.mock("@/App.svelte", () => ({ default: {} }));
// The polyfill loads DOMPurify on demand. A getter that throws stands in for a chunk that
// failed to load, since a mock factory cannot throw itself.
vi.mock("dompurify", () => ({
    get default(): never {
        throw mocks.chunkLoadError;
    },
}));

test("logs and still mounts the app when the setHTML polyfill cannot be installed", async () => {
    withoutSetHTML();
    const logError = vi.spyOn(Logger, "error").mockImplementation(() => undefined);

    await import("@/main");

    expect(logError).toHaveBeenCalledExactlyOnceWith(
        "Failed to install the setHTML polyfill",
        mocks.chunkLoadError
    );
    expect(mocks.mount).toHaveBeenCalledOnce();
});
