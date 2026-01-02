import * as Comlink from "comlink";
import {
    getQuickJS,
    type QuickJSContext,
    type QuickJSDeferredPromise,
    type QuickJSHandle,
    type QuickJSRuntime,
} from "quickjs-emscripten";
import type { ScriptingWorkerApi, ExecutionOptions, ExecutionResult, ScriptContext } from "./types";
import { IsolatedStorage } from "./IsolatedStorage";

// ============================================================================
// Storage Management
// ============================================================================

/**
 * Storage instances keyed by character ID for proper isolation.
 * Each character gets its own storage namespace to prevent cross-contamination.
 * @see {@link getStorageForCharacter}
 */
const storageByCharacter = new Map<string, IsolatedStorage>();

/**
 * Gets or creates an isolated storage instance for a given character.
 * If no characterId is provided, returns a shared default storage instance.
 *
 * @param characterId - The unique identifier for the character, or undefined for default storage.
 * @returns The {@link IsolatedStorage} instance for the specified character.
 *
 * @example
 * ```ts
 * const storage = getStorageForCharacter("char-123");
 * storage.setItem("key", "value");
 * ```
 */
function getStorageForCharacter(characterId?: string): IsolatedStorage {
    const key = characterId ?? "__default__";
    if (!storageByCharacter.has(key)) {
        storageByCharacter.set(key, new IsolatedStorage());
    }
    return storageByCharacter.get(key)!;
}

// ============================================================================
// Disposable Helpers
// ============================================================================

/**
 * Creates an async disposable wrapper for custom cleanup logic.
 * Enables using `await using` syntax for automatic cleanup on scope exit.
 *
 * @param cleanup - Async function to execute when disposed.
 * @returns An {@link AsyncDisposable} object that runs cleanup when disposed.
 *
 * @example
 * ```ts
 * await using _cleanup = asyncDisposable(async () => {
 *     await closeConnection();
 * });
 * // cleanup runs automatically when scope exits
 * ```
 */
function asyncDisposable(cleanup: () => Promise<void>): AsyncDisposable {
    return { [Symbol.asyncDispose]: cleanup };
}

// ============================================================================
// Context Setup Functions
// ============================================================================

/**
 * Sets up `console.log` in the QuickJS context to capture logs.
 * All logged messages are pushed to the provided logs array.
 *
 * @param context - The QuickJS context to set up console in.
 * @param logs - Array to collect log messages.
 *
 * @see {@link execute} - Main function that uses this setup.
 */
function setupConsole(context: QuickJSContext, logs: string[]): void {
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
}

/**
 * Sets up the `storage` API in the QuickJS context.
 * Provides `setItem`, `getItem`, `removeItem`, and `clear` methods
 * that delegate to the provided {@link IsolatedStorage} instance.
 *
 * @param context - The QuickJS context to set up storage in.
 * @param storage - The {@link IsolatedStorage} instance to use as backend.
 *
 * @see {@link IsolatedStorage} - The storage implementation.
 * @see {@link getStorageForCharacter} - Storage isolation per character.
 */
function setupStorage(context: QuickJSContext, storage: IsolatedStorage): void {
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

/**
 * Options for setting up the fetch API in QuickJS context.
 */
type SetupFetchOptions = {
    /** Whether network access is allowed. If false, fetch rejects immediately. */
    allowNetwork: boolean;
    /** Controller to abort pending fetch requests on cleanup. */
    abortController: AbortController;
    /** Set to track active deferred promises for cleanup. */
    activeDeferreds: Set<QuickJSDeferredPromise>;
    /** Set to track pending host promises for cleanup. */
    pendingHostPromises: Set<Promise<unknown>>;
};

/**
 * Sets up the `fetch` API in the QuickJS context with permission checks.
 * If network access is denied, fetch immediately rejects with an error.
 * All fetch requests are tracked for cleanup on timeout or disposal.
 *
 * @param context - The QuickJS context to set up fetch in.
 * @param runtime - The QuickJS runtime for executing pending jobs.
 * @param options - Configuration options for fetch behavior and tracking.
 *
 * @see {@link SetupFetchOptions} - Options type definition.
 * @see {@link ExecutionOptions.allowNetwork} - How network permission is specified.
 */
function setupFetch(
    context: QuickJSContext,
    runtime: QuickJSRuntime,
    options: SetupFetchOptions
): void {
    context
        .newFunction("fetch", (urlHandle) => {
            const url = context.getString(urlHandle);
            const deferred = context.newPromise();
            options.activeDeferreds.add(deferred);

            if (!options.allowNetwork) {
                using error = context.newError(
                    "Network access denied. Enable 'Low-Level Access' to use fetch."
                );
                deferred.reject(error);
                return deferred.handle.dup();
            }

            const p = fetch(url, { signal: options.abortController.signal })
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
                    options.pendingHostPromises.delete(p);
                });

            options.pendingHostPromises.add(p);
            return deferred.handle.dup();
        })
        .consume((h) => context.setProp(context.global, "fetch", h));
}

/**
 * Injects script context data into the QuickJS global scope.
 * Creates a `context` global object with `message` and optionally `persona` properties.
 *
 * @param context - The QuickJS context to inject data into.
 * @param scriptContext - The context data containing message and persona info.
 *
 * @see {@link ScriptContext} - The context data structure.
 * @see {@link extractModifiedContext} - Retrieves potentially modified context after execution.
 */
