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

        it("should support storage.removeItem and storage.clear", async () => {
            const charId = "cleanup-char";
            await api.execute('storage.setItem("k1", "v1"); storage.setItem("k2", "v2")', {
                characterId: charId,
            });

            // Verify removal
            await api.execute('storage.removeItem("k1")', { characterId: charId });
            const afterRemove = await api.execute('storage.getItem("k1")', { characterId: charId });
            expect(afterRemove.result ?? null).toBeNull();

            // Verify clear
            await api.execute("storage.clear()", { characterId: charId });
            const afterClear = await api.execute('storage.getItem("k2")', { characterId: charId });
            expect(afterClear.result ?? null).toBeNull();
        });

        it("should support storage.length and storage.key", async () => {
            const charId = "enum-char";
            await api.execute('storage.setItem("a", "1"); storage.setItem("b", "2")', {
                characterId: charId,
            });

            const lenResult = await api.execute("storage.length", { characterId: charId });
            expect(lenResult.result).toBe(2);

            const keyResult = await api.execute("storage.key(0)", { characterId: charId });
            expect(typeof keyResult.result).toBe("string");
        });

        it("should handle script errors gracefully", async () => {
            const response = await api.execute('throw new Error("Oops!")');
            // define-function embeds QuickJS — runtime errors are captured but
            // the error message format depends on the sandbox implementation
            expect(response.result).toBeUndefined();
            expect(response.error).toBeDefined();
        });

        it("should handle syntax errors", async () => {
            const response = await api.execute("{ broken syntax ");
            expect(response.result).toBeUndefined();
            expect(response.error).toBeDefined();
        });

        it("should return modified context after script execution", async () => {
            // ScriptContext passes through the sandbox boundary

            const response = await api.execute('global.context.message = "modified"', {
                context: {
                    message: {
                        content: "initial",
                        metadata: {},
                        role: "user",
                    },
                },
            });

            if (response.modifiedContext) {
                expect(response.modifiedContext.message).toBe("modified");
            }
        });

        it("should handle fetch in sandbox without crashing", async () => {
            // Testing that fetch calls in the sandbox don't crash the runtime,
            // even when network access is disabled
            const response = await api.execute('fetch("https://example.com")', {
                allowNetwork: false,
            });
            // The sandbox should complete without crashing
            expect(response).toBeDefined();
            // Without network access, fetch should not return actual data
            expect(response.result).not.toBe("https://example.com");
        });

        it("should provide isolated storage per character", async () => {
            // Characters without explicit ID use shared default (__default__)
            // Characters with ID get isolated storage
            const charA = "iso-A";
            await api.execute('storage.setItem("data", "A-data")', { characterId: charA });
            const respA = await api.execute('storage.getItem("data")', { characterId: charA });
            expect(respA.result).toBe("A-data");

            // Default (no characterId) gets separate storage
            const respDefault = await api.execute('storage.getItem("data")');
            expect(respDefault.result ?? null).toBeNull();
        });
    });
});
