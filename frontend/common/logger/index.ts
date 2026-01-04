/**
 * @module @common/logger
 *
 * Centralized logging system for ArisuTalk.
 * Supports standard and verbose log levels, event hooks, localStorage persistence,
 * and cross-thread logging via Comlink.
 */

export { Logger, LOG_LEVELS } from "./Logger";
export type { LogLevel, LogEntry, LogListener } from "./Logger";

export { createLogBridgeSender, createLogBridgeReceiver } from "./LogBridge";
export type { LogBridgeSender, LogBridgeReceiver } from "./LogBridge";
