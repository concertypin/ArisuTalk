import { createLogBridgeReceiver } from "@common/logger/LogBridge";
import { Logger } from "@common/logger/Logger";

/**
 * Global log receiver for worker telemetry.
 * Workers use this via LogBridge to send logs to the main thread.
 */
export const logReceiver = createLogBridgeReceiver();

/**
 * Global error handler for uncaught exceptions.
 * Logs errors to the structured telemetry system.
 */
window.addEventListener("error", (event) => {
    const error: unknown = event.error;
    Logger.structured("error.uncaught", {
        errorMessage: event.message,
        errorStack: error instanceof Error ? error.stack : undefined,
    });
});

/**
 * Global handler for unhandled promise rejections.
 */
window.addEventListener("unhandledrejection", (event) => {
    const reason: unknown = event.reason;
    Logger.structured("error.uncaught", {
        errorMessage: reason instanceof Error ? reason.message : String(reason),
        errorStack: reason instanceof Error ? reason.stack : undefined,
    });
});
