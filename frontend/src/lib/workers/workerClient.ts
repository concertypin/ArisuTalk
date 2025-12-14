import * as Comlink from "comlink";
import type { ExampleWorkerApi } from "@worker/example/types";
import type { api as CardParseWorkerApi } from "@worker/cardparse/main";

/**
 * Type representing a worker API with a terminate method.
 * If the worker is terminated, calling any method will throw an error.
 * @template T The worker API type.
 */
type WorkerApi<T> =
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
    return {
        ...api,
        terminate(this) {
            this.disabled = true;
            worker.terminate();
        },
    };
}
// Used example's one, but actually all worker import have the same type.
type WorkerImport = typeof import("@worker/example/main?worker");

/**
 * Creates a reusable worker factory with caching functionality.
 * This eliminates the need to implement caching logic for each worker type.
 *
 * @param workerImport The function to dynamically import the worker module.
 * @returns A function that returns a cached worker instance
 */
function createCachedWorkerFactory<T>(workerImport: () => Promise<WorkerImport>) {
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
