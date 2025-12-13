import * as Comlink from "comlink";
import type { ExampleWorkerApi } from "@worker/example/types";
import type { api as CardParseWorkerApi } from "@worker/cardparse/main";

type WorkerApi<T> = Comlink.Remote<T> & { terminate: () => void };

function createWorkerApi<T>(worker: Worker): WorkerApi<T> {
    const api = Comlink.wrap<T>(worker);
    return {
        ...api,
        terminate: () => {
            worker.terminate();
        },
    };
}

/**
 * Factory for the Example Worker.
 * Using standard Vite worker import syntax.
 * For example and doesn't do anything useful.
 */
export async function getExampleWorker(): Promise<WorkerApi<ExampleWorkerApi>> {
    const WorkerClass = (await import("@worker/example/main?worker")).default;
    const worker = new WorkerClass();
    return createWorkerApi<ExampleWorkerApi>(worker);
}
export async function getCardParseWorker(): Promise<WorkerApi<typeof CardParseWorkerApi>> {
    const WorkerClass = (await import("@worker/cardparse/main?worker")).default;
    const worker = new WorkerClass();
    return createWorkerApi<typeof CardParseWorkerApi>(worker);
}
