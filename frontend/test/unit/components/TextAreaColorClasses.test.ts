import { readFileSync } from "node:fs";
import { describe, expect } from "vitest";
import { softTest } from "@test/utils/softTest";

// Tailwind scans source as plain text, so a class built at runtime (`textarea-${color}`) gets no CSS.
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
        // Hard check: the soft checks below would otherwise check nothing.
        expect(colors).toContain("primary");
        expect(colors).toContain("error");
    });

    softTest(
        "soft color check: every color class is spelled out as a complete literal",
        ({ warn }) => {
            for (const color of colors) {
                // Template on purpose: a literal here would make Tailwind generate the class.
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
