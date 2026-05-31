import { describe, it, expect, beforeEach } from "vitest";
import { IsolatedStorage } from "@worker/scripting/IsolatedStorage";

describe("IsolatedStorage", () => {
    let storage: IsolatedStorage;

    beforeEach(() => {
        storage = new IsolatedStorage();
    });

    describe("setItem and getItem", () => {
        it("stores and retrieves a value", () => {
            storage.setItem("key1", "value1");
            expect(storage.getItem("key1")).toBe("value1");
        });

        it("overwrites existing values", () => {
            storage.setItem("key1", "value1");
            storage.setItem("key1", "value2");
            expect(storage.getItem("key1")).toBe("value2");
        });

        it("returns null for non-existent keys", () => {
            expect(storage.getItem("nonexistent")).toBeNull();
        });

        it("stores multiple independent keys", () => {
            storage.setItem("a", "1");
            storage.setItem("b", "2");
            storage.setItem("c", "3");

            expect(storage.getItem("a")).toBe("1");
            expect(storage.getItem("b")).toBe("2");
            expect(storage.getItem("c")).toBe("3");
        });
    });

    describe("removeItem", () => {
        it("removes a stored value", () => {
            storage.setItem("key1", "value1");
            storage.removeItem("key1");
            expect(storage.getItem("key1")).toBeNull();
        });

        it("does not affect other keys", () => {
            storage.setItem("a", "1");
            storage.setItem("b", "2");
            storage.removeItem("a");

            expect(storage.getItem("a")).toBeNull();
            expect(storage.getItem("b")).toBe("2");
        });

        it("handles removing non-existent keys gracefully", () => {
            expect(() => storage.removeItem("nonexistent")).not.toThrow();
        });
    });

    describe("clear", () => {
        it("removes all stored values", () => {
            storage.setItem("a", "1");
            storage.setItem("b", "2");
            storage.setItem("c", "3");
            storage.clear();

            expect(storage.getItem("a")).toBeNull();
            expect(storage.getItem("b")).toBeNull();
            expect(storage.getItem("c")).toBeNull();
        });

        it("resets length to 0", () => {
            storage.setItem("a", "1");
            storage.setItem("b", "2");
            expect(storage.length).toBe(2);

            storage.clear();
            expect(storage.length).toBe(0);
        });

        it("allows reuse after clearing", () => {
            storage.setItem("a", "1");
            storage.clear();
            storage.setItem("b", "2");

            expect(storage.getItem("a")).toBeNull();
            expect(storage.getItem("b")).toBe("2");
            expect(storage.length).toBe(1);
        });
    });

    describe("length", () => {
        it("returns 0 for empty storage", () => {
            expect(storage.length).toBe(0);
        });

        it("returns correct count after adding items", () => {
            storage.setItem("a", "1");
            expect(storage.length).toBe(1);

            storage.setItem("b", "2");
            expect(storage.length).toBe(2);

            storage.setItem("c", "3");
            expect(storage.length).toBe(3);
        });

        it("decrements after removing items", () => {
            storage.setItem("a", "1");
            storage.setItem("b", "2");
            expect(storage.length).toBe(2);

            storage.removeItem("a");
            expect(storage.length).toBe(1);
        });
    });

    describe("key", () => {
        it("returns the key at the specified index", () => {
            storage.setItem("first", "1");
            storage.setItem("second", "2");
            storage.setItem("third", "3");

            // Access private storage field for deterministic key enumeration
            const internalStorage = storage["storage"];

            const keys = Object.keys(internalStorage);
            expect(storage.key(0)).toBe(keys[0]);
            expect(storage.key(1)).toBe(keys[1]);
            expect(storage.key(2)).toBe(keys[2]);
        });

        it("returns null for out-of-bounds index", () => {
            storage.setItem("a", "1");
            expect(storage.key(0)).toBe("a");
            expect(storage.key(1)).toBeNull();
            expect(storage.key(-1)).toBeNull();
            expect(storage.key(100)).toBeNull();
        });

        it("returns null for empty storage", () => {
            expect(storage.key(0)).toBeNull();
        });
    });

    describe("Storage interface compliance", () => {
        it("implements the Storage interface", () => {
            expect(typeof storage.getItem).toBe("function");
            expect(typeof storage.setItem).toBe("function");
            expect(typeof storage.removeItem).toBe("function");
            expect(typeof storage.clear).toBe("function");
            expect(typeof storage.key).toBe("function");
            expect(typeof storage.length).toBe("number");
        });
    });
});
