import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Logger } from "@common/logger/Logger";
import "@/lib/services/telemetry"; // This should register the event listeners

type Mocked<T> = ReturnType<typeof vi.mocked<T>>;
describe("Telemetry Service", () => {
    let mockStructured: Mocked<typeof Logger.structured>;

    beforeEach(() => {
        mockStructured = vi.spyOn(Logger, "structured").mockImplementation(() => {});
    });

    afterEach(() => {
        mockStructured.mockRestore();
    });

    it("should register global error listener and log error.uncaught", () => {
        const error = new Error("Test unhandled error");
        const event = new ErrorEvent("error", {
            error,
            message: error.message,
        });

        window.dispatchEvent(event);

        expect(mockStructured).toHaveBeenCalledWith(
            "error.uncaught",
            expect.objectContaining({
                errorMessage: error.message,
                errorStack: error.stack,
            })
        );
    });

    it("should register global unhandledrejection listener and log error.uncaught", () => {
        const reason = new Error("Test promise rejection");
        const promise = Promise.reject(reason);
        // The event is dispatched by hand. Handle the real rejection so it is not reported as an
        // unhandled error of the test run.
        promise.catch(() => undefined);
        const event = new PromiseRejectionEvent("unhandledrejection", {
            reason,
            promise,
        });

        window.dispatchEvent(event);

        expect(mockStructured).toHaveBeenCalledWith(
            "error.uncaught",
            expect.objectContaining({
                errorMessage: reason.message,
            })
        );
    });

    it("should handle error event without error object", () => {
        const event = new ErrorEvent("error", {
            message: "Just a message",
        });

        window.dispatchEvent(event);

        expect(mockStructured).toHaveBeenCalledWith(
            "error.uncaught",
            expect.objectContaining({
                errorMessage: "Just a message",
            })
        );
    });
});
