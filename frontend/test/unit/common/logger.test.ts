// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, expectTypeOf, vi } from "vitest";
import { Logger } from "@common/logger/Logger";
import { createLogBridgeSender, createLogBridgeReceiver } from "@common/logger/LogBridge";

vi.unmock("@common/logger/Logger");

describe("Logger Class", () => {
    beforeEach(() => {
        Logger.reset();
        Logger.clearListeners();
        localStorage.clear();
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
        const listener = vi.fn();
        Logger.onLog(listener);

        Logger.info("Hello, world!", { meta: "data" });

        expect(listener).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "Hello, world!",
                level: "info",
                data: [{ meta: "data" }],
            })
        );
    });

    it("should trigger a hook for all log levels", () => {
        const listener = vi.fn();
        Logger.onLog(listener);

        Logger.info("info");
        Logger.log("log");
        Logger.warn("warn");
        Logger.error("error");
        Logger.debug("debug");
        Logger.verbose("verbose");
        Logger.trace("trace");

        expect(listener).toHaveBeenCalledTimes(7);
    });

    it("should trigger a hook when a structured event is emitted", () => {
        const listener = vi.fn();
        Logger.onLog(listener);

        Logger.structured("chat.message.send", {
            chatId: "chat-123",
            messageLength: 42,
        });

        expect(listener).toHaveBeenCalledWith(
            expect.objectContaining({
                level: "chat.message.send",
                data: { chatId: "chat-123", messageLength: 42 },
            })
        );
    });

    it("should support listener removal via returned cleanup function", () => {
        const listener = vi.fn();
        const cleanup = Logger.onLog(listener);

        Logger.info("First message");
        expect(listener).toHaveBeenCalledTimes(1);

        cleanup();

        Logger.info("Second message");
        expect(listener).toHaveBeenCalledTimes(1); // Still 1
    });

    it("should support explicit listener removal via offLog", () => {
        const listener = vi.fn();
        Logger.onLog(listener);

        Logger.info("First message");
        expect(listener).toHaveBeenCalledTimes(1);

        Logger.offLog(listener);

        Logger.info("Second message");
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it("should support log level get/set and persistence", () => {
        Logger.setLevel("debug");
        expect(Logger.getLevel()).toBe("debug");
        expect(localStorage.getItem("arisutalk:logLevel")).toBe("debug");

        Logger.setLevel("error");
        expect(Logger.getLevel()).toBe("error");
        expect(localStorage.getItem("arisutalk:logLevel")).toBe("error");
    });
});

describe("LogBridge", () => {
    beforeEach(() => {
        Logger.clearListeners();
    });

    it("should forward logs from sender to receiver", async () => {
        const receiver = createLogBridgeReceiver();
        const sender = createLogBridgeSender(receiver);

        const listener = vi.fn();
        Logger.onLog(listener);

        sender.info("message from worker", { foo: "bar" });

        // Wait for dynamic import and promise in receiver
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(listener).toHaveBeenCalledWith(
            expect.objectContaining({
                level: "info",
                message: "message from worker",
                data: [{ foo: "bar" }],
            })
        );
    });

    it("should forward all log levels via bridge", async () => {
        const receiver = createLogBridgeReceiver();
        const sender = createLogBridgeSender(receiver);
        const listener = vi.fn();
        Logger.onLog(listener);

        sender.info("info");
        sender.warn("warn");
        sender.error("error");
        sender.debug("debug");
        sender.verbose("verbose");
        sender.trace("trace");

        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(listener).toHaveBeenCalledTimes(6);
    });

    it("should forward structured logs from sender to receiver", async () => {
        const receiver = createLogBridgeReceiver();
        const sender = createLogBridgeSender(receiver);

        const listener = vi.fn();
        Logger.onLog(listener);

        sender.structured("worker.status", { workerName: "test", status: "ready" });

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(listener).toHaveBeenCalledWith(
            expect.objectContaining({
                level: "worker.status",
                data: { workerName: "test", status: "ready" },
            })
        );
    });
});
