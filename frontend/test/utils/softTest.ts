/**
 * @fileoverview A `test` with a `warn` fixture, for checks that are too unreliable to fail CI.
 *
 * Without a real browser, a few signals cannot be trusted (for example whether a Tailwind color
 * class really produces a color). Wrap such a check in `warn(() => expect(...))` to get a normal
 * `expect` that reports a failure as a `"warning"` test annotation instead of failing the test.
 * The `github-actions` reporter turns the annotation into a warning on the PR; the default
 * reporter shows it only if the test fails for another reason (use `--reporter=verbose` to see it).
 * See https://vitest.dev/guide/test-annotations.
 */
import { stripVTControlCharacters } from "node:util";
import { test as baseTest } from "vitest";

/** The part of Vitest's `annotate` that `warn` needs. */
export type AnnotateFn = (message: string, type: string) => Promise<unknown>;

/**
 * Runs a check and reports a failed assertion as a warning annotation.
 *
 * - A synchronous check runs synchronously and returns `void`.
 * - An asynchronous check (a function returning a promise) returns a promise to await.
 * - Only assertion errors become warnings. Any other error (a `TypeError` from broken test code,
 *   a failed `findBy*` lookup that is not an assertion, ...) is rethrown and fails the test.
 */
export interface Warn {
    (check: () => Promise<void>): Promise<void>;
    (check: () => void): void;
}

/**
 * Whether an error comes from a failed `expect`. Vitest's own matchers throw chai's
 * `AssertionError`; custom matchers added with `expect.extend` (jest-dom's `toHaveClass`, ...)
 * throw Vitest's `JestExtendError`, whose `name` is a plain "Error", so its class name is checked.
 * @param error - The thrown value.
 * @returns True for an assertion error.
 */
function isAssertionError(error: unknown): error is Error {
    return (
        error instanceof Error &&
        (error.name === "AssertionError" || error.constructor.name === "JestExtendError")
    );
}

/**
 * Builds the `warn` function for one test.
 * @param annotate - The `annotate` function of the test context.
 * @returns The `warn` function.
 */
export function createWarn(annotate: AnnotateFn): Warn {
    function report(error: unknown): void {
        if (!isAssertionError(error)) throw error;
        // Vitest awaits annotations that are still pending when the test finishes. Matcher messages
        // carry terminal color codes, which would show up as noise in a CI annotation.
        void annotate(stripVTControlCharacters(error.message), "warning");
    }

    function warn(check: () => Promise<void>): Promise<void>;
    function warn(check: () => void): void;
    function warn(check: () => void | Promise<void>): void | Promise<void> {
        try {
            const result = check();
            if (result instanceof Promise) return result.catch(report);
        } catch (error) {
            report(error);
        }
    }
    return warn;
}

/**
 * `test` extended with the `warn` fixture:
 * `softTest("...", ({ warn }) => { warn(() => expect(el).toHaveClass("textarea-primary")); })`.
 */
export const softTest = baseTest.extend("warn", ({ annotate }) => createWarn(annotate));
