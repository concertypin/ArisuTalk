/**
 * @fileoverview Tests for the version info store.
 * NOTE: import.meta.env is a Vite compile-time constant and cannot be
 * dynamically stubbed. These tests verify the store's structure and
 * that it returns properly shaped data at runtime.
 */

import { describe, it, expect } from "vitest";
import { versionInfo } from "@/lib/stores/versionInfo.svelte";

describe("versionInfo", () => {
    it("should have the expected shape", () => {
        expect(versionInfo.value).toHaveProperty("version");
        expect(versionInfo.value).toHaveProperty("channel");
        expect(versionInfo.value).toHaveProperty("commit");
        expect(versionInfo.value).toHaveProperty("url");
    });

    it("should have a displayLabel containing the app name", () => {
        expect(versionInfo.displayLabel).toContain("ArisuTalk");
    });

    it("should have string-typed fields", () => {
        expect(typeof versionInfo.value.version).toBe("string");
        expect(typeof versionInfo.value.channel).toBe("string");
        expect(typeof versionInfo.value.commit).toBe("string");
        expect(typeof versionInfo.value.url).toBe("string");
    });
});
