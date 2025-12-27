import { describe, it, expect, beforeEach } from "vitest";
import { setLoading, getLoading, setError, getError, clearAppState } from "@/stores/app.svelte";

describe("App Global Store", () => {
    beforeEach(() => {
        clearAppState();
    });

    it("should initialize with default values", () => {
        expect(getLoading()).toBe(false);
        expect(getError()).toBe(null);
    });

    it("should update loading state", () => {
        setLoading(true);
        expect(getLoading()).toBe(true);
        setLoading(false);
        expect(getLoading()).toBe(false);
    });

    it("should update error state", () => {
        const errorMsg = "Something went wrong";
        setError(errorMsg);
        expect(getError()).toBe(errorMsg);
        setError(null);
        expect(getError()).toBe(null);
    });

    it("should clear app state", () => {
        setLoading(true);
        setError("Error");
        clearAppState();
        expect(getLoading()).toBe(false);
        expect(getError()).toBe(null);
    });
});
