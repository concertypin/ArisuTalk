/**
 * @fileoverview Tests for the version info store.
 * NOTE: import.meta.env is a Vite compile-time constant and cannot be
 * dynamically stubbed. These tests verify the store's structure and
 * that it returns properly shaped data at runtime.
 */

import { describe, it, expect } from "vitest";
import { versionInfo } from "@/lib/stores/versionInfo.svelte";

describe("versionInfo", () => {
    it("displayLabel contains ArisuTalk regardless of channel", () => {
        // displayLabel is a computed getter with branching logic (channel suffix)
        expect(versionInfo.displayLabel).toContain("ArisuTalk");
    });
});
