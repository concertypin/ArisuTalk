import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Logger, type AnyLogEntry } from "@common/logger/Logger";
import { ReplaceHookManager } from "@worker/regex/ReplaceHookManager";

describe("ReplaceHookManager", () => {
    describe("rule management", () => {
        it("applies the rules given to the constructor in order", () => {
            const manager = new ReplaceHookManager([
                { pattern: "a", replacement: "b" },
                { pattern: "b", replacement: "c" },
            ]);

            expect(manager.apply("a")).toBe("c");
        });

        it("applies nothing without rules", () => {
            expect(new ReplaceHookManager().apply("unchanged")).toBe("unchanged");
        });

        it("addRule appends a rule that runs after the existing ones", () => {
            const manager = new ReplaceHookManager([{ pattern: "a", replacement: "b" }]);

            manager.addRule({ pattern: "b", replacement: "c" });

            expect(manager.apply("a")).toBe("c");
        });

        it("clearRules removes every rule", () => {
            const manager = new ReplaceHookManager([{ pattern: "a", replacement: "b" }]);

            manager.clearRules();

            expect(manager.apply("a")).toBe("a");
        });

        it("setRules replaces the previous rules instead of adding to them", () => {
            const manager = new ReplaceHookManager([{ pattern: "a", replacement: "OLD" }]);

            manager.setRules([{ pattern: "a", replacement: "NEW" }]);

            expect(manager.apply("a")).toBe("NEW");
        });
    });

    describe("apply", () => {
        it("replaces every match by default", () => {
            const manager = new ReplaceHookManager([{ pattern: "o", replacement: "0" }]);

            expect(manager.apply("foo boo")).toBe("f00 b00");
        });

        it("treats an empty flags string like the default global flag", () => {
            const manager = new ReplaceHookManager([{ pattern: "o", replacement: "0", flags: "" }]);

            expect(manager.apply("foo")).toBe("f00");
        });

        it("honours explicit flags", () => {
            const firstOnly = new ReplaceHookManager([
                { pattern: "o", replacement: "0", flags: "i" },
            ]);
            const caseInsensitive = new ReplaceHookManager([
                { pattern: "hello", replacement: "hi", flags: "gi" },
            ]);

            // Without "g" only the first match is replaced.
            expect(firstOnly.apply("oOo")).toBe("0Oo");
            expect(caseInsensitive.apply("Hello HELLO")).toBe("hi hi");
        });

        it("expands capture groups in the replacement", () => {
            const manager = new ReplaceHookManager([
                { pattern: "(\\w+) (\\w+)", replacement: "$2 $1" },
            ]);

            expect(manager.apply("first second")).toBe("second first");
        });
    });

    describe("invalid rules", () => {
        let logs: AnyLogEntry[];
        let detach: () => void;

        beforeEach(() => {
            logs = [];
            detach = Logger.onLog((entry) => logs.push(entry));
        });

        afterEach(() => {
            detach();
        });

        it("skips a rule with an invalid pattern, logs it, and still applies the other rules", () => {
            const manager = new ReplaceHookManager([
                { pattern: "a", replacement: "b" },
                { pattern: "(oops", replacement: "never" },
                { pattern: "b", replacement: "c" },
            ]);

            expect(manager.apply("a (oops")).toBe("c (oops");
            const errorLogs = logs.filter((entry) => entry.level === "error");
            expect(errorLogs).toHaveLength(1);
            expect(errorLogs[0].message).toBe("Failed to apply regex rule: (oops");
        });

        it("skips a rule with invalid flags", () => {
            const manager = new ReplaceHookManager([
                { pattern: "a", replacement: "b", flags: "zz" },
            ]);

            expect(manager.apply("a")).toBe("a");
            expect(logs.some((entry) => entry.level === "error")).toBe(true);
        });
    });
});
