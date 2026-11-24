import { describe, test, expect, vi } from "vitest";
import { createWarn, softTest, type AnnotateFn } from "@test/utils/softTest";

function setup() {
    const annotate = vi.fn<AnnotateFn>().mockResolvedValue(undefined);
    return { annotate, warn: createWarn(annotate) };
}

describe("warn", () => {
    test("a failing expect records one warning annotation and does not throw", () => {
        const { annotate, warn } = setup();

        expect(() => warn(() => expect(1).toBe(2))).not.toThrow();

        expect(annotate).toHaveBeenCalledOnce();
        expect(annotate).toHaveBeenCalledWith(
            expect.stringContaining("expected 1 to be 2"),
            "warning"
        );
    });

    test("a passing expect records nothing", () => {
        const { annotate, warn } = setup();

        warn(() => expect(1).toBe(1));

        expect(annotate).not.toHaveBeenCalled();
    });

    test("an error that is not an assertion failure is rethrown", () => {
        const { annotate, warn } = setup();

        expect(() =>
            warn(() => {
                throw new TypeError("broken test code");
            })
        ).toThrow(TypeError);

        expect(annotate).not.toHaveBeenCalled();
    });

    test("an async check reports a failed expect the same way", async () => {
        const { annotate, warn } = setup();

        await warn(async () => {
            await Promise.resolve();
            expect("a").toBe("b");
        });

        expect(annotate).toHaveBeenCalledExactlyOnceWith(
            expect.stringContaining("expected 'a' to be 'b'"),
            "warning"
        );
    });

    test("an async check rethrows an error that is not an assertion failure", async () => {
        const { annotate, warn } = setup();

        await expect(
            warn(async () => {
                await Promise.resolve();
                throw new RangeError("broken async test code");
            })
        ).rejects.toThrow(RangeError);

        expect(annotate).not.toHaveBeenCalled();
    });
});

describe("softTest fixture", () => {
    softTest("attaches a warning annotation to the running test", async ({ warn, task }) => {
        warn(() => expect(1).toBe(2));

        await vi.waitFor(() => expect(task.annotations).toHaveLength(1));
        expect(task.annotations[0]?.type).toBe("warning");
        expect(task.annotations[0]?.message).toContain("expected 1 to be 2");
    });
});
