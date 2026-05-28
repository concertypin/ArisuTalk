// @vitest-environment happy-dom

import { describe, it, expect, vi } from "vitest";
import { getExampleWorker } from "@/lib/workers/workerClient";

// Mock the Vite worker import
vi.mock("@worker/example/main?worker", () => {
    return {
        default: class MockWorker {
            terminate() {}
            postMessage() {}
            addEventListener() {}
            removeEventListener() {}
        },
    };
});

const mockApi = {
    greet: vi.fn(async (name: string) => `Hello, ${name}!`),
    fibonacci: vi.fn(async (n: number) => n),
    setLogReceiver: vi.fn(),
};

// Mock Comlink
vi.mock("comlink", () => {
    return {
        wrap: vi.fn(() => mockApi),
        expose: vi.fn(),

        // oxlint-disable-next-line typescript/no-explicit-any typescript/no-unsafe-return
        proxy: (x: any) => x,
    };
});

describe("Worker Client", () => {
    it.concurrent("should not call setLogReceiver on example worker creation", async () => {
        await getExampleWorker();
        expect(mockApi.setLogReceiver).not.toHaveBeenCalled();
    });

    it.concurrent("should create a worker instance", async () => {
        const worker = await getExampleWorker();
        expect(worker).toBeDefined();
        expect(worker.terminate).toBeDefined();
        expect(worker.greet).toBeDefined();
    });

    it.concurrent("should call worker methods", async () => {
        const worker = await getExampleWorker();
        const result = await worker.greet("World");
        expect(result).toBe("Hello, World!");
    });

    it.concurrent("should terminate worker", async () => {
        const worker = await getExampleWorker();
        // Just checking it doesn't throw
        worker.terminate();
    });
});
