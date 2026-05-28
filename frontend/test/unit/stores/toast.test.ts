import { describe, it, expect, expectTypeOf, beforeEach, afterEach, vi } from "vitest";
import { toastStore, type ToastMessage } from "@/lib/stores/toast.svelte";

describe("ToastStore", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // Clear all toasts before each test
        while (toastStore.toasts.length > 0) {
            toastStore.dismiss(toastStore.toasts[0].id);
        }
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("Type Tests", () => {
        it("toasts array has correct type", () => {
            expectTypeOf(toastStore.toasts).toEqualTypeOf<ToastMessage[]>();
        });

        it("ToastMessage has correct structure", () => {
            expectTypeOf<ToastMessage>().toExtend<{
                id: string;
                type: "info" | "success" | "warning" | "error";
                message: string;
            }>();
        });
    });

    describe("show()", () => {
        it("adds a toast to the store", () => {
            toastStore.show("info", "Test message");
            expect(toastStore.toasts).toHaveLength(1);
            expect(toastStore.toasts[0].type).toBe("info");
            expect(toastStore.toasts[0].message).toBe("Test message");
        });

        it("generates unique IDs for each toast", () => {
            toastStore.show("info", "First");
            toastStore.show("info", "Second");
            expect(toastStore.toasts[0].id).not.toBe(toastStore.toasts[1].id);
        });

        it("auto-dismisses after specified duration", () => {
            toastStore.show("info", "Auto dismiss", 3000);
            expect(toastStore.toasts).toHaveLength(1);

            vi.advanceTimersByTime(3000);
            expect(toastStore.toasts).toHaveLength(0);
        });

        it("does not auto-dismiss when duration is 0", () => {
            toastStore.show("info", "Persistent", 0);
            expect(toastStore.toasts).toHaveLength(1);

            vi.advanceTimersByTime(10000);
            expect(toastStore.toasts).toHaveLength(1);
        });
    });

    describe("Convenience methods", () => {
        it("error() creates error toast with default 5000ms duration", () => {
            toastStore.error("Error message");
            expect(toastStore.toasts[0].type).toBe("error");

            vi.advanceTimersByTime(4999);
            expect(toastStore.toasts).toHaveLength(1);

            vi.advanceTimersByTime(1);
            expect(toastStore.toasts).toHaveLength(0);
        });

        it("success() creates success toast with default 3000ms duration", () => {
            toastStore.success("Success message");
            expect(toastStore.toasts[0].type).toBe("success");

            vi.advanceTimersByTime(3000);
            expect(toastStore.toasts).toHaveLength(0);
        });

        it("info() creates info toast with default 3000ms duration", () => {
            toastStore.info("Info message");
            expect(toastStore.toasts[0].type).toBe("info");

            vi.advanceTimersByTime(3000);
            expect(toastStore.toasts).toHaveLength(0);
        });

        it("warning() creates warning toast with default 4000ms duration", () => {
            toastStore.warning("Warning message");
            expect(toastStore.toasts[0].type).toBe("warning");

            vi.advanceTimersByTime(4000);
            expect(toastStore.toasts).toHaveLength(0);
        });
    });

    describe("dismiss()", () => {
        it("removes a specific toast by ID", () => {
            toastStore.show("info", "First");
            toastStore.show("success", "Second");
            const firstId = toastStore.toasts[0].id;

            toastStore.dismiss(firstId);

            expect(toastStore.toasts).toHaveLength(1);
            expect(toastStore.toasts[0].message).toBe("Second");
        });

        it("clears timer when dismissing", () => {
            toastStore.show("info", "Test", 3000);
            const id = toastStore.toasts[0].id;

            toastStore.dismiss(id);
            expect(toastStore.toasts).toHaveLength(0);

            // Should not throw even after timer would have fired
            vi.advanceTimersByTime(3000);
            expect(toastStore.toasts).toHaveLength(0);
        });

        it("handles dismissing non-existent ID gracefully", () => {
            toastStore.show("info", "Test");
            expect(() => toastStore.dismiss("non-existent")).not.toThrow();
            expect(toastStore.toasts).toHaveLength(1);
        });
    });
});
