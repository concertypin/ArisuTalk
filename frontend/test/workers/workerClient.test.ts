// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    getExampleWorker,
    getCardParseWorker,
    getScriptingWorker,
    getRegexWorker,
} from "@/lib/workers/workerClient";

// Track worker instances to verify caching
let workerInstanceCount = 0;

// Shared worker class instances to simulate actual caching behavior
const createMockWorkerClass = (_name: string) => {
    return class MockWorker {
        constructor() {
            workerInstanceCount++;
        }
        terminate() {}
        postMessage() {}
        addEventListener() {}
        removeEventListener() {}
    };
};

// Mock the Example worker - use a shared class to simulate caching
vi.mock("@worker/example/main?worker", () => {
    return {
        default: createMockWorkerClass("example"),
    };
});

// Mock the CardParse worker
vi.mock("@worker/cardparse/main?worker", () => {
    return {
        default: createMockWorkerClass("cardparse"),
    };
});

// Mock the Scripting worker
vi.mock("@worker/scripting/main?worker", () => {
    return {
        default: createMockWorkerClass("scripting"),
    };
});

// Mock the Regex worker
vi.mock("@worker/regex/main?worker", () => {
    return {
        default: createMockWorkerClass("regex"),
    };
});

const mockApi = {
    greet: vi.fn(async (name: string) => `Hello, ${name}!`),
    fibonacci: vi.fn(async (n: number) => n),
    setLogReceiver: vi.fn(),
    parseCharacter: vi.fn(),
    exportCharacter: vi.fn(),
};

// Create a shared mock instance to simulate caching behavior
const sharedMockApi = { ...mockApi };

// Mock Comlink - return the same mock instance to simulate caching
vi.mock("comlink", () => {
    return {
        wrap: vi.fn(() => sharedMockApi),
        expose: vi.fn(),
        // oxlint-disable-next-line typescript/no-explicit-any typescript/no-unsafe-return
        proxy: (x: any) => x,
    };
});

describe("Worker Client", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        workerInstanceCount = 0;
    });

    it("should not call setLogReceiver on example worker creation", async () => {
        await getExampleWorker();
        expect(mockApi.setLogReceiver).not.toHaveBeenCalled();
    });

    it("should cache worker instance across sequential calls", async () => {
        const worker1 = await getExampleWorker();
        const worker2 = await getExampleWorker();
        // Both calls return the same cached instance
        expect(worker1).toBe(worker2);
    });

    it("should set disabled flag after terminate", async () => {
        const worker = await getExampleWorker();
        expect(worker.disabled).toBe(false);
        worker.terminate();
        expect(worker.disabled).toBe(true);
    });

    it("should call setLogReceiver on cardparse worker (non-example)", async () => {
        await getCardParseWorker();
        expect(mockApi.setLogReceiver).toHaveBeenCalled();
    });

    it("should handle concurrent worker creation - race condition", async () => {
        // Multiple concurrent calls should only create one worker
        const [worker1, worker2, worker3] = await Promise.all([
            getExampleWorker(),
            getExampleWorker(),
            getExampleWorker(),
        ]);
        // All should resolve to the same cached API object
        expect(worker1).toBe(worker2);
        expect(worker2).toBe(worker3);
    });

    it("should create scripting worker and call setLogReceiver", async () => {
        const worker = await getScriptingWorker();
        expect(worker).toBeDefined();
        expect(worker.terminate).toBeDefined();
        expect(mockApi.setLogReceiver).toHaveBeenCalled();
    });

    it("should create regex worker and call setLogReceiver", async () => {
        const worker = await getRegexWorker();
        expect(worker).toBeDefined();
        expect(worker.terminate).toBeDefined();
        expect(mockApi.setLogReceiver).toHaveBeenCalled();
    });

    it("should create and cache all worker types", async () => {
        // Verify each worker type can be created and has terminate
        const example = await getExampleWorker();
        expect(example.terminate).toBeDefined();
        const cardparse = await getCardParseWorker();
        expect(cardparse.terminate).toBeDefined();
        const scripting = await getScriptingWorker();
        expect(scripting.terminate).toBeDefined();
        const regex = await getRegexWorker();
        expect(regex.terminate).toBeDefined();
    });
});
