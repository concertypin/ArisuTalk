import * as Comlink from "comlink";
import type { RegexWorkerApi, RegexRule } from "./types";

export const api: RegexWorkerApi = {
    async applyRules(text: string, rules: RegexRule[]): Promise<string> {
        let result = text;
        for (const rule of rules) {
            const re = new RegExp(rule.pattern, rule.flags || "g");
            result = result.replace(re, rule.replacement);
        }
        return result;
    },

    async replace(text: string, pattern: string, replacement: string, flags?: string): Promise<string> {
        const re = new RegExp(pattern, flags || "g");
        return text.replace(re, replacement);
    },
};

Comlink.expose(api);
