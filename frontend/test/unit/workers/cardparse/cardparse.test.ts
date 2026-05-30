// @vitest-environment happy-dom

import { describe, it, expect, vi } from "vitest";
import { parseCharacter } from "@worker/cardparse/parse";
import { exportCharacter } from "@worker/cardparse/encode";
import { iterableToStream, readAll, setLogger } from "@worker/cardparse/shared";
import { decode } from "cbor-x";
import { CharacterSchema } from "@arisutalk/character-spec/v0/Character";

// Mock Comlink's transfer to return the value directly (no actual transfer in tests)
vi.mock("comlink", async (importOriginal) => {
    const actual = await importOriginal<typeof import("comlink")>();
    return {
        ...actual,
        transfer: (value: unknown) => value,
    };
});

// Minimal valid character matching CharacterSchema
// Note: tokenLimit must be >= 1 (positiveInteger in schema), timeout must be >= 1
function createTestCharacter(overrides: Record<string, unknown> = {}) {
    return {
        specVersion: 0,
        id: crypto.randomUUID(),
        name: "Test Character",
        description: "A test character for cardparse tests",
        avatarUrl: "",
        assets: { assets: [] },
        prompt: {
            description: "",
            authorsNote: "",
            lorebook: { config: { tokenLimit: 1 }, data: [] },
        },
        executables: {
            runtimeSetting: { mem: undefined, timeout: 3 },
            replaceHooks: { display: [], input: [], output: [], request: [] },
        },
        metadata: {
            author: undefined,
            license: "ARR",
            version: undefined,
            distributedOn: undefined,
            additionalInfo: undefined,
        },
        ...overrides,
    };
}

describe("CardParse Worker — parseCharacter", () => {
    it("should parse a valid exported character", async () => {
        const original = createTestCharacter({
            name: "Round Trip",
            description: "Testing encode → parse round trip",
        });

        const exported = await exportCharacter(original);
        expect(exported).toBeInstanceOf(ArrayBuffer);
        expect(exported.byteLength).toBeGreaterThan(0);

        const result = await parseCharacter(exported);
        if (!result.success) {
            console.log("Parse failed:", JSON.stringify(result));
        }
        expect(result.success).toBe(true);

        if (result.success) {
            expect(result.data.name).toBe("Round Trip");
            expect(result.data.description).toBe("Testing encode → parse round trip");
            expect(result.data.id).toBe(original.id);
            expect(result.data.specVersion).toBe(0);
        }
    });

    it("should preserve assets through round trip", async () => {
        const assetData = new Uint8Array([1, 2, 3, 4, 5]);
        const original = createTestCharacter({
            name: "Asset Test",
            assets: {
                assets: [
                    {
                        id: "asset-1",
                        name: "test.bin",
                        mimeType: "application/octet-stream",
                        data: assetData,
                    },
                ],
            },
        });

        const exported = await exportCharacter(original);
        const result = await parseCharacter(exported);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.assets.assets).toHaveLength(1);
            expect(result.data.assets.assets[0].id).toBe("asset-1");
            expect(result.data.assets.assets[0].name).toBe("test.bin");
        }
    });

    it("should handle empty character with minimal fields", async () => {
        const minimal = createTestCharacter({
            name: "Minimal",
            description: "",
            avatarUrl: "",
        });

        const exported = await exportCharacter(minimal);
        const result = await parseCharacter(exported);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.name).toBe("Minimal");
            expect(result.data.description).toBe("");
        }
    });

    it("should throw on empty ArrayBuffer (decompression failure)", async () => {
        const empty = new ArrayBuffer(0);
        await expect(parseCharacter(empty)).rejects.toThrow();
    });

    it("should throw on random garbage data (decompression failure)", async () => {
        const garbage = new Uint8Array([0xff, 0x00, 0xab, 0xcd, 0x12, 0x34]);
        await expect(parseCharacter(garbage.buffer)).rejects.toThrow();
    });

    it("should throw on uncompressed CBOR data (missing deflate)", async () => {
        // Valid CBOR but not compressed — DecompressionStream will fail
        const { encode } = await import("cbor-x");
        const cborData = encode(createTestCharacter({ name: "Uncompressed" }));
        await expect(parseCharacter(cborData.buffer)).rejects.toThrow();
    });

    it("should handle character with long description", async () => {
        const longDesc = "A".repeat(50000);
        const original = createTestCharacter({
            name: "Long Desc",
            description: longDesc,
        });

        const exported = await exportCharacter(original);
        const result = await parseCharacter(exported);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.description).toBe(longDesc);
        }
    });

    it("should return failure for valid compressed CBOR that fails schema validation", async () => {
        // Create valid deflate-compressed CBOR with data that doesn't match CharacterSchema
        const { encode } = await import("cbor-x");
        const invalidData = encode({ notACharacter: true, id: 12345 });
        const compressed = new Blob([invalidData])
            .stream()
            .pipeThrough(new CompressionStream("deflate-raw"));
        const reader = compressed.getReader();
        const chunks: Uint8Array[] = [];
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }
        const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
        const result = new Uint8Array(totalLen);
        let offset = 0;
        for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }

        const parseResult = await parseCharacter(result.buffer);
        expect(parseResult.success).toBe(false);
        if (!parseResult.success && "error" in parseResult) {
            expect(parseResult.error).toBe("Failed to parse character");
        }
    });

    it("should preserve metadata through round trip", async () => {
        const original = createTestCharacter({
            name: "Metadata Test",
            metadata: {
                author: "Test Author",
                license: "CC BY 4.0",
                version: "1.2.3",
                distributedOn: "https://example.com",
                additionalInfo: "Some extra info",
            },
        });

        const exported = await exportCharacter(original);
        const result = await parseCharacter(exported);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.metadata.author).toBe("Test Author");
            expect(result.data.metadata.license).toBe("CC BY 4.0");
            expect(result.data.metadata.version).toBe("1.2.3");
        }
    });
});

