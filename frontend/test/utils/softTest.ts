/** @fileoverview `softTest`: a `test` whose `warn` fixture turns failed checks into warnings. */
import { stripVTControlCharacters } from "node:util";
import { test as baseTest, type TestContext } from "vitest";

/** Reports a failed check as a warning annotation instead of failing the test. */
export interface Warn {
    /** Awaits an async check. A failed assertion becomes a warning; any other error rejects. */
    (check: () => Promise<void>): Promise<void>;
    /** Runs a sync check. A failed assertion becomes a warning; any other error is rethrown. */
    (check: () => void): void;
}

// jest-dom matchers throw `JestExtendError` with a plain "Error" name, so the class name is checked.
function isAssertionError(error: unknown): error is Error {
    return (
        error instanceof Error &&
        (error.name === "AssertionError" || error.constructor.name === "JestExtendError")
    );
}

function createWarn(annotate: TestContext["annotate"]): Warn {
    function report(error: unknown): void {
        if (!isAssertionError(error)) throw error;
        // Terminal color codes would show up as noise in a CI annotation.
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

/** `test` extended with the `warn` fixture. */
export const softTest = baseTest.extend("warn", ({ annotate }) => createWarn(annotate));
