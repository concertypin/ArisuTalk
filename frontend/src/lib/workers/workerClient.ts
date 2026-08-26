import * as Comlink from "comlink";
import type { ExampleWorkerApi } from "@worker/example/types";
import type { api as CardParseWorkerApi } from "@worker/cardparse/main";
import type { ScriptingWorkerApi } from "@worker/scripting/types";
import type { RegexWorkerApi } from "@worker/regex/types";
import { logReceiver } from "@/lib/services/telemetry";

/**
 * Type representing a worker API with a terminate method.
 * If the worker is terminated, calling any method will throw an error.
 * @template T The worker API type.
 */
export type WorkerApi<T> =
    | (Comlink.Remote<T> & {
          terminate: (this: WorkerApi<T>) => void;
          disabled?: false;
      })
    | ({
          terminate: () => void;
          disabled: true;
      } & {
          [k in keyof Comlink.Remote<T>]: Comlink.Remote<T>[k] extends (...arg: infer A) => unknown
              ? (...arg: A) => never // Callable but always throws
              : never; // Non-callable properties become never
      });

function createWorkerApi<T>(worker: Worker): WorkerApi<T> {
    const api = Comlink.wrap<T>(worker);
    let disabled = false;

    // Automatically set up logging if the worker supports it
    if ("setLogReceiver" in api && typeof api.setLogReceiver === "function") {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        void api.setLogReceiver(Comlink.proxy(logReceiver));
    }

    // @ts-expect-error -- Proxy adds terminate/disabled at runtime; Remote<T> → WorkerApi<T>
    return new Proxy(api, {
        get: (target, prop) => {
            if (prop === "terminate") {
                return function () {
                    disabled = true;
                    worker.terminate();
                };
            }
            if (prop === "disabled") {
                return disabled;
            }
            if (typeof prop === "symbol") return Reflect.get(target, prop);
            return Reflect.get(target, prop);
        },
    });
}
/** Module type returned by Vite `?worker` dynamic imports. */
type WorkerModule = { default: new (...args: never[]) => Worker };

/**
 * Creates a reusable worker factory with caching functionality.
 * This eliminates the need to implement caching logic for each worker type.
 *
 * @param workerImport The function to dynamically import the worker module.
 * @returns A function that returns a cached worker instance
 */
function createCachedWorkerFactory<T>(workerImport: () => Promise<WorkerModule>) {
    let workerInstance: WorkerApi<T> | null = null;
    let initPromise: Promise<WorkerApi<T>> | null = null;

    return async (): Promise<WorkerApi<T>> => {
        // If already have a usable instance, return it
        if (workerInstance && !workerInstance.disabled) return workerInstance;

        // If creation is in progress, wait for it (prevents races creating multiple workers)
        if (initPromise) return initPromise;

        initPromise = (async () => {
            const WorkerClass = (await workerImport()).default;
            const worker = new WorkerClass();
            const api = createWorkerApi<T>(worker);
            workerInstance = api;
            initPromise = null;
            return api;
        })();

        return initPromise;
    };
}

/**
 * Factory for the Example Worker.
 * Using standard Vite worker import syntax.
 * For example and doesn't do anything useful.
 * Automatically cached using createCachedWorkerFactory.
 */
export const getExampleWorker = createCachedWorkerFactory<ExampleWorkerApi>(
    () => import("@worker/example/main?worker")
);

/**
 * Factory for the Card Parse Worker with caching.
 * Reuses the same worker instance across calls for better performance.
 * Automatically cached using createCachedWorkerFactory.
 */
export const getCardParseWorker = createCachedWorkerFactory<typeof CardParseWorkerApi>(
    () => import("@worker/cardparse/main?worker")
);

/**
 * Factory for the Scripting Worker with caching.
 * Provides a sandboxed environment for executing JavaScript.
 * Automatically cached using createCachedWorkerFactory.
 */
export const getScriptingWorker = createCachedWorkerFactory<ScriptingWorkerApi>(
    () => import("@worker/scripting/main?worker")
);

/**
 * Factory for the Regex Worker with caching.
 * Provides non-blocking text processing using native JS RegExp.
 * Automatically cached using createCachedWorkerFactory.
 */
export const getRegexWorker = createCachedWorkerFactory<RegexWorkerApi>(
    () => import("@worker/regex/main?worker")
);