describe("CardParse Worker — shared utilities", () => {
    describe("iterableToStream", () => {
        it("should convert Uint8Array iterable to ReadableStream", async () => {
            const chunks = [
                new Uint8Array([1, 2, 3]),
                new Uint8Array([4, 5, 6]),
                new Uint8Array([7, 8, 9]),
            ];
            const stream = iterableToStream(chunks);
            const result = await readAll(stream);
            expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));
        });

        it("should convert Blob iterable to ReadableStream", async () => {
            const blob = new Blob([new Uint8Array([10, 20, 30])]);
            const stream = iterableToStream([blob]);
            const result = await readAll(stream);
            expect(result).toEqual(new Uint8Array([10, 20, 30]));
        });

        it("should handle empty iterable", async () => {
            const stream = iterableToStream([]);
            const result = await readAll(stream);
            expect(result).toEqual(new Uint8Array([]));
        });

        it("should handle single empty Uint8Array", async () => {
            const stream = iterableToStream([new Uint8Array([])]);
            const result = await readAll(stream);
            expect(result).toEqual(new Uint8Array([]));
        });
    });

    describe("readAll", () => {
        it("should read entire stream into single Uint8Array", async () => {
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new Uint8Array([1, 2]));
                    controller.enqueue(new Uint8Array([3, 4]));
                    controller.enqueue(new Uint8Array([5]));
                    controller.close();
                },
            });
            const result = await readAll(stream);
            expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
        });

        it("should handle empty stream", async () => {
            const stream = new ReadableStream({
                start(controller) {
                    controller.close();
                },
            });
            const result = await readAll(stream);
            expect(result).toEqual(new Uint8Array([]));
        });
    });

    describe("setLogger", () => {
        it("should set and return the logger", () => {
            const mockLogger = { debug: vi.fn(), info: vi.fn(), error: vi.fn() } as any;
            const result = setLogger(mockLogger);
            expect(result).toBe(mockLogger);
        });
    });
});
