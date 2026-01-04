import { describe, it, expect, beforeEach, expectTypeOf } from "vitest";
import {
    Logger,
    type AnyLogEntry,
    type StandardLogEntry,
    type StructuredLogEntry,
    type LogListener,
} from "@common/logger/Logger";

describe("Logger Class", () => {
    beforeEach(() => {
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

    it("should have structured logging method", () => {
        expectTypeOf(Logger.structured).toBeFunction();
    });

    it("should trigger a hook when a log is emitted", () => {
        const entries: AnyLogEntry[] = [];
        const listener: LogListener = (entry) => entries.push(entry);
        Logger.onLog(listener);

        Logger.info("Hello, world!", { meta: "data" });

        expect(entries).toHaveLength(1);
        const entry = entries[0] as StandardLogEntry;
        expect(entry.message).toContain("Hello, world!");
        expect(entry.level).toBe("info");
        expect(entry.data).toEqual([{ meta: "data" }]);
    });

    it("should trigger a hook when a structured event is emitted", () => {
        const entries: AnyLogEntry[] = [];
        const listener: LogListener = (entry) => entries.push(entry);
        Logger.onLog(listener);

        Logger.structured("chat.message.send", {
            chatId: "chat-123",
            messageLength: 42,
        });

        expect(entries).toHaveLength(1);
        const entry = entries[0] as StructuredLogEntry<"chat.message.send">;
        expect(entry.level).toBe("chat.message.send");
        expect(entry.data.chatId).toBe("chat-123");
        expect(entry.data.messageLength).toBe(42);
    });

    it("should support listener removal via returned cleanup function", () => {
        const entries: AnyLogEntry[] = [];
        const listener: LogListener = (entry) => entries.push(entry);
        const cleanup = Logger.onLog(listener);

        Logger.info("First message");
        expect(entries).toHaveLength(1);

        cleanup();

        Logger.info("Second message");
        expect(entries).toHaveLength(1); // Still 1, not called again
    });

    it("should support explicit listener removal via offLog", () => {
        const entries: AnyLogEntry[] = [];
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
