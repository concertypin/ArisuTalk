import { readFileSync } from "node:fs";
import { describe, expect } from "vitest";
import { softTest } from "@test/utils/softTest";

/**
 * Tailwind 4 finds the classes to generate by scanning source files as plain text (it never runs
 * the code), so a class is only generated if it appears there as a complete token. A class built
 * at runtime, such as a `textarea-${color}` template, is never seen and its CSS is missing.
 * See https://tailwindcss.com/docs/detecting-classes-in-source-files.
 */
const source = readFileSync(
    new URL("../../../src/components/input/TextArea.svelte", import.meta.url),
    "utf8"
);

/** The members of the component's `Color` union, read from its `type Color = ...;` declaration. */
const colors = [...(/type Color =([^;]*);/.exec(source)?.[1] ?? "").matchAll(/"([a-z]+)"/g)].map(
    (match) => match[1]
);

describe("TextArea color classes in the source", () => {
    softTest("the Color union could be read from the component", () => {
        // A hard check: if this fails, the soft checks below would silently check nothing.
        expect(colors).toContain("primary");
        expect(colors).toContain("error");
    });

    // Soft check: whether Tailwind really generates the CSS is not asserted here (that needs a build),
    // and a CI failure is not worth it, so a miss is reported as a warning.
    softTest(
        "soft color check: every color class is spelled out as a complete literal",
        ({ warn }) => {
            for (const color of colors) {
                // Built from a template in this test on purpose, for the same reason as in the component.
                const className = `textarea-${color}`;
                warn(() =>
                    expect(
                        source.includes(`"${className}"`),
                        `"${className}" is not a complete literal in TextArea.svelte`
                    ).toBe(true)
                );
            }
        }
    );

    softTest("soft color check: no color class is assembled at runtime", ({ warn }) => {
        warn(() =>
            expect(
                /textarea-\$\{|["']textarea-["']\s*\+/.test(source),
                "TextArea.svelte builds a textarea-* class name at runtime"
            ).toBe(false)
        );
    });
});
