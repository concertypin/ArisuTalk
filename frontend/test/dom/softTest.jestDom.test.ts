import { test, expect, vi } from "vitest";
import { createWarn, type AnnotateFn } from "@test/utils/softTest";

// jest-dom matchers are custom matchers; their failures are not chai `AssertionError`s.
// `test/utils/softTest.test.ts` covers the rest of `warn` in Node.
test("warn reports a failed jest-dom matcher as a warning instead of throwing", () => {
    const annotate = vi.fn<AnnotateFn>().mockResolvedValue(undefined);
    const warn = createWarn(annotate);
    const element = document.createElement("div");

    expect(() => warn(() => expect(element).toHaveClass("missing"))).not.toThrow();

    expect(annotate).toHaveBeenCalledExactlyOnceWith(expect.stringContaining("missing"), "warning");
});

test("warn records nothing when a jest-dom matcher passes", () => {
    const annotate = vi.fn<AnnotateFn>().mockResolvedValue(undefined);
    const warn = createWarn(annotate);
    const element = document.createElement("div");
    element.className = "present";

    warn(() => expect(element).toHaveClass("present"));

    expect(annotate).not.toHaveBeenCalled();
});
