import type { StandardLogEntry, LogLevel, StructuredLogEntry } from "./Logger";
import type { StructuredLogLevel } from "./LogType";

/**
 * Interface for the main thread's log receiver.
 * This is exposed via Comlink to allow workers to send logs.
 */
export interface LogBridgeReceiver {
    /**
     * Receive a log entry from a worker.
     * @param entry The log entry to forward to the main Logger.
     */
    receiveLog(entry: StandardLogEntry): void;

    /**
     * Receive a structured telemetry log entry from a worker.
     * @param entry The structured log entry.
     */
    receiveStructuredLog<K extends keyof StructuredLogLevel>(entry: StructuredLogEntry<K>): void;
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
     * Send a structured telemetry event to the main thread.
     * @param event The event name.
     * @param data The event data.
     */
    structured<K extends keyof StructuredLogLevel>(event: K, data: StructuredLogLevel[K]): void;

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
 * workerLogger.structured("worker.status", { workerName: "Scripting", status: "ready" });
 * ```
 */
export function createLogBridgeSender(receiver: LogBridgeReceiver): LogBridgeSender {
    const baseLog = (level: LogLevel, message: string, ...args: unknown[]) => {
        const entry: StandardLogEntry = {
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

    const structuredLog = <K extends keyof StructuredLogLevel>(
        event: K,
        data: StructuredLogLevel[K]
    ) => {
        const entry: StructuredLogEntry<K> = {
            level: event,
            message: event,
            timestamp: Date.now(),
            data,
        };
        void Promise.resolve(receiver.receiveStructuredLog(entry)).catch((err) => {
            console.error("[LogBridge] Failed to send structured log to main thread:", err);
        });
    };

    return {
        log: baseLog,
        structured: structuredLog,
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
 */
export function createLogBridgeReceiver(): LogBridgeReceiver {
    return {
        receiveLog(entry: StandardLogEntry): void {
            void import("./Logger").then(({ Logger }) => {
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
                    case "log":
                    default:
                        Logger.log(entry.message, ...(entry.data ?? []));
                }
            });
        },
        receiveStructuredLog<K extends keyof StructuredLogLevel>(
            entry: StructuredLogEntry<K>
        ): void {
            void import("./Logger").then(({ Logger }) => {
                Logger.structured(entry.level, entry.data);
            });
        },
    };
}
