import * as Comlink from "comlink";
import type { RegexWorkerApi, RegexRule } from "./types";
import { ReplaceHookManager } from "./ReplaceHookManager";

export const api: RegexWorkerApi = {
    async applyRules(text: string, rules: RegexRule[]): Promise<string> {
        const manager = new ReplaceHookManager(rules);
        return manager.apply(text);
    },

    async replace(text: string, pattern: string, replacement: string, flags?: string): Promise<string> {
        const manager = new ReplaceHookManager([{ pattern, replacement, flags }]);
        return manager.apply(text);
    },
};

Comlink.expose(api);
