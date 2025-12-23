import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import {
    remapAssetToUint8Array,
    blobToUint8Array,
    collectTransferableBuffers,
} from "@/features/character/utils/assetEncoding";
import type { AssetEntity } from "@arisutalk/character-spec/v0/Character/Assets";
import type { IAssetStorageAdapter } from "@/lib/interfaces";

describe("blobToUint8Array", () => {
    it("should convert a Blob to Uint8Array", async () => {
        const testData = new Uint8Array([1, 2, 3, 4, 5]);
        const blob = new Blob([testData]);

        const result = await blobToUint8Array(blob);

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toEqual(testData);
    });

    it("should handle empty Blob", async () => {
        const blob = new Blob([]);
        const result = await blobToUint8Array(blob);

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBe(0);
    });

    it("should handle large Blob (1MB)", async () => {
        const largeData = new Uint8Array(1024 * 1024); // 1MB
        for (let i = 0; i < largeData.length; i++) {
            largeData[i] = i % 256;
        }
        const blob = new Blob([largeData]);

        const result = await blobToUint8Array(blob);

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBe(1024 * 1024);
        expect(result[0]).toBe(0);
        expect(result[1000]).toBe(1000 % 256);
    });
});

describe("remapAssetToUint8Array", () => {
    let mockAssetStorage: IAssetStorageAdapter;

    beforeEach(() => {
        mockAssetStorage = {
            init: vi.fn().mockResolvedValue(undefined),
            getAssetBlob: vi.fn(),
            getAssetUrl: vi.fn(),
            saveAsset: vi.fn(),
        };
    });

    describe("Uint8Array handling", () => {
        it("should leave Uint8Array data unchanged", async () => {
            const asset: AssetEntity = {
                name: "test.bin",
                mimeType: "application/octet-stream",
                data: new Uint8Array([1, 2, 3]),
            };

            const result = await remapAssetToUint8Array(asset, mockAssetStorage);

            expect(result).toEqual(asset);
            expect(result.data).toBeInstanceOf(Uint8Array);
            expect(mockAssetStorage.init).not.toHaveBeenCalled();
        });

        it("should handle empty Uint8Array", async () => {
            const asset: AssetEntity = {
                name: "empty.bin",
                mimeType: "application/octet-stream",
                data: new Uint8Array([]),
            };

            const result = await remapAssetToUint8Array(asset, mockAssetStorage);

            expect(result.data).toBeInstanceOf(Uint8Array);
            expect((result.data as Uint8Array).length).toBe(0);
        });

        it("should handle large Uint8Array (1MB)", async () => {
            const largeData = new Uint8Array(1024 * 1024);
            const asset: AssetEntity = {
                name: "large.bin",
                mimeType: "application/octet-stream",
                data: largeData,
            };

            const result = await remapAssetToUint8Array(asset, mockAssetStorage);

            expect(result.data).toBe(largeData);
        });
    });

    describe("Remote URL handling", () => {
        it("should leave http:// URLs unchanged", async () => {
            const asset: AssetEntity = {
                name: "remote.png",
                mimeType: "image/png",
                data: "http://example.com/image.png",
            };

            const result = await remapAssetToUint8Array(asset, mockAssetStorage);

            expect(result).toEqual(asset);
            expect(result.data).toBe("http://example.com/image.png");
            expect(mockAssetStorage.init).not.toHaveBeenCalled();
        });

        it("should leave https:// URLs unchanged", async () => {
            const asset: AssetEntity = {
                name: "secure.png",
                mimeType: "image/png",
                data: "https://example.com/image.png",
            };

            const result = await remapAssetToUint8Array(asset, mockAssetStorage);

            expect(result).toEqual(asset);
            expect(result.data).toBe("https://example.com/image.png");
        });

        it("should handle URLs with query parameters", async () => {
            const asset: AssetEntity = {
                name: "query.png",
                mimeType: "image/png",
                data: "https://example.com/image.png?size=large&format=webp",
            };

            const result = await remapAssetToUint8Array(asset, mockAssetStorage);

            expect(result.data).toBe("https://example.com/image.png?size=large&format=webp");
        });
    });

    describe("Local file handling", () => {
        it("should convert local: URL to Uint8Array", async () => {
            const testData = new Uint8Array([10, 20, 30]);
            const blob = new Blob([testData]);
            (mockAssetStorage.getAssetBlob as Mock).mockResolvedValue(blob);

            const asset: AssetEntity = {
                name: "local.png",
                mimeType: "image/png",
                data: "local://asset-id-123",
            };

            const result = await remapAssetToUint8Array(asset, mockAssetStorage);

            expect(mockAssetStorage.init).toHaveBeenCalled();
            expect(mockAssetStorage.getAssetBlob).toHaveBeenCalledWith(
                new URL("local://asset-id-123")
            );
            expect(result.data).toBeInstanceOf(Uint8Array);
            expect(result.data).toEqual(testData);
        });

        it("should throw error when local file fetch fails", async () => {
            (mockAssetStorage.getAssetBlob as Mock).mockRejectedValue(new Error("File not found"));

            const asset: AssetEntity = {
                name: "missing.png",
                mimeType: "image/png",
                data: "local://missing-id",
            };

            await expect(remapAssetToUint8Array(asset, mockAssetStorage)).rejects.toThrow(
                "File not found"
            );
        });

        it("should handle non-Error rejection from storage", async () => {
            (mockAssetStorage.getAssetBlob as Mock).mockRejectedValue("String error");

            const asset: AssetEntity = {
                name: "error.png",
                mimeType: "image/png",
                data: "local://error-id",
            };

            await expect(remapAssetToUint8Array(asset, mockAssetStorage)).rejects.toThrow(
                "String error"
            );
        });
    });

    describe("Data URL handling", () => {
        it("should convert valid base64 data URL to Uint8Array", async () => {
            // "Hello" in base64
            const asset: AssetEntity = {
                name: "text.txt",
                mimeType: "text/plain",
                data: "data:text/plain;base64,SGVsbG8=",
            };

            const result = await remapAssetToUint8Array(asset, mockAssetStorage);

            expect(result.data).toBeInstanceOf(Uint8Array);
            const decoded = new TextDecoder().decode(result.data as Uint8Array);
            expect(decoded).toBe("Hello");
        });

        it("should handle PNG image data URL", async () => {
            // 1x1 transparent PNG
            const pngBase64 =
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
            const asset: AssetEntity = {
                name: "pixel.png",
                mimeType: "image/png",
                data: `data:image/png;base64,${pngBase64}`,
            };

            const result = await remapAssetToUint8Array(asset, mockAssetStorage);

            expect(result.data).toBeInstanceOf(Uint8Array);
            expect((result.data as Uint8Array).length).toBeGreaterThan(0);
        });

        it("should handle data URL with charset parameter", async () => {
            const asset: AssetEntity = {
                name: "utf8.txt",
                mimeType: "text/plain",
                data: "data:text/plain;charset=utf-8;base64,SGVsbG8gV29ybGQ=",
            };

            const result = await remapAssetToUint8Array(asset, mockAssetStorage);

            expect(result.data).toBeInstanceOf(Uint8Array);
            const decoded = new TextDecoder().decode(result.data as Uint8Array);
            expect(decoded).toBe("Hello World");
        });

        it("should warn and leave malformed data URL (no comma) as is", async () => {
            const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

            const asset: AssetEntity = {
                name: "malformed.txt",
                mimeType: "text/plain",
                data: "data:text/plain;base64SGVsbG8=", // Missing comma
            };

            const result = await remapAssetToUint8Array(asset, mockAssetStorage);

            expect(result.data).toBe("data:text/plain;base64SGVsbG8=");
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "Malformed data URL (no comma), leaving as is:",
                expect.any(String)
            );

            consoleWarnSpy.mockRestore();
        });

        it("should handle invalid base64 gracefully", async () => {
            const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

            const asset: AssetEntity = {
                name: "invalid.txt",
                mimeType: "text/plain",
                data: "data:text/plain;base64,!!!INVALID!!!",
            };

            const result = await remapAssetToUint8Array(asset, mockAssetStorage);

            expect(result.data).toBe("data:text/plain;base64,!!!INVALID!!!");
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "Failed to decode base64 data URL:",
                expect.any(Error)
            );

            consoleErrorSpy.mockRestore();
        });

        it("should handle empty base64 data", async () => {
            const asset: AssetEntity = {
                name: "empty.txt",
                mimeType: "text/plain",
                data: "data:text/plain;base64,",
            };

            const result = await remapAssetToUint8Array(asset, mockAssetStorage);

            expect(result.data).toBeInstanceOf(Uint8Array);
            expect((result.data as Uint8Array).length).toBe(0);
        });

        it("should handle different MIME types", async () => {
            const mimeTypes = [
                "image/jpeg",
                "image/webp",
                "video/mp4",
                "application/pdf",
                "audio/mpeg",
            ];

            for (const mimeType of mimeTypes) {
                const asset: AssetEntity = {
                    name: `file.${mimeType.split("/")[1]}`,
                    mimeType,
                    data: `data:${mimeType};base64,SGVsbG8=`,
                };

                const result = await remapAssetToUint8Array(asset, mockAssetStorage);

                expect(result.data).toBeInstanceOf(Uint8Array);
                expect(result.mimeType).toBe(mimeType);
            }
        });
    });

    describe("Edge cases", () => {
        it("should leave unknown format as is", async () => {
            const asset: AssetEntity = {
                name: "unknown.txt",
                mimeType: "text/plain",
                data: "file:///some/path",
            };

            const result = await remapAssetToUint8Array(asset, mockAssetStorage);

            expect(result).toEqual(asset);
            expect(result.data).toBe("file:///some/path");
        });

        it("should handle empty string data", async () => {
            const asset: AssetEntity = {
                name: "empty.txt",
                mimeType: "text/plain",
                data: "",
            };

            const result = await remapAssetToUint8Array(asset, mockAssetStorage);

            expect(result.data).toBe("");
        });

        it("should preserve asset metadata", async () => {
            const asset: AssetEntity = {
                name: "test.png",
                mimeType: "image/png",
                data: "https://example.com/test.png",
            };

            const result = await remapAssetToUint8Array(asset, mockAssetStorage);

            expect(result.name).toBe("test.png");
            expect(result.mimeType).toBe("image/png");
        });
    });
});

