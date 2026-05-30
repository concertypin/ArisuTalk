// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, type Mocked } from "vitest";
import { OpFSAssetStorageAdapter } from "@/features/character/adapters/assetStorage/OpFSAssetStorageAdapter";
import { IfNotExistBehavior } from "@/lib/interfaces";
import { strictMock } from "@test/utils/strictObject";

describe("OpFSAssetStorageAdapter", () => {
    let adapter: OpFSAssetStorageAdapter;
    let mockRoot: Mocked<FileSystemDirectoryHandle>;

    beforeEach(() => {
        // Mock FileSystem API
        mockRoot = strictMock<FileSystemDirectoryHandle>({
            getDirectoryHandle: vi.fn(),
            getFileHandle: vi.fn(),
            removeEntry: vi.fn(),
        });
        const storage = {
            getDirectory: vi.fn().mockResolvedValue(mockRoot),
        };
        // Stub navigator.storage.getDirectory
        vi.stubGlobal("navigator", {
            storage,
        });

        adapter = new OpFSAssetStorageAdapter();
    });

    it("should initialize root directory", async () => {
        await adapter.init();
        expect(navigator.storage.getDirectory).toHaveBeenCalled();
    });

    it("should handle initialization errors gracefully", async () => {
        vi.mocked(navigator.storage.getDirectory).mockRejectedValue(
            new Error("OPFS not supported")
        );
        await expect(adapter.init()).rejects.toThrow("OPFS not supported");
    });

    it("should get asset blob correctly", async () => {
        const mockFile = new Blob(["test data"], { type: "text/plain" });
        const mockFileHandle = strictMock<FileSystemFileHandle>({
            getFile: vi.fn().mockResolvedValue(mockFile),
        });
        vi.mocked(mockRoot.getFileHandle).mockResolvedValue(mockFileHandle);

        const testUrl = new URL("local://opfs/test.txt");
        const blob = await adapter.getAssetBlob(testUrl);

        expect(mockRoot.getFileHandle).toHaveBeenCalledWith("test.txt", { create: false });
        expect(blob).toBe(mockFile);
    });

    it("should save asset correctly", async () => {
        const mockWritable = {
            write: vi.fn().mockResolvedValue(undefined),
            close: vi.fn().mockResolvedValue(undefined),
        };
        const mockFileHandle = strictMock<FileSystemFileHandle>({
            createWritable: vi.fn().mockResolvedValue(mockWritable),
        });
        // First call with { create: false } should throw NotFoundError (file doesn't exist)
        // Second call with { create: true } should return the file handle

        vi.mocked(mockRoot)
            .getFileHandle.mockRejectedValueOnce(new DOMException("Not found", "NotFoundError"))
            .mockResolvedValueOnce(mockFileHandle);

        const testFile = new File(["data"], "hello.txt", { type: "text/plain" });
        const resultUrl = await adapter.saveAsset("hello.txt", testFile);

        expect(mockRoot.getFileHandle).toHaveBeenCalledWith("hello.txt", { create: false });
        expect(mockRoot.getFileHandle).toHaveBeenCalledWith("hello.txt", { create: true });
        expect(mockWritable.write).toHaveBeenCalledWith(testFile);
        expect(resultUrl.toString()).toBe("local://opfs/hello.txt");
    });

    it("should get asset URL correctly", async () => {
        const mockFile = new Blob(["data"]);
        const mockFileHandle = strictMock<FileSystemFileHandle>({
            getFile: vi.fn().mockResolvedValue(mockFile),
        });
        mockRoot.getFileHandle.mockResolvedValue(mockFileHandle);

        // Mock only createObjectURL, not the entire URL constructor
        const createObjectURLSpy = vi
            .spyOn(URL, "createObjectURL")
            .mockReturnValue("blob:http://localhost/123");

        const testUrl = new URL("local://opfs/test.png");
        const result = await adapter.getAssetUrl(testUrl);

        expect(result).toBe("blob:http://localhost/123");
        createObjectURLSpy.mockRestore();
    });

    it("should handle missing asset in getAssetBlob", async () => {
        mockRoot.getFileHandle.mockRejectedValue(new DOMException("Not found", "NotFoundError"));

        const testUrl = new URL("local://opfs/missing.txt");

        // Test with THROW_ERROR (default)
        await expect(adapter.getAssetBlob(testUrl)).rejects.toThrow();

        // Test with RETURN_NULL
        const result = await adapter.getAssetBlob(testUrl, IfNotExistBehavior.RETURN_NULL);
        expect(result).toBeNull();
    });

    it("should throw on invalid ID", async () => {
        const invalidUrl = new URL("http://example.com");
        await expect(adapter.getAssetBlob(invalidUrl)).rejects.toThrow("Invalid ID");
    });

    it("should delete an asset", async () => {
        const testUrl = new URL("local://opfs/existing.txt");
        mockRoot.removeEntry.mockResolvedValue(undefined);

        await expect(adapter.deleteAsset(testUrl)).resolves.toBeUndefined();
        expect(mockRoot.removeEntry).toHaveBeenCalledWith("existing.txt");
    });

    it("should throw on delete with invalid ID", async () => {
        const invalidUrl = new URL("http://example.com");
        await expect(adapter.deleteAsset(invalidUrl)).rejects.toThrow("Invalid ID");
    });

    it("should save asset with overwrite flag", async () => {
        const mockFileHandle = strictMock<FileSystemFileHandle>({
            createWritable: vi.fn().mockResolvedValue({
                write: vi.fn().mockResolvedValue(undefined),
                close: vi.fn().mockResolvedValue(undefined),
            }),
        });

        // First call: check if exists - it exists (no error)
        mockRoot.getFileHandle.mockResolvedValueOnce(mockFileHandle);
        // Second call: get handle with create
        mockRoot.getFileHandle.mockResolvedValueOnce(mockFileHandle);

        const testFile = new File(["overwritten"], "test.txt");
        const overwrite = true;
        const url = await adapter.saveAsset("test.txt", testFile, overwrite);
        expect(url.toString()).toContain("local://opfs/");
    });

    it("should throw when saving asset that already exists without overwrite", async () => {
        const mockFileHandle = strictMock<FileSystemFileHandle>({
            getFile: vi.fn(),
        });
        // First call: check if exists - it does (no NotFoundError)
        mockRoot.getFileHandle.mockResolvedValueOnce(mockFileHandle);

        const testFile = new File(["data"], "test.txt");
        await expect(adapter.saveAsset("test.txt", testFile, false)).rejects.toThrow(
            "File already exists"
        );
    });

    it("should return null from getAssetUrl when asset not found and RETURN_NULL", async () => {
        const testUrl = new URL("local://opfs/missing.txt");
        vi.mocked(mockRoot.getFileHandle).mockRejectedValue(new Error("not found"));

        const result = await adapter.getAssetUrl(testUrl, IfNotExistBehavior.RETURN_NULL);
        expect(result).toBeNull();
    });

    it("should throw from getAssetUrl when asset not found and default behavior", async () => {
        const testUrl = new URL("local://opfs/missing.txt");
        vi.mocked(mockRoot.getFileHandle).mockRejectedValue(new Error("not found"));

        // getAssetBlob re-throws the underlying error, which propagates through getAssetUrl
        await expect(adapter.getAssetUrl(testUrl)).rejects.toThrow("not found");
    });
});
