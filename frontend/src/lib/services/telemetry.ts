import { createLogBridgeReceiver } from "@common/logger/LogBridge";

/**
 * Global log receiver for worker telemetry.
 * Workers use this via LogBridge to send logs to the main thread.
 */
export const logReceiver = createLogBridgeReceiver();
