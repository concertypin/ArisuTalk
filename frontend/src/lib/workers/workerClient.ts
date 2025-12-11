import * as Comlink from "comlink";
import type { ExampleWorkerApi } from "@worker/example/types";

/**
 * Factory for the Example Worker.
 * Using standard Vite worker import syntax.
 */
export async function getExampleWorker(): Promise<
    Comlink.Remote<ExampleWorkerApi> & { terminate: () => void }
> {
    const WorkerClass = (await import("@worker/example/main?worker")).default;
    const worker = new WorkerClass();

    const api = Comlink.wrap<ExampleWorkerApi>(worker);

    return Object.assign(api, {
        terminate: () => {
            worker.terminate();
        },
    });
}
