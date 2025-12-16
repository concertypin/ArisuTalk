import { describe, it, expect, vi } from "vitest";

// Mock Comlink before importing main.ts to avoid side effects of expose()
vi.mock("comlink", () => ({
    expose: vi.fn(),
}));

import { api } from "@worker/example/main";

// Since we exported the API object from main.ts, we can test the logic directly
// bypassing Comlink and the Worker environment.

describe("Example Worker Logic", () => {
    describe("greet", () => {
        it.concurrent("should return a greeting message", async () => {
            const result = await api.greet("TestUser");
            expect(result).toBe("Hello, TestUser! This message is from a Web Worker.");
        });
    });

    describe("fibonacci", () => {
        it.concurrent("should calculate fibonacci for small numbers", async () => {
            expect(await api.fibonacci(0)).toBe(0);
            expect(await api.fibonacci(1)).toBe(1);
            expect(await api.fibonacci(2)).toBe(1);
            expect(await api.fibonacci(3)).toBe(2);
            expect(await api.fibonacci(4)).toBe(3);
            expect(await api.fibonacci(5)).toBe(5);
        });

        it.concurrent("should handle negative calculations (base case)", async () => {
            // Our implementation returns n for n <= 1
            expect(await api.fibonacci(-1)).toBe(-1);
        });
    });
});
