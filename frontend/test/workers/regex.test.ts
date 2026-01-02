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

        it.concurrent("should handle case-insensitivity", async () => {
            const text = "HELLO world";
            const rules = [{ pattern: "hello", replacement: "Hi", flags: "gi" }];
            const result = await api.applyRules(text, rules);
            expect(result).toBe("Hi world");
        });

        it.concurrent("should handle global replacement", async () => {
            const text = "apple apple apple";
            const rules = [{ pattern: "apple", replacement: "orange", flags: "g" }];
            const result = await api.applyRules(text, rules);
            expect(result).toBe("orange orange orange");
        });

        it.concurrent("should handle capture groups", async () => {
            const text = "John Doe";
            const rules = [{ pattern: "(\\w+) (\\w+)", replacement: "$2, $1" }];
            const result = await api.applyRules(text, rules);
            expect(result).toBe("Doe, John");
        });
    });
});
