import * as Comlink from "comlink";
import { getQuickJS } from "quickjs-emscripten";
import type { ScriptingWorkerApi, ExecutionOptions, ExecutionResult } from "./types";
import { IsolatedStorage } from "./IsolatedStorage";

const storage = new IsolatedStorage();

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

            // Setup IsolatedStorage
            const storageHandle = context.newObject();
            const setItemHandle = context.newFunction("setItem", (key, value) => {
                storage.setItem(context.getString(key), context.getString(value));
            });
            const getItemHandle = context.newFunction("getItem", (key) => {
                const result = storage.getItem(context.getString(key));
                return result === null ? context.null : context.newString(result);
            });
            const removeItemHandle = context.newFunction("removeItem", (key) => {
                storage.removeItem(context.getString(key));
            });
            const clearHandle = context.newFunction("clear", () => {
                storage.clear();
            });

            context.setProp(storageHandle, "setItem", setItemHandle);
            context.setProp(storageHandle, "getItem", getItemHandle);
            context.setProp(storageHandle, "removeItem", removeItemHandle);
            context.setProp(storageHandle, "clear", clearHandle);
            context.setProp(context.global, "storage", storageHandle);

            storageHandle.dispose();
            setItemHandle.dispose();
            getItemHandle.dispose();
            removeItemHandle.dispose();
            clearHandle.dispose();

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