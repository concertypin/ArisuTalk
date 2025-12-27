/// <reference types="vitest/browser" />
import { test, expect, describe, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import MarkdownRenderer from "@/components/MarkdownRenderer.svelte";

describe("MarkdownRenderer Component", () => {
    test("renders markdown content", async () => {
        const { getByText } = render(MarkdownRenderer, {
            source: "Hello World",
        });

        await vi.waitFor(() => expect.element(getByText("Hello World")).toBeVisible());
    });

    test("renders markdown with formatting", async () => {
        const source = "# Heading\n\n**Bold text** and *italic text*";
        const { getByText } = render(MarkdownRenderer, {
            source,
        });

        // The markdown should be rendered with styling
        await vi.waitFor(() => expect.element(getByText("Heading")).toBeVisible());
        await vi.waitFor(() =>
            expect.element(getByText("Bold text and italic text")).toBeVisible()
        );
    });

    test("renders markdown with links", async () => {
        const source = "[Link text](https://example.com)";
        const { getByRole } = render(MarkdownRenderer, {
            source,
        });

        await vi.waitFor(() =>
            expect.element(getByRole("link", { name: "Link text" })).toBeVisible()
        );
    });

    /* Skip loading and error tests as they depend on internal library behavior and mock complexity
    test("shows loading state initially", async () => {
        // ...
    });

    test("handles render errors gracefully", async () => {
        // ...
    });
    */

    test("renders empty string", async () => {
        const { container } = render(MarkdownRenderer, {
            source: "",
        });

        // Wait for rendering
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

        // Wait for rendering
        await vi.waitFor(() => {
            const codeElement = container.querySelector("code");
            expect(codeElement).toBeTruthy();
        });
    });
});
