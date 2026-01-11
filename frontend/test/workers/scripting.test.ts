// @vitest-environment happy-dom

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
        api.setLogReceiver(mockReceiver);
    });

    describe("execute", () => {
        it("should execute simple code", async () => {
            const code = "1 + 1";
            const response = await api.execute(code);
            expect(response.result).toBe(2);
        });

        it("should capture console.log output", async () => {
            const code = 'console.log("hello"); console.log(123); return "done";';
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
            const charId = "persistent-char";
            await api.execute('storage.setItem("test", "value")', { characterId: charId });
            const response = await api.execute('storage.getItem("test")', { characterId: charId });
            expect(response.result).toBe("value");
        });

        it("should isolate storage between different characters", async () => {
            const charA = "char-A";
            const charB = "char-B";

            // Set value for Char A
            await api.execute('storage.setItem("secret", "A-secret")', { characterId: charA });

            // Verify Char A can read it
            const responseA = await api.execute('storage.getItem("secret")', {
                characterId: charA,
            });
            expect(responseA.result).toBe("A-secret");

            // Verify Char B cannot read it
            const responseB = await api.execute('storage.getItem("secret")', {
                characterId: charB,
            });
            // Should be null, but define-function/serialization might return undefined for null
            expect(responseB.result ?? null).toBeNull();

            // Set different value for Char B
            await api.execute('storage.setItem("secret", "B-secret")', { characterId: charB });

            // Verify Char A still sees original value
            const responseA2 = await api.execute('storage.getItem("secret")', {
                characterId: charA,
            });
            expect(responseA2.result).toBe("A-secret");
        });
    });
});
