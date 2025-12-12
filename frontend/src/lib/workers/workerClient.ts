import * as Comlink from "comlink";
import type { ExampleWorkerApi } from "@worker/example/types";
import type { api as CardParseWorkerApi } from "@worker/cardparse/main";

type WorkerApi<T> = Comlink.Remote<T> & { terminate: () => void };

/**
 * Factory for the Example Worker.
 * Using standard Vite worker import syntax.
 * For example and doesn't do anything useful.
 */
async function _getExampleWorker(): Promise<WorkerApi<ExampleWorkerApi>> {
    const WorkerClass = (await import("@worker/example/main?worker")).default;
    const worker = new WorkerClass();

    const api = Comlink.wrap<ExampleWorkerApi>(worker);

    return Object.assign(api, {
        terminate: () => {
            worker.terminate();
        },
    });
}
export async function getCardParseWorker(): Promise<WorkerApi<typeof CardParseWorkerApi>> {
    const WorkerClass = (await import("@worker/cardparse/main?worker")).default;
    const worker = new WorkerClass();
    const api = Comlink.wrap<typeof CardParseWorkerApi>(worker);
    return Object.assign(api, {
        terminate: () => {
            worker.terminate();
        },
    });
}
