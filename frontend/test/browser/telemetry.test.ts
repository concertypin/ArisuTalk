/// <reference types="vitest/browser" />
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
        const event = new PromiseRejectionEvent("unhandledrejection", {
            reason,
            promise: Promise.reject(reason),
        });

        window.dispatchEvent(event);

        expect(mockStructured).toHaveBeenCalledWith(
            "error.uncaught",
            expect.objectContaining({
                errorMessage: reason,
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
