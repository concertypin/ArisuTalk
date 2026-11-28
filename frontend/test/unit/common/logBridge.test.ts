// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, onTestFinished, vi } from "vitest";
import { Logger, type AnyLogEntry, type StandardLogEntry } from "@common/logger/Logger";
import {
    createLogBridgeReceiver,
    createLogBridgeSender,
    type LogBridgeReceiver,
} from "@common/logger/LogBridge";
import type { StructuredLogLevel } from "@common/logger/LogType";

vi.unmock("@common/logger/Logger");

type StructuredEntry = Parameters<LogBridgeReceiver["receiveStructuredLog"]>[0];

function makeRecordingReceiver() {
    const logs: StandardLogEntry[] = [];
    const structured: StructuredEntry[] = [];
    const receiver: LogBridgeReceiver = {
        receiveLog: (entry) => void logs.push(entry),
        receiveStructuredLog: (entry) => void structured.push(entry),
    };
    return { receiver, logs, structured };
}

describe("createLogBridgeSender", () => {
    it("sends each level wrapper to the receiver with its own level, message and arguments", () => {
        const { receiver, logs } = makeRecordingReceiver();
        const sender = createLogBridgeSender(receiver);

        sender.info("i", 1);
        sender.warn("w", { a: 1 });
        sender.error("e");
        sender.debug("d", "x", "y");
        sender.verbose("v");
        sender.trace("t", null);

        expect(logs.map((e) => [e.level, e.message, e.data])).toEqual([
            ["info", "i", [1]],
            ["warn", "w", [{ a: 1 }]],
            ["error", "e", undefined],
            ["debug", "d", ["x", "y"]],
            ["verbose", "v", undefined],
            ["trace", "t", [null]],
        ]);
    });

    it("stamps entries with the current time", () => {
        vi.useFakeTimers({ toFake: ["Date"] });
        onTestFinished(() => {
            vi.useRealTimers();
        });
        vi.setSystemTime(123_456);
        const { receiver, logs } = makeRecordingReceiver();

        createLogBridgeSender(receiver).log("log", "timed");

        expect(logs[0].timestamp).toBe(123_456);
    });

    it("sends structured events with the event name as level and message", () => {
        const { receiver, structured } = makeRecordingReceiver();
        const data: StructuredLogLevel["worker.status"] = { workerName: "regex", status: "ready" };

        createLogBridgeSender(receiver).structured("worker.status", data);

        expect(structured).toHaveLength(1);
        expect(structured[0]).toMatchObject({
            level: "worker.status",
            message: "worker.status",
            data,
        });
    });

    describe("when the receiver rejects", () => {
        let errorSpy: ReturnType<typeof vi.spyOn>;
        let logSpy: ReturnType<typeof vi.spyOn>;

        beforeEach(() => {
            errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
            logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it("falls back to the console for standard logs without throwing", async () => {
            const failure = new Error("bridge closed");
            const receiver: LogBridgeReceiver = {
                receiveLog: vi.fn<LogBridgeReceiver["receiveLog"]>().mockRejectedValue(failure),
                receiveStructuredLog: () => {},
            };

            createLogBridgeSender(receiver).warn("kept locally", 42);

            await vi.waitFor(() => expect(errorSpy).toHaveBeenCalled());
            expect(errorSpy).toHaveBeenCalledWith(
                "[LogBridge] Failed to send log to main thread:",
                failure
            );
            expect(logSpy).toHaveBeenCalledWith("[warn] kept locally", 42);
        });

        it("reports a failed structured log on the console", async () => {
            const failure = new Error("bridge closed");
            const receiver: LogBridgeReceiver = {
                receiveLog: () => {},
                receiveStructuredLog: vi
                    .fn<LogBridgeReceiver["receiveStructuredLog"]>()
                    .mockRejectedValue(failure),
            };

            createLogBridgeSender(receiver).structured("worker.status", {
                workerName: "regex",
                status: "error",
            });

            await vi.waitFor(() => expect(errorSpy).toHaveBeenCalled());
            expect(errorSpy).toHaveBeenCalledWith(
                "[LogBridge] Failed to send structured log to main thread:",
                failure
            );
        });
    });
});

describe("createLogBridgeReceiver", () => {
    let entries: AnyLogEntry[];
    let detach: () => void;

    beforeEach(() => {
        Logger.clearListeners();
        entries = [];
        detach = Logger.onLog((entry) => entries.push(entry));
    });

    afterEach(() => {
        detach();
    });

    it.each(["info", "warn", "error", "debug", "verbose", "trace", "log"] as const)(
        "forwards a worker '%s' log to the matching Logger method",
        (level) => {
            createLogBridgeReceiver().receiveLog({
                level,
                message: `worker ${level}`,
                timestamp: 1,
                data: [{ n: 1 }, "two"],
            });

            expect(entries).toHaveLength(1);
            expect(entries[0]).toMatchObject({
                level,
                message: `worker ${level}`,
                data: [{ n: 1 }, "two"],
            });
        }
    );

    it("forwards a log without data as a plain message", () => {
        createLogBridgeReceiver().receiveLog({ level: "info", message: "bare", timestamp: 1 });

        expect(entries).toHaveLength(1);
        expect(entries[0].message).toBe("bare");
        expect("data" in entries[0] ? entries[0].data : undefined).toBeUndefined();
    });

    it("forwards structured logs as structured events with their data", () => {
        createLogBridgeReceiver().receiveStructuredLog({
            level: "worker.status",
            message: "worker.status",
            timestamp: 1,
            data: { workerName: "cardparse", status: "ready" },
        });

        expect(entries).toHaveLength(1);
        expect(entries[0]).toMatchObject({
            level: "worker.status",
            data: { workerName: "cardparse", status: "ready" },
        });
    });

    it("round-trips a message from a sender through a receiver into Logger listeners", async () => {
        const sender = createLogBridgeSender(createLogBridgeReceiver());

        sender.error("from worker", { code: 3 });

        await vi.waitFor(() => expect(entries).toHaveLength(1));
        expect(entries[0]).toMatchObject({
            level: "error",
            message: "from worker",
            data: [{ code: 3 }],
        });
    });
});
