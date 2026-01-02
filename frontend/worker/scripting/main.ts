import * as Comlink from "comlink";
import { getQuickJS, QuickJSDeferredPromise, QuickJSHandle } from "quickjs-emscripten";
import type { ScriptingWorkerApi, ExecutionOptions, ExecutionResult, ScriptContext } from "./types";
import { IsolatedStorage } from "./IsolatedStorage";

/**
 * Storage instances keyed by character ID for proper isolation.
 * Each character gets its own storage namespace to prevent cross-contamination.
 */
const storageByCharacter = new Map<string, IsolatedStorage>();

/**
 * Gets or creates an isolated storage instance for a given character.
 * Falls back to a shared default storage if no characterId is provided.
 */
function getStorageForCharacter(characterId?: string): IsolatedStorage {
    const key = characterId ?? "__default__";
    if (!storageByCharacter.has(key)) {
        storageByCharacter.set(key, new IsolatedStorage());
    }
    return storageByCharacter.get(key)!;
}

/**
 * Helper to create an async disposable wrapper.
 */
function asyncDisposable(cleanup: () => Promise<void>): AsyncDisposable {
    return { [Symbol.asyncDispose]: cleanup };
}

async function execute(code: string, options?: ExecutionOptions): Promise<ExecutionResult> {
    const logs: string[] = [];
    const QuickJS = await getQuickJS();

    // Use `using` for automatic disposal of runtime and context
    using runtime = QuickJS.newRuntime();
    using context = runtime.newContext();

    // Get storage instance for this character (isolated per character)
    const storage = getStorageForCharacter(options?.characterId);

    // Track all active deferred promises to ensure they are disposed
    const activeDeferreds = new Set<QuickJSDeferredPromise>();
    // Track host promises with abort capability
    const pendingHostPromises = new Set<Promise<unknown>>();
    const abortController = new AbortController();

    // Cleanup for deferreds and pending requests
    await using _cleanup = asyncDisposable(async () => {
        abortController.abort();
        await Promise.race([
            Promise.all(Array.from(pendingHostPromises)),
            new Promise((resolve) => setTimeout(resolve, 100)),
        ]);
        for (const deferred of activeDeferreds) {
            if (deferred.handle.alive) deferred.dispose();
        }
        activeDeferreds.clear();
    });

    try {
        // Setup console.log to capture logs
        context
            .newFunction("log", (...args) => {
                const message = args
                    .map((arg) => {
                        const json: unknown = context.dump(arg);
                        return typeof json === "string" ? json : JSON.stringify(json);
                    })
                    .join(" ");
                logs.push(message);
            })
            .consume((logHandle) => {
                using consoleHandle = context.newObject();
                context.setProp(consoleHandle, "log", logHandle);
                context.setProp(context.global, "console", consoleHandle);
            });

        // Setup IsolatedStorage
        {
            using storageHandle = context.newObject();
            context
                .newFunction("setItem", (keyH, valH) => {
                    storage.setItem(context.getString(keyH), context.getString(valH));
                })
                .consume((h) => context.setProp(storageHandle, "setItem", h));

            context
                .newFunction("getItem", (keyH) => {
                    const result = storage.getItem(context.getString(keyH));
                    return result === null ? context.null : context.newString(result);
                })
                .consume((h) => context.setProp(storageHandle, "getItem", h));

            context
                .newFunction("removeItem", (keyH) => {
                    storage.removeItem(context.getString(keyH));
                })
                .consume((h) => context.setProp(storageHandle, "removeItem", h));

            context
                .newFunction("clear", () => {
                    storage.clear();
                })
                .consume((h) => context.setProp(storageHandle, "clear", h));

            context.setProp(context.global, "storage", storageHandle);
        }

        // Setup fetch with permission check
        context
            .newFunction("fetch", (urlHandle) => {
                const url = context.getString(urlHandle);
                const deferred = context.newPromise();
                activeDeferreds.add(deferred);

                if (!options?.allowNetwork) {
                    using error = context.newError(
                        "Network access denied. Enable 'Low-Level Access' to use fetch."
                    );
                    deferred.reject(error);
                    return deferred.handle.dup();
                }

                const p = fetch(url, { signal: abortController.signal })
                    .then((res) => res.text())
                    .then((text) => {
                        if (context.alive && deferred.handle.alive) {
                            using result = context.newString(text);
                            deferred.resolve(result);
                        }
                    })
                    .catch((err) => {
                        if (context.alive && deferred.handle.alive) {
                            using error = context.newError(
                                err instanceof Error ? err.message : String(err)
                            );
                            deferred.reject(error);
                        }
                    })
                    .finally(() => {
                        runtime.executePendingJobs();
                        pendingHostPromises.delete(p);
                    });

                pendingHostPromises.add(p);
                return deferred.handle.dup();
            })
            .consume((h) => context.setProp(context.global, "fetch", h));

        // Inject context data
        if (options?.context) {
            using ctxHandle = context.newObject();
            {
                using msgHandle = context.newObject();
                context.setProp(
                    msgHandle,
                    "content",
                    context.newString(options.context.message.content)
                );
                context.setProp(msgHandle, "role", context.newString(options.context.message.role));

                {
                    using metaHandle = context.newObject();
                    for (const [k, v] of Object.entries(options.context.message.metadata)) {
                        using val =
                            typeof v === "string"
                                ? context.newString(v)
                                : typeof v === "number"
                                  ? context.newNumber(v)
                                  : typeof v === "boolean"
                                    ? v
                                        ? context.true
                                        : context.false
                                    : context.newString(JSON.stringify(v));
                        context.setProp(metaHandle, k, val);
                    }
                    context.setProp(msgHandle, "metadata", metaHandle);
                }
                context.setProp(ctxHandle, "message", msgHandle);
            }

            if (options.context.persona) {
                using personaHandle = context.newObject();
                context.setProp(
                    personaHandle,
                    "name",
                    context.newString(options.context.persona.name)
                );
                context.setProp(personaHandle, "id", context.newString(options.context.persona.id));
                context.setProp(ctxHandle, "persona", personaHandle);
            }

            context.setProp(context.global, "context", ctxHandle);
        }

        const evalResult = context.evalCode(code);

        if (evalResult.error) {
            using errorHandle = evalResult.error;
            const error: unknown = context.dump(errorHandle);
            // QuickJS's SuccessOrFail union doesn't expose .value on fail type, but it exists internally
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            (evalResult as any).value?.dispose?.();
            return { logs, error: typeof error === "string" ? error : JSON.stringify(error) };
        }

        // Detect and handle promises
        let finalValue: unknown = undefined;
        {
            using valueHandle = evalResult.value;

            // Check if it's a promise by looking for .then() function
            const isPromise = (() => {
                using thenHandle = context.getProp(valueHandle, "then");
                return thenHandle !== context.undefined && thenHandle !== context.null;
            })();

            if (isPromise) {
                const resultPromise = context.resolvePromise(valueHandle);

                const timeout = options?.timeout ?? 5000;
                const start = Date.now();
                let settled = false;
                let timedOut = false;
                let promiseResult: { error?: QuickJSHandle; value?: QuickJSHandle } | undefined =
                    undefined;

                void resultPromise.then((res) => {
                    if (timedOut) {
                        // Dispose handles if we already timed out
                        /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
                        (res as any).value?.dispose?.();
                        (res as any).error?.dispose?.();
                        /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
                        return;
                    }
                    settled = true;
                    promiseResult = res as { error?: QuickJSHandle; value?: QuickJSHandle };
                });

                while (!settled) {
                    const executed = runtime.executePendingJobs();
                    if (Date.now() - start > timeout) {
                        timedOut = true;
                        return { logs, error: "Execution timed out" };
                    }
                    if (settled) break;
                    // Only wait if no jobs were executed
                    const jobCount =
                        typeof executed === "number"
                            ? executed
                            : (executed as { value: number }).value;
                    if (!jobCount) {
                        await new Promise((resolve) => setTimeout(resolve, 10));
                    }
                }

                // Handle the settled promise result
                // TypeScript's flow analysis doesn't track async closure mutations properly
                type PromiseResultType = { error?: QuickJSHandle; value?: QuickJSHandle };
                const result = promiseResult as PromiseResultType | undefined;
                if (result) {
                    if (result.error) {
                        const error: unknown = context.dump(result.error);
                        result.error.dispose();
                        return {
                            logs,
                            error: typeof error === "string" ? error : JSON.stringify(error),
                        };
                    }

                    if (result.value) {
                        finalValue = context.dump(result.value);
                        result.value.dispose();
                    }
                }
            } else {
                finalValue = context.dump(valueHandle);
            }
        }

        let modifiedContext: ScriptContext | undefined = undefined;
        context.getProp(context.global, "context").consume((ctxH) => {
            if (ctxH !== context.undefined && ctxH !== context.null) {
                modifiedContext = context.dump(ctxH) as ScriptContext;
            }
        });

        return { result: finalValue, modifiedContext, logs };
    } catch (e) {
        return { logs, error: e instanceof Error ? e.message : String(e) };
    }
}

export const api: ScriptingWorkerApi = {
    execute,
};

Comlink.expose(api);