describe("collectTransferableBuffers", () => {
    it("should collect ArrayBuffers from Uint8Array assets", () => {
        const assets: AssetEntity[] = [
            {
                name: "binary1.bin",
                mimeType: "application/octet-stream",
                data: new Uint8Array([1, 2, 3]),
            },
            {
                name: "binary2.bin",
                mimeType: "application/octet-stream",
                data: new Uint8Array([4, 5, 6]),
            },
        ];

        const buffers = collectTransferableBuffers(assets);

        expect(buffers).toHaveLength(2);
        expect(buffers[0]).toBeInstanceOf(ArrayBuffer);
        expect(buffers[1]).toBeInstanceOf(ArrayBuffer);
    });

    it("should filter out non-Uint8Array assets", () => {
        const assets: AssetEntity[] = [
            {
                name: "binary.bin",
                mimeType: "application/octet-stream",
                data: new Uint8Array([1, 2, 3]),
            },
            {
                name: "url.png",
                mimeType: "image/png",
                data: "https://example.com/image.png",
            },
            {
                name: "data.txt",
                mimeType: "text/plain",
                data: "data:text/plain;base64,SGVsbG8=",
            },
        ];

        const buffers = collectTransferableBuffers(assets);

        expect(buffers).toHaveLength(1);
        expect(buffers[0]).toBeInstanceOf(ArrayBuffer);
    });

    it("should return empty array when no Uint8Array assets", () => {
        const assets: AssetEntity[] = [
            {
                name: "url.png",
                mimeType: "image/png",
                data: "https://example.com/image.png",
            },
        ];

        const buffers = collectTransferableBuffers(assets);

        expect(buffers).toHaveLength(0);
    });

    it("should handle empty asset array", () => {
        const buffers = collectTransferableBuffers([]);

        expect(buffers).toHaveLength(0);
    });

    it("should handle mixed asset types", () => {
        const assets: AssetEntity[] = [
            {
                name: "binary1.bin",
                mimeType: "application/octet-stream",
                data: new Uint8Array([1, 2, 3]),
            },
            {
                name: "http.png",
                mimeType: "image/png",
                data: "http://example.com/image.png",
            },
            {
                name: "binary2.bin",
                mimeType: "application/octet-stream",
                data: new Uint8Array([4, 5, 6]),
            },
            {
                name: "https.jpg",
                mimeType: "image/jpeg",
                data: "https://example.com/photo.jpg",
            },
            {
                name: "binary3.bin",
                mimeType: "application/octet-stream",
                data: new Uint8Array([7, 8, 9]),
            },
        ];

        const buffers = collectTransferableBuffers(assets);

        expect(buffers).toHaveLength(3);
        buffers.forEach((buffer) => {
            expect(buffer).toBeInstanceOf(ArrayBuffer);
        });
    });
});
