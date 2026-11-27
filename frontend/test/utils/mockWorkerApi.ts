import { runInNewContext } from "node:vm";
import { vi } from "vitest";
import type { WorkerApi } from "@/lib/workers/workerClient";
import type {
    ExecutionOptions,
    ExecutionResult,
    ScriptingWorkerApi,
} from "@worker/scripting/types";

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

/**
 * Evaluates scripting worker code with Node's `vm`, a stand-in for the QuickJS worker.
 * Follows the worker's rule: code with a statement or a leading `return` is a function body,
 * anything else is an expression whose value is returned. Failures come back as `error`, not a throw.
 * @param code - The script source.
 * @param _options - Ignored; accepted so this fits `ScriptingWorkerApi["execute"]`.
 * @returns The result or the error message, with no logs.
 */
export async function runInVm(code: string, _options?: ExecutionOptions): Promise<ExecutionResult> {
    try {
        const hasStatements = /[;]|^\s*return\s+/.test(code);
        const body = hasStatements ? code : `return (${code});`;
        const result: unknown = runInNewContext(`(function () {\n${body}\n})()`);
        return { result, logs: [] };
    } catch (error) {
        return { error: error instanceof Error ? error.message : String(error), logs: [] };
    }
}
