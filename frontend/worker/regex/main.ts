import * as Comlink from "comlink";
import type { RegexWorkerApi, RegexRule } from "./types";

export const api: RegexWorkerApi = {
    async applyRules(_text: string, _rules: RegexRule[]): Promise<string> {
        throw new Error("Not implemented");
    },

    async replace(_text: string, _pattern: string, _replacement: string, _flags?: string): Promise<string> {
        throw new Error("Not implemented");
    },
};

Comlink.expose(api);
