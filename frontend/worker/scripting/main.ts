import * as Comlink from "comlink";
import { getQuickJS } from "quickjs-emscripten";
import type { ScriptingWorkerApi, ExecutionOptions, ExecutionResult } from "./types";
import {
    ScriptExecutionEnvironment,
    awaitPromiseResult,
    dumpError,
    extractModifiedContext,
} from "./ScriptExecutionEnvironment";

/**
 * Executes JavaScript code in a sandboxed QuickJS environment.
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
async function execute(code: string, options?: ExecutionOptions): Promise<ExecutionResult> {
    const QuickJS = await getQuickJS();

    // The 'await using' statement ensures proper disposal of the environment
    await using env = new ScriptExecutionEnvironment(QuickJS, options);

    try {
        // Evaluate the code
        const evalResult = env.context.evalCode(code);

        if (evalResult.error) {
            using errorHandle = evalResult.error;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            (evalResult as any).value?.dispose?.();
            return { logs: env.logs, error: dumpError(env.context, errorHandle) };
        }

        // Handle the result
        let finalValue: unknown = undefined;
        {
            using valueHandle = evalResult.value;

            const isPromise = (() => {
                using thenHandle = env.context.getProp(valueHandle, "then");
                return thenHandle !== env.context.undefined && thenHandle !== env.context.null;
            })();

            if (isPromise) {
                const resultPromise = env.context.resolvePromise(valueHandle);
                const timeout = options?.timeout ?? 5000;
                const { result, timedOut } = await awaitPromiseResult(
                    env.runtime,
                    resultPromise,
                    timeout
                );

                if (timedOut) {
                    return { logs: env.logs, error: "Execution timed out" };
                }

                if (result) {
                    if (result.error) {
                        const error = dumpError(env.context, result.error);
                        result.error.dispose();
                        return {
                            logs: env.logs,
                            error: error,
                        };
                    }

                    if (result.value) {
                        finalValue = env.context.dump(result.value);
                        result.value.dispose();
                    }
                }
            } else {
                finalValue = env.context.dump(valueHandle);
            }
        }

        const modifiedContext = extractModifiedContext(env.context);
        return { result: finalValue, modifiedContext, logs: env.logs };
    } catch (e) {
        return {
            logs: env.logs,
            error: e instanceof Error ? `${e.message}\n${e.stack}` : String(e),
        };
    }
}

/** The worker API exposed via Comlink. */
export const api: ScriptingWorkerApi = { execute };

Comlink.expose(api);
