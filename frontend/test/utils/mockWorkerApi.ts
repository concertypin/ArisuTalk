import { vi } from "vitest";
import type { WorkerApi } from "@/lib/workers/workerClient";
import type { ScriptingWorkerApi } from "@worker/scripting/types";

/**
 * Creates a mock WorkerApi for testing.
 * @template T The worker API type.
 * @param methods The methods to mock on the worker.
 * @returns A mock WorkerApi object.
 */
export function mockWorkerApi<T extends object>(methods: T): WorkerApi<T> {
    return {
        terminate: vi.fn(),
        disabled: false,
        ...methods,
    } as WorkerApi<T>;
}

/**
 * Creates a mock ScriptingWorkerApi for testing.
 * @param execute The mock execute function.
 * @returns A mock WorkerApi<ScriptingWorkerApi> object.
 */
export function mockScriptingWorker<const T extends ScriptingWorkerApi["execute"]>(
    execute: T
): WorkerApi<ScriptingWorkerApi> {
    return mockWorkerApi<ScriptingWorkerApi>({
        execute,
        setLogReceiver: vi.fn(),
    });
}
