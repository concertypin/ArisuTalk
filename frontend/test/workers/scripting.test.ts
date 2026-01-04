import { describe, it, expect, vi } from "vitest";

// Mock Comlink before importing main.ts
vi.mock("comlink", () => ({
    expose: vi.fn(),
}));

import { api } from "@worker/scripting/main";

describe("Scripting Worker Logic", () => {
    it("should support setLogReceiver", async () => {
        expect(api.setLogReceiver).toBeDefined();
        const mockReceiver = {
            receiveLog: vi.fn(),
            receiveStructuredLog: vi.fn(),
        };
        // @ts-ignore
        await api.setLogReceiver(mockReceiver);
    });

    describe("execute", () => {
        it("should execute simple code", async () => {
            const code = "1 + 1";
            const response = await api.execute(code);
            expect(response.result).toBe(2);
        });

        it("should capture console.log output", async () => {
            const code = 'console.log("hello"); console.log(123); "done"';
            const response = await api.execute(code);
            expect(response.result).toBe("done");
            expect(response.logs).toEqual(["hello", "123"]);
        });

        it("should execute Hello World script", async () => {
            const code = '"Hello World"';
            const response = await api.execute(code);
            expect(response.result).toBe("Hello World");
        });

        it("should use storage API to persist values across calls", async () => {
            await api.execute('storage.setItem("test", "value")');
            const response = await api.execute('storage.getItem("test")');
            expect(response.result).toBe("value");
        });
    });
});
