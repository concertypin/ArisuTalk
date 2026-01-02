import { describe, it, expect, vi } from "vitest";

// Mock Comlink before importing main.ts
vi.mock("comlink", () => ({
    expose: vi.fn(),
}));

import { api } from "@worker/scripting/main";

describe("Scripting Worker Logic", () => {
    describe("execute", () => {
        it.concurrent("should execute simple code", async () => {
            const code = "1 + 1";
            const response = await api.execute(code);
            expect(response.result).toBe(2);
        });

        it.concurrent("should capture console.log output", async () => {
            const code = 'console.log("hello"); console.log(123); "done"';
            const response = await api.execute(code);
            expect(response.result).toBe("done");
            expect(response.logs).toEqual(["hello", "123"]);
        });

        it.concurrent("should execute Hello World script", async () => {
            const code = '"Hello World"';
            const response = await api.execute(code);
            expect(response.result).toBe("Hello World");
        });
    });
});
