import { describe, it, expect } from "vitest";
import { apiRequest, get, post, patch, del } from "@/lib/api/client";

describe("api/client", () => {
    // Currently apiRequest throws "Not implemented".
    // We should test that behavior for now.

    it("apiRequest throws Not implemented", async () => {
        await expect(apiRequest("/test")).rejects.toThrow("Not implemented");
    });

    it("get calls apiRequest", async () => {
        await expect(get("/test")).rejects.toThrow("Not implemented");
    });

    it("post calls apiRequest", async () => {
        await expect(post("/test", {})).rejects.toThrow("Not implemented");
    });

    it("patch calls apiRequest", async () => {
        await expect(patch("/test", {})).rejects.toThrow("Not implemented");
    });

    it("del calls apiRequest", async () => {
        await expect(del("/test")).rejects.toThrow("Not implemented");
    });
});
