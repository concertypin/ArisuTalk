import * as Comlink from "comlink";
import defFunc from "define-function";
import type { ScriptingWorkerApi, ExecutionOptions, ExecutionResult, ScriptContext } from "./types";
import { IsolatedStorage } from "./IsolatedStorage";
import { createLogBridgeSender, type LogBridgeReceiver } from "@common/logger/LogBridge";

const SCRIPT_TIMEOUT_MS = 5000;
let logger: ReturnType<typeof createLogBridgeSender> | null = null;

/**
 * Storage instances keyed by character ID for proper isolation.
 * Each character gets its own storage namespace to prevent cross-contamination.
 */
const storageByCharacter = new Map<string, IsolatedStorage>();

/**
 * Gets or creates an isolated storage instance for a given character.
 * If no characterId is provided, returns a shared default storage instance.
 */
function getStorageForCharacter(characterId?: string): IsolatedStorage {
    const key = characterId ?? "__default__";
    if (!storageByCharacter.has(key)) {
        storageByCharacter.set(key, new IsolatedStorage());
    }
    return storageByCharacter.get(key)!;
}

/**
 * Creates a console object that captures logs to an array.
 */
function createConsole(logs: string[]) {
    return {
        log: (...args: unknown[]) => {
            const message = args
                .map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg)))
                .join(" ");
            logs.push(message);
        },
    };
}

/**
 * Creates a fetch function with permission checking and abort support.
 */
function createFetch(allowNetwork: boolean, abortController: AbortController) {
    return async (url: string): Promise<string> => {
        if (!allowNetwork) {
            throw new Error("Network access denied. Enable 'Low-Level Access' to use fetch.");
        }
        const res = await fetch(url, { signal: abortController.signal });
        return await res.text();
    };
}

/**
 * Executes JavaScript code in a sandboxed environment using define-function.
 * Provides isolated storage, optional network access, and context injection.
 *
 * @param code - The JavaScript code to execute.
 * @param options - Optional execution configuration.
 * @returns The execution result including return value, logs, and any errors.
 *
 * @see {@link ExecutionOptions} - Available configuration options.
 * @see {@link ExecutionResult} - Return type structure.
 * @see {@link ScriptingWorkerApi} - The worker API interface.
 */
async function execute<ResultType = unknown>(
    code: string,
    options?: ExecutionOptions
): Promise<ExecutionResult<ResultType>> {
    logger?.debug("Executing script...", { characterId: options?.characterId });

    const logs: string[] = [];
    const storage = getStorageForCharacter(options?.characterId);
    const abortController = new AbortController();

    try {
        // Create the sandbox context with global injections
        // Note: We wrap storage methods to preserve 'this' binding in the sandbox
        const storageApi = {
            getItem: (key: string) => storage.getItem(key),
            setItem: (key: string, value: string) => storage.setItem(key, value),
            removeItem: (key: string) => storage.removeItem(key),
            clear: () => storage.clear(),
            get length() {
                return storage.length;
            },
            key: (index: number) => storage.key(index),
        };

        // Await is intended(due to improper d.ts.
        // console.log(defFunc.context()) shows `Promise { <pending> }`)
        // eslint-disable-next-line @typescript-eslint/await-thenable
        const ctx = await defFunc.context({
            global: {
                console: createConsole(logs),
                storage: storageApi,
                fetch: createFetch(options?.allowNetwork ?? false, abortController),
                context: options?.context,
            },
        });

        try {
            // Smart code wrapping:
            // If code contains statements (semicolons) or explicit return, use as function body
            // Otherwise wrap as expression for convenience
            const hasStatements = /[;]|^\s*return\s+/.test(code);

            let fn: Promise<() => ResultType>;

            if (hasStatements) {
                // Code has statements - use as-is as function body
                fn = ctx.def(code, { timeout: options?.timeout ?? SCRIPT_TIMEOUT_MS });
            } else {
                // Simple expression - wrap with return for convenience
                fn = ctx.def(`return (${code});`, {
                    timeout: options?.timeout ?? SCRIPT_TIMEOUT_MS,
                });
            }

            const result: ResultType = (await fn)();

            // Extract modified context if it was mutated
            let modifiedContext: ScriptContext | undefined = undefined;
            if (options?.context) {
                const extractCtx = await ctx.def(`return global.context;`);
                const extractedValue = (await extractCtx()) as unknown;
                if (extractedValue && typeof extractedValue === "object") {
                    modifiedContext = extractedValue as ScriptContext;
                }
            }

            return { result, modifiedContext, logs };
        } finally {
            ctx.dispose();
        }
    } catch (e) {
        abortController.abort();
        //Should be replaced with logger when production
        //Just for testing purpose
        console.error("Script execution error", e);
        return {
            logs,
            error: e instanceof Error ? `${e.message}\n${e.stack}` : String(e),
        };
    }
}

/** The worker API exposed via Comlink. */
export const api: ScriptingWorkerApi = {
    execute,
    setLogReceiver(receiver: LogBridgeReceiver) {
        logger = createLogBridgeSender(receiver);
        logger.info("Scripting worker connected to telemetry");
    },
};

Comlink.expose(api);
