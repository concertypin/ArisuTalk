import {
    type QuickJSContext,
    type QuickJSDeferredPromise,
    type QuickJSHandle,
    type QuickJSRuntime,
    type QuickJSWASMModule,
} from "quickjs-emscripten";
import { IsolatedStorage } from "./IsolatedStorage";
import type { ExecutionOptions, ScriptContext } from "./types";

// ============================================================================
// Storage Management
// ============================================================================

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

// ============================================================================
// Context Setup Functions
// ============================================================================

/**
 * Sets up `console.log` in the QuickJS context to capture logs.
 * All logged messages are pushed to the provided logs array.
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

type SetupFetchOptions = {
    allowNetwork: boolean;
    abortController: AbortController;
    activeDeferreds: Set<QuickJSDeferredPromise>;
    pendingHostPromises: Set<Promise<unknown>>;
};

/**
 * Sets up the `fetch` API in the QuickJS context with permission checks.
 * If network access is denied, fetch immediately rejects with an error.
 * All fetch requests are tracked for cleanup on timeout or disposal.
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
                        const errorMessage =
                            err instanceof Error
                                ? `${err.name}: ${err.message}\n${err.stack}`
                                : String(err);
                        using error = context.newError(errorMessage);
                        deferred.reject(error);
                    }
                })
                .finally(() => {
                    if (runtime.alive) {
                        runtime.executePendingJobs();
                    }
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

type PromiseResult = { error?: QuickJSHandle; value?: QuickJSHandle };

/**
 * Awaits a QuickJS promise with timeout, polling the runtime for pending jobs.
 * If the promise doesn't settle within the timeout, returns early with `timedOut: true`.
 */
export async function awaitPromiseResult(
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
            // The caller is responsible for cleanup on timeout.
            // Avoid using handles here as the context might be already disposed.
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
 */
export function extractModifiedContext(context: QuickJSContext): ScriptContext | undefined {
    let modifiedContext: ScriptContext | undefined = undefined;
    context.getProp(context.global, "context").consume((ctxH) => {
        if (ctxH !== context.undefined && ctxH !== context.null) {
            modifiedContext = context.dump(ctxH) as ScriptContext;
        }
    });
    return modifiedContext;
}

// ============================================================================
// Helper for error dumping
// ============================================================================

export function dumpError(context: QuickJSContext, errorHandle: QuickJSHandle): string {
    const error: unknown = context.dump(errorHandle);
    return typeof error === "string" ? error : JSON.stringify(error);
}

// ============================================================================
// ScriptExecutionEnvironment Class
// ============================================================================

/**
 * Encapsulates the setup, execution environment, and teardown for a single QuickJS script execution.
 * This class ensures a fresh, isolated environment for each script, managing resources like
 * QuickJS runtime/context, storage, network access, and proper cleanup.
 */
export class ScriptExecutionEnvironment implements AsyncDisposable {
    public readonly runtime: QuickJSRuntime;
    public readonly context: QuickJSContext;
    public readonly logs: string[] = [];
    public readonly activeDeferreds = new Set<QuickJSDeferredPromise>();
    public readonly pendingHostPromises = new Set<Promise<unknown>>();
    public readonly abortController = new AbortController();

    constructor(QuickJS: QuickJSWASMModule, options: ExecutionOptions | undefined) {
        this.runtime = QuickJS.newRuntime();
        this.context = this.runtime.newContext();

        const storage = getStorageForCharacter(options?.characterId);

        setupConsole(this.context, this.logs);
        setupStorage(this.context, storage);
        setupFetch(this.context, this.runtime, {
            allowNetwork: options?.allowNetwork ?? false,
            abortController: this.abortController,
            activeDeferreds: this.activeDeferreds,
            pendingHostPromises: this.pendingHostPromises,
        });

        if (options?.context) {
            injectContext(this.context, options.context);
        }
    }

    /**
     * Disposes of all QuickJS resources and cleans up any pending operations.
     * This method is automatically called when using `await using` with an instance of this class.
     */
    async [Symbol.asyncDispose](): Promise<void> {
        this.abortController.abort();

        // Wait briefly for any pending host promises to settle after aborting,
        // but don't block indefinitely.
        await Promise.race([
            Promise.all(Array.from(this.pendingHostPromises)),
            new Promise((resolve) => setTimeout(resolve, 100)),
        ]);

        // Dispose of any remaining active deferred promises
        for (const deferred of this.activeDeferreds) {
            if (deferred.handle.alive) deferred.dispose();
        }
        this.activeDeferreds.clear();

        this.context.dispose();
        this.runtime.dispose();
    }
}
