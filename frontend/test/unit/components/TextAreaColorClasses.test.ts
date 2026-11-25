import { readFileSync } from "node:fs";
import { describe, expect } from "vitest";
import { softTest } from "@test/utils/softTest";

// Tailwind scans source as plain text, so a class built at runtime (`textarea-${color}`) gets no CSS.
const source = readFileSync(
    new URL("../../../src/components/input/TextArea.svelte", import.meta.url),
    "utf8"
);

/** The `color: "class"` entries of the component's `colorClass` map. */
const entries = [
    ...(/const colorClass = \{([^}]*)\}/.exec(source)?.[1] ?? "").matchAll(
        /([a-z]+):\s*"([^"]*)"/g
    ),
].map((match) => ({ color: match[1], className: match[2] }));

describe("TextArea color classes in the source", () => {
    softTest("the colorClass map could be read from the component", () => {
        // Hard check: the soft checks below would otherwise check nothing.
        expect(entries.map((entry) => entry.color)).toContain("primary");
        expect(entries.map((entry) => entry.color)).toContain("error");
    });

    softTest(
        "soft color check: every color class is spelled out as a complete literal",
        ({ warn }) => {
            for (const { color, className } of entries) {
                // Template on purpose: a literal here would make Tailwind generate the class.
                warn(() => expect(className).toBe(`textarea-${color}`));
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
