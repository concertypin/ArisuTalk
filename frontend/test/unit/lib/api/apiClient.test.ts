import { afterEach, describe, expect, test, vi } from "vitest";
import * as apiClient from "../../../../src/lib/api/client";

describe("api client shorthands", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("get calls apiRequest with GET", async () => {
        await expect(apiClient.get("/foo")).rejects.toThrow("Not implemented");
    });

    test("post stringifies body when provided", async () => {
        const stringifySpy = vi.spyOn(JSON, "stringify");
        const mockedStringify = vi.mocked(stringifySpy);
        const payload = { a: 1 };
        await expect(apiClient.post("/items", payload)).rejects.toThrow("Not implemented");
        expect(mockedStringify).toHaveBeenCalledWith(payload);
    });

    test("post without body sends undefined body", async () => {
        const stringifySpy = vi.spyOn(JSON, "stringify");
        const mockedStringify = vi.mocked(stringifySpy);
        await expect(apiClient.post("/items")).rejects.toThrow("Not implemented");
        expect(mockedStringify).not.toHaveBeenCalled();
    });

    test("patch stringifies body when provided", async () => {
        const stringifySpy = vi.spyOn(JSON, "stringify");
        const mockedStringify = vi.mocked(stringifySpy);
        const payload = { b: 2 };
        await expect(apiClient.patch("/items/1", payload)).rejects.toThrow("Not implemented");
        expect(mockedStringify).toHaveBeenCalledWith(payload);
    });

    test("del calls apiRequest with DELETE", async () => {
        await expect(apiClient.del("/items/1")).rejects.toThrow("Not implemented");
    });

    test("apiRequest default throws Not implemented", async () => {
        const actual = await vi.importActual<typeof import("../../../../src/lib/api/client")>(
            "../../../../src/lib/api/client"
        );
        await expect(actual.apiRequest("/x")).rejects.toThrow("Not implemented");
    });
});
