import { describe, it, expect, vi, beforeEach, expectTypeOf } from "vitest";
import { Logger, type LogEntry, type LogListener } from "@common/logger/Logger";

describe("Logger Class", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Logger.clearListeners();
    });

    it("should have standard logging methods", () => {
        expectTypeOf(Logger.info).toBeFunction();
        expectTypeOf(Logger.log).toBeFunction();
        expectTypeOf(Logger.warn).toBeFunction();
        expectTypeOf(Logger.error).toBeFunction();
    });

    it("should have verbose logging methods", () => {
        expectTypeOf(Logger.debug).toBeFunction();
        expectTypeOf(Logger.trace).toBeFunction();
        expectTypeOf(Logger.verbose).toBeFunction();
    });

    it("should trigger a hook when a log is emitted", () => {
        const entries: LogEntry[] = [];
        const listener: LogListener = (entry) => entries.push(entry);
        Logger.onLog(listener);

        Logger.info("Hello, world!", { meta: "data" });

        expect(entries).toHaveLength(1);
        expect(entries[0].message).toContain("Hello, world!");
        expect(entries[0].level).toBe("info");
        expect(entries[0].data).toEqual([{ meta: "data" }]);
    });

    it("should support listener removal via returned cleanup function", () => {
        const entries: LogEntry[] = [];
        const listener: LogListener = (entry) => entries.push(entry);
        const cleanup = Logger.onLog(listener);

        Logger.info("First message");
        expect(entries).toHaveLength(1);

        cleanup();

        Logger.info("Second message");
        expect(entries).toHaveLength(1); // Still 1, not called again
    });

    it("should support explicit listener removal via offLog", () => {
        const entries: LogEntry[] = [];
        const listener: LogListener = (entry) => entries.push(entry);
        Logger.onLog(listener);

        Logger.info("First message");
        expect(entries).toHaveLength(1);

        Logger.offLog(listener);

        Logger.info("Second message");
        expect(entries).toHaveLength(1);
    });

    it("should support log level get/set", () => {
        const originalLevel = Logger.getLevel();

        Logger.setLevel("debug");
        expect(Logger.getLevel()).toBe("debug");

        Logger.setLevel("error");
        expect(Logger.getLevel()).toBe("error");

        // Restore
        Logger.setLevel(originalLevel);
    });
});
