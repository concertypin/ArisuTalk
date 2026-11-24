import { test, expect, describe } from "vitest";
import { softTest } from "@test/utils/softTest";
import { render, screen, waitFor } from "@testing-library/svelte";
import MarkdownRenderer from "@/components/MarkdownRenderer.svelte";
// Preloaded: the component imports it lazily, and a cold first render would be slow.
import "@humanspeak/svelte-markdown";

describe("MarkdownRenderer Component", () => {
    test("renders markdown content", async () => {
        render(MarkdownRenderer, { props: { source: "Hello World" } });

        expect(await screen.findByText("Hello World")).toBeInTheDocument();
    });

    test("renders markdown with formatting", async () => {
        const source = "# Heading\n\n**Bold text** and *italic text*";
        render(MarkdownRenderer, { props: { source } });

        // The markdown should be rendered with styling
        expect(await screen.findByText("Heading")).toBeInTheDocument();

        // svelte-markdown might join them or keep them separate depending on rendering
        // but 'Bold text' should be visible
        expect(await screen.findByText("Bold text")).toBeInTheDocument();
    });

    test("renders markdown with links", async () => {
        const source = "[Link text](https://example.com)";
        render(MarkdownRenderer, { props: { source } });

        expect(await screen.findByRole("link", { name: "Link text" })).toBeInTheDocument();
    });

    test("renders empty string", async () => {
        const { container } = render(MarkdownRenderer, { props: { source: "" } });

        // Wait for rendering to settle
        await waitFor(() => {
            const proseDiv = container.querySelector(".prose");
            expect(proseDiv).toBeTruthy();
        });
    });

    test("handles markdown with code blocks", async () => {
        const source = "```\nconst x = 1;\n```";
        const { container } = render(MarkdownRenderer, { props: { source } });

        await waitFor(() => {
            const codeElement = container.querySelector("code");
            expect(codeElement).toBeTruthy();
        });
    });

    // DaisyUI's `prose` follows the theme; a fixed text color would break contrast on some themes.
    softTest("soft color check: plain `prose`, no fixed text color", async ({ warn }) => {
        const { container } = render(MarkdownRenderer, { props: { source: "Hello **World**" } });

        await waitFor(() => expect(container.querySelector(".prose")).toBeTruthy());
        const prose = container.querySelector(".prose");
        if (!prose) throw new Error("markdown element missing");

        expect(prose).toHaveClass("prose");
        warn(() => expect(prose).not.toHaveClass("prose-invert"));
        warn(() =>
            expect(prose.className).not.toMatch(
                /\b(?:prose-(?:slate|gray|zinc|neutral|stone)|text-)/
            )
        );
    });
});
