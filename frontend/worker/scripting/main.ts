import * as Comlink from "comlink";
import { getQuickJS } from "quickjs-emscripten";
import type { ScriptingWorkerApi, ExecutionOptions, ExecutionResult } from "./types";

export const api: ScriptingWorkerApi = {
    async execute(code: string, _options?: ExecutionOptions): Promise<ExecutionResult> {
        const logs: string[] = [];
        try {
            const QuickJS = await getQuickJS();
            const runtime = QuickJS.newRuntime();
            const context = runtime.newContext();

            // Setup console.log to capture logs
            const logHandle = context.newFunction("log", (...args) => {
                const message = args
                    .map((arg) => {
                        const json: unknown = context.dump(arg);
                        return typeof json === "string" ? json : JSON.stringify(json);
                    })
                    .join(" ");
                logs.push(message);
            });
            const consoleHandle = context.newObject();
            context.setProp(consoleHandle, "log", logHandle);
            context.setProp(context.global, "console", consoleHandle);
            consoleHandle.dispose();
            logHandle.dispose();

            const result = context.evalCode(code);

            if (result.error) {
                const error: unknown = context.dump(result.error);
                result.error.dispose();
                context.dispose();
                runtime.dispose();
                return {
                    logs,
                    error: typeof error === "string" ? error : JSON.stringify(error),
                };
            }

            const val: unknown = context.dump(result.value);
            result.value.dispose();
            context.dispose();
            runtime.dispose();

            return {
                result: val,
                logs,
            };
        } catch (e) {
            return {
                logs,
                error: e instanceof Error ? e.message : String(e),
            };
        }
    },
};

Comlink.expose(api);
