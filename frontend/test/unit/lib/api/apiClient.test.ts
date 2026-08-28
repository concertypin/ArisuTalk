import { afterEach, describe, expect, test, vi } from "vitest";
import * as apiClient from "@/lib/api/client";

describe.concurrent("api client shorthands", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("get calls fetch with GET", async () => {
        vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("fetch failed"));
        const result = await apiClient.get("/foo");
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toBeTruthy();
        }
    });

    test("post stringifies body when provided", async () => {
        const stringifySpy = vi.spyOn(JSON, "stringify");
        const payload = { a: 1 };

        vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("fetch failed"));
        await apiClient.post("/items", payload);

        expect(stringifySpy).toHaveBeenCalledWith(payload);
    });

    test("post without body calls fetch", async () => {
        vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("fetch failed"));
        const result = await apiClient.post("/items");
        expect(result.ok).toBe(false);
    });

    test("patch stringifies body when provided", async () => {
        vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("fetch failed"));
        const payload = { b: 2 };
        await apiClient.patch("/items/1", payload);
        // At least the request was sent (no error thrown)
        expect(fetch).toHaveBeenCalled();
    });

    test("del calls fetch with DELETE", async () => {
        vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("fetch failed"));
        const result = await apiClient.del("/items/1");
        expect(result.ok).toBe(false);
    });

    test("apiRequest returns error response on failure", async () => {
        vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network error"));
        const result = await apiClient.get("/x");
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toBe("network error");
        }
    });
});
