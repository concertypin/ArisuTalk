import type { LogEntry, LogLevel } from "./Logger";

/**
 * Interface for the main thread's log receiver.
 * This is exposed via Comlink to allow workers to send logs.
 */
export interface LogBridgeReceiver {
    /**
     * Receive a log entry from a worker.
     * @param entry The log entry to forward to the main Logger.
     */
    receiveLog(entry: LogEntry): void;
}

/**
 * Interface for worker-side logging proxy.
 * Workers use this to send logs to the main thread.
 */
export interface LogBridgeSender {
    /**
     * Send a log entry to the main thread.
     * @param level The log level.
     * @param message The log message.
     * @param args Additional arguments.
     */
    log(level: LogLevel, message: string, ...args: unknown[]): void;

    /**
     * Convenience methods for each log level.
     */
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
    debug(message: string, ...args: unknown[]): void;
    verbose(message: string, ...args: unknown[]): void;
    trace(message: string, ...args: unknown[]): void;
}

/**
 * Creates a log sender for use in workers.
 * This creates log entries and sends them via Comlink to the main thread.
 *
 * @param receiver A Comlink proxy to the main thread's LogBridgeReceiver.
 * @returns A LogBridgeSender instance.
 *
 * @example
 * ```typescript
 * // In worker
 * import * as Comlink from "comlink";
 * import { createLogBridgeSender } from "@common/logger/LogBridge";
 *
 * // Get receiver from main thread
 * const receiver = ...; // Comlink proxy
 * const workerLogger = createLogBridgeSender(receiver);
 *
 * workerLogger.info("Worker started");
 * workerLogger.debug("Processing...", { count: 42 });
 * ```
 */
export function createLogBridgeSender(receiver: LogBridgeReceiver): LogBridgeSender {
    const baseLog = (level: LogLevel, message: string, ...args: unknown[]) => {
        const entry: LogEntry = {
            level,
            message,
            timestamp: Date.now(),
            data: args.length > 0 ? args : undefined,
        };
        // Fire and forget - don't await as we don't want to block worker execution
        void Promise.resolve(receiver.receiveLog(entry)).catch((err) => {
            // Fallback to console if bridge fails
            console.error("[LogBridge] Failed to send log to main thread:", err);
            console.log(`[${level}] ${message}`, ...args);
        });
    };

    return {
        log: baseLog,
        info: (message, ...args) => baseLog("info", message, ...args),
        warn: (message, ...args) => baseLog("warn", message, ...args),
        error: (message, ...args) => baseLog("error", message, ...args),
        debug: (message, ...args) => baseLog("debug", message, ...args),
        verbose: (message, ...args) => baseLog("verbose", message, ...args),
        trace: (message, ...args) => baseLog("trace", message, ...args),
    };
}

/**
 * Creates a log receiver for use in the main thread.
 * This receives log entries from workers and forwards them to the Logger.
 *
 * @returns A LogBridgeReceiver instance to be exposed via Comlink.
 *
 * @example
 * ```typescript
 * // In main thread
 * import * as Comlink from "comlink";
 * import { createLogBridgeReceiver } from "@common/logger/LogBridge";
 * import { Logger } from "@common/logger/Logger";
 *
 * const worker = new Worker("./worker.ts", { type: "module" });
 * const receiver = createLogBridgeReceiver();
 *
 * // Expose receiver to worker (or pass via Comlink.proxy)
 * Comlink.expose(receiver, worker);
 * ```
 */
export function createLogBridgeReceiver(): LogBridgeReceiver {
    // Dynamic import to avoid circular dependency and allow tree-shaking
    return {
        receiveLog(entry: LogEntry): void {
            // We use dynamic import to get the Logger to avoid issues
            // in workers where Logger might not be fully available
            void import("./Logger").then(({ Logger }) => {
                // Re-emit through the main Logger
                switch (entry.level) {
                    case "info":
                        Logger.info(entry.message, ...(entry.data ?? []));
                        break;
                    case "warn":
                        Logger.warn(entry.message, ...(entry.data ?? []));
                        break;
                    case "error":
                        Logger.error(entry.message, ...(entry.data ?? []));
                        break;
                    case "debug":
                        Logger.debug(entry.message, ...(entry.data ?? []));
                        break;
                    case "verbose":
                        Logger.verbose(entry.message, ...(entry.data ?? []));
                        break;
                    case "trace":
                        Logger.trace(entry.message, ...(entry.data ?? []));
                        break;
                    default:
                        Logger.log(entry.message, ...(entry.data ?? []));
                }
            });
        },
    };
}
