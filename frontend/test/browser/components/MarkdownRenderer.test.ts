/// <reference types="vitest/browser" />
import { test, expect, describe, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import MarkdownRenderer from "@/components/MarkdownRenderer.svelte";
import { applyTheme } from "@/lib/theme.svelte";
import { contrastRatio } from "@test/utils/color";

describe("MarkdownRenderer Component", () => {
    test("renders markdown content", async () => {
        const { getByText } = render(MarkdownRenderer, {
            source: "Hello World",
        });

        await expect.element(getByText("Hello World")).toBeVisible();
    });

    test("renders markdown with formatting", async () => {
        const source = "# Heading\n\n**Bold text** and *italic text*";
        const { getByText } = render(MarkdownRenderer, {
            source,
        });

        // The markdown should be rendered with styling
        await expect.element(getByText("Heading")).toBeVisible();

        // svelte-markdown might join them or keep them separate depending on rendering
        // but 'Bold text' should be visible
        await expect.element(getByText("Bold text")).toBeVisible();
    });

    test("renders markdown with links", async () => {
        const source = "[Link text](https://example.com)";
        const { getByRole } = render(MarkdownRenderer, {
            source,
        });

        await expect.element(getByRole("link", { name: "Link text" })).toBeVisible();
    });

    test("renders empty string", async () => {
        const { container } = render(MarkdownRenderer, {
            source: "",
        });

        // Wait for rendering to settle
        await vi.waitFor(() => {
            const proseDiv = container.querySelector(".prose");
            expect(proseDiv).toBeTruthy();
        });
    });

    test("handles markdown with code blocks", async () => {
        const source = "```\nconst x = 1;\n```";
        const { container } = render(MarkdownRenderer, {
            source,
        });

        await vi.waitFor(() => {
            const codeElement = container.querySelector("code");
            expect(codeElement).toBeTruthy();
        });
    });

    test.each(["light", "dark"] as const)(
        "text is readable on the %s theme background",
        async (mode) => {
            applyTheme(mode);
            try {
                const { container } = render(MarkdownRenderer, { source: "Hello **World**" });

                await vi.waitFor(() => expect(container.querySelector(".prose")).toBeTruthy());
                const prose = container.querySelector(".prose");
                if (!prose) throw new Error("markdown element missing");

                // <body> animates its background when the theme changes, so wait for it to settle.
                await vi.waitFor(() => {
                    const ratio = contrastRatio(
                        getComputedStyle(prose).color,
                        getComputedStyle(document.body).backgroundColor
                    );
                    expect(ratio).toBeGreaterThan(4.5);
                });
            } finally {
                document.documentElement.removeAttribute("data-theme");
                document.documentElement.style.colorScheme = "";
            }
        }
    );
});
