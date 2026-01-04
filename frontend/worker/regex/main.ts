import * as Comlink from "comlink";
import type { RegexWorkerApi, RegexRule } from "./types";
import { ReplaceHookManager } from "./ReplaceHookManager";
import { createLogBridgeSender, type LogBridgeReceiver } from "@common/logger/LogBridge";

let logger: ReturnType<typeof createLogBridgeSender> | null = null;

export const api: RegexWorkerApi = {
    async applyRules(text: string, rules: RegexRule[]): Promise<string> {
        logger?.debug("Applying regex rules...", { ruleCount: rules.length });
        const manager = new ReplaceHookManager(rules);
        return manager.apply(text);
    },

    async replace(
        text: string,
        pattern: string,
        replacement: string,
        flags?: string
    ): Promise<string> {
        const manager = new ReplaceHookManager([{ pattern, replacement, flags }]);
        return manager.apply(text);
    },

    setLogReceiver(receiver: LogBridgeReceiver) {
        logger = createLogBridgeSender(receiver);
        logger.info("Regex worker connected to telemetry");
    },
};

Comlink.expose(api);
