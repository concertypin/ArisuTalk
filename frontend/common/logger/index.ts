/**
 * @module @common/logger
 *
 * Centralized logging system for ArisuTalk.
 * Supports standard and verbose log levels, structured telemetry events,
 * event hooks, localStorage persistence, and cross-thread logging via Comlink.
 */

export { Logger, LOG_LEVELS } from "./Logger";
export type {
    LogLevel,
    StructuredLogLevel,
    StandardLogEntry,
    StructuredLogEntry,
    AnyLogEntry,
    LogListener,
} from "./Logger";

export { createLogBridgeSender, createLogBridgeReceiver } from "./LogBridge";
export type { LogBridgeSender, LogBridgeReceiver } from "./LogBridge";