function injectContext(context: QuickJSContext, scriptContext: ScriptContext): void {
    using ctxHandle = context.newObject();

    // Message object
    {
        using msgHandle = context.newObject();
        context.setProp(msgHandle, "content", context.newString(scriptContext.message.content));
        context.setProp(msgHandle, "role", context.newString(scriptContext.message.role));

        // Metadata object
        {
            using metaHandle = context.newObject();
            for (const [k, v] of Object.entries(scriptContext.message.metadata)) {
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

    // Persona object (optional)
    if (scriptContext.persona) {
        using personaHandle = context.newObject();
        context.setProp(personaHandle, "name", context.newString(scriptContext.persona.name));
        context.setProp(personaHandle, "id", context.newString(scriptContext.persona.id));
        context.setProp(ctxHandle, "persona", personaHandle);
    }

    context.setProp(context.global, "context", ctxHandle);
}

// ============================================================================
// Promise Handling
// ============================================================================

/**
 * Result type for QuickJS promise resolution.
 * Contains either an error handle or a value handle (or both undefined).
 */
type PromiseResult = { error?: QuickJSHandle; value?: QuickJSHandle };

/**
 * Awaits a QuickJS promise with timeout, polling the runtime for pending jobs.
 * If the promise doesn't settle within the timeout, returns early with `timedOut: true`.
 * Handles disposed by the callback if timeout occurred before settlement.
 *
 * @param runtime - The QuickJS runtime to poll for pending jobs.
 * @param resultPromise - The promise from `context.resolvePromise()`.
 * @param timeout - Maximum time to wait in milliseconds.
 * @returns Object containing the result (if settled) and whether timeout occurred.
 *
 * @example
 * ```ts
 * const { result, timedOut } = await awaitPromiseResult(runtime, promise, 5000);
 * if (timedOut) {
 *     return { error: "Execution timed out" };
 * }
 * ```
 */
async function awaitPromiseResult(
    runtime: QuickJSRuntime,
    resultPromise: Promise<PromiseResult>,
    timeout: number
): Promise<{ result?: PromiseResult; timedOut: boolean }> {
    const start = Date.now();
    let settled = false;
    let timedOut = false;
    let promiseResult: PromiseResult | undefined = undefined;

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
        promiseResult = res;
    });

    while (!settled) {
        const executed = runtime.executePendingJobs();
        if (Date.now() - start > timeout) {
            timedOut = true;
            return { timedOut: true };
        }
        if (settled) break;

        // Only wait if no jobs were executed
        const jobCount =
            typeof executed === "number" ? executed : (executed as { value: number }).value;
        if (!jobCount) {
            await new Promise((resolve) => setTimeout(resolve, 10));
        }
    }

    return { result: promiseResult, timedOut: false };
}

/**
 * Extracts the modified context from the QuickJS global scope.
 * Scripts can modify `context.message.content` or other properties;
 * this function retrieves the potentially modified context object.
 *
 * @param context - The QuickJS context to extract from.
 * @returns The modified {@link ScriptContext}, or undefined if not present.
 *
 * @see {@link injectContext} - Injects the initial context.
 */
function extractModifiedContext(context: QuickJSContext): ScriptContext | undefined {
    let modifiedContext: ScriptContext | undefined = undefined;
    context.getProp(context.global, "context").consume((ctxH) => {
        if (ctxH !== context.undefined && ctxH !== context.null) {
            modifiedContext = context.dump(ctxH) as ScriptContext;
        }
    });
    return modifiedContext;
}

// ============================================================================
// Main Execute Function
// ============================================================================

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
 *
 * @example
 * ```ts
 * const result = await execute("console.log('Hello'); 42", {
 *     timeout: 3000,
 *     characterId: "char-123",
 *     context: { message: { content: "Hi", role: "user", metadata: {} } }
 * });
 * // result.logs = ["Hello"], result.result = 42
 * ```
 */
async function execute(code: string, options?: ExecutionOptions): Promise<ExecutionResult> {
    const logs: string[] = [];
    const QuickJS = await getQuickJS();

    using runtime = QuickJS.newRuntime();
    using context = runtime.newContext();

    const storage = getStorageForCharacter(options?.characterId);
    const activeDeferreds = new Set<QuickJSDeferredPromise>();
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
        // Setup global APIs
        setupConsole(context, logs);
        setupStorage(context, storage);
        setupFetch(context, runtime, {
            allowNetwork: options?.allowNetwork ?? false,
            abortController,
            activeDeferreds,
            pendingHostPromises,
        });

        // Inject context data if provided
        if (options?.context) {
            injectContext(context, options.context);
        }

        // Evaluate the code
        const evalResult = context.evalCode(code);

        if (evalResult.error) {
            using errorHandle = evalResult.error;
            const error: unknown = context.dump(errorHandle);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            (evalResult as any).value?.dispose?.();
            return { logs, error: typeof error === "string" ? error : JSON.stringify(error) };
        }

        // Handle the result
        let finalValue: unknown = undefined;
        {
            using valueHandle = evalResult.value;

            const isPromise = (() => {
                using thenHandle = context.getProp(valueHandle, "then");
                return thenHandle !== context.undefined && thenHandle !== context.null;
            })();

            if (isPromise) {
                const resultPromise = context.resolvePromise(valueHandle);
                const timeout = options?.timeout ?? 5000;
                const { result, timedOut } = await awaitPromiseResult(
                    runtime,
                    resultPromise,
                    timeout
                );

                if (timedOut) {
                    return { logs, error: "Execution timed out" };
                }

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

        const modifiedContext = extractModifiedContext(context);
        return { result: finalValue, modifiedContext, logs };
    } catch (e) {
        return { logs, error: e instanceof Error ? e.message : String(e) };
    }
}

// ============================================================================
// API Export
// ============================================================================

/** The worker API exposed via Comlink. */
export const api: ScriptingWorkerApi = { execute };

Comlink.expose(api);
