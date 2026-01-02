import * as Comlink from "comlink";
import type { ScriptingWorkerApi, ExecutionOptions, ExecutionResult } from "./types";

export const api: ScriptingWorkerApi = {
    async execute(_code: string, _options?: ExecutionOptions): Promise<ExecutionResult> {
        throw new Error("Not implemented");
    },
};

Comlink.expose(api);
