import { describe, it, expect, vi } from "vitest";
// We can't easily test the actual worker thread in unit tests without a complex setup,
// so we'll test the logic by importing main.ts logic differently or mocking the Worker env.
// For now, let's unit test the logic if we separate it, or integration test via client.

// Since we can't spin up real workers in Vitest easily without a browser environment or special polyfills,
// we will verify the worker client logic and mocking.

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

// Mock Comlink
vi.mock("comlink", () => {
    return {
        wrap: vi.fn(() => ({
            greet: vi.fn(async (name: string) => `Hello, ${name}!`),
            fibonacci: vi.fn(async (n: number) => n),
        })),
        expose: vi.fn(),
    };
});

describe("Worker Client", () => {
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
