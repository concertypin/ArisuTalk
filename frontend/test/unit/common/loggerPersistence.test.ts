// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, onTestFinished, vi } from "vitest";
import { Logger, type AnyLogEntry } from "@common/logger/Logger";
import { createLocalStorageMock } from "@test/utils/localStorageMock";

vi.unmock("@common/logger/Logger");

const STORAGE_KEY = "arisutalk:logLevel";

describe("Logger level persistence", () => {
    beforeEach(() => {
        vi.stubGlobal("localStorage", createLocalStorageMock(vi));
        Logger.clearListeners();
    });

    afterEach(() => {
        Logger.reset();
        vi.unstubAllGlobals();
    });

    it("restores the persisted level on reset()", () => {
        localStorage.setItem(STORAGE_KEY, "debug");

        Logger.reset();

        expect(Logger.getLevel()).toBe("debug");
    });

    it("falls back to 'info' when the persisted value is not a known level", () => {
        localStorage.setItem(STORAGE_KEY, "shouting");

        Logger.reset();

        expect(Logger.getLevel()).toBe("info");
    });

    it("falls back to 'info' when nothing is persisted", () => {
        Logger.setLevel("error");
        localStorage.removeItem(STORAGE_KEY);

        Logger.reset();

        expect(Logger.getLevel()).toBe("info");
    });

    it("falls back to 'info' when reading the persisted level throws", () => {
        const storage = createLocalStorageMock(vi);
        vi.mocked(storage.getItem).mockImplementation(() => {
            throw new Error("SecurityError");
        });
        vi.stubGlobal("localStorage", storage);

        Logger.reset();

        expect(Logger.getLevel()).toBe("info");
    });

    it("keeps the new level in memory when persisting it fails", () => {
        const storage = createLocalStorageMock(vi);
        vi.mocked(storage.setItem).mockImplementation(() => {
            throw new Error("QuotaExceededError");
        });
        vi.stubGlobal("localStorage", storage);

        expect(() => Logger.setLevel("warn")).not.toThrow();

        expect(Logger.getLevel()).toBe("warn");
        expect(storage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("works without any localStorage access (e.g. when the property getter throws)", () => {
        const original = Object.getOwnPropertyDescriptor(window, "localStorage");
        Object.defineProperty(window, "localStorage", {
            configurable: true,
            get() {
                throw new Error("access denied");
            },
        });
        onTestFinished(() => {
            if (original) Object.defineProperty(window, "localStorage", original);
            else Reflect.deleteProperty(window, "localStorage");
        });

        Logger.reset();
        expect(Logger.getLevel()).toBe("info");

        expect(() => Logger.setLevel("debug")).not.toThrow();
        expect(Logger.getLevel()).toBe("debug");
    });
});

describe("Logger listener entries", () => {
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

    it("keeps a string first argument as the message and the rest as data", () => {
        Logger.warn("disk almost full", 91, { mount: "/" });

        expect(entries).toHaveLength(1);
        expect(entries[0]).toMatchObject({
            level: "warn",
            message: "disk almost full",
            data: [91, { mount: "/" }],
        });
    });

    it("omits data when only a message is logged", () => {
        Logger.info("just text");

        expect(entries[0].level).toBe("info");
        expect("data" in entries[0] ? entries[0].data : "missing").toBeUndefined();
    });

    it("serializes a non-string first argument into the message and keeps it in data", () => {
        Logger.error({ code: 7 });

        expect(entries[0]).toMatchObject({
            level: "error",
            message: '{"code":7}',
            data: [{ code: 7 }],
        });
    });

    it("delivers entries to every listener and stops after reset()", () => {
        const second: AnyLogEntry[] = [];
        Logger.onLog((entry) => second.push(entry));

        Logger.info("to both");
        Logger.reset();
        Logger.info("to nobody");

        expect(entries.map((e) => e.message)).toEqual(["to both"]);
        expect(second.map((e) => e.message)).toEqual(["to both"]);
    });
});
