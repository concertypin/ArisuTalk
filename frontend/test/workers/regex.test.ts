import { describe, it, expect, vi } from "vitest";

// Mock Comlink
vi.mock("comlink", () => ({
    expose: vi.fn(),
}));

import { api } from "@worker/regex/main";

describe("Regex Worker Logic", () => {
    describe("replace", () => {
        it.concurrent("should perform a simple replacement", async () => {
            const text = "Hello World";
            const result = await api.replace(text, "World", "Arisu");
            expect(result).toBe("Hello Arisu");
        });
    });

    describe("applyRules", () => {
        it.concurrent("should apply multiple rules", async () => {
            const text = "The quick brown fox";
            const rules = [
                { pattern: "quick", replacement: "slow" },
                { pattern: "brown", replacement: "red" },
            ];
            const result = await api.applyRules(text, rules);
            expect(result).toBe("The slow red fox");
        });
    });
});
