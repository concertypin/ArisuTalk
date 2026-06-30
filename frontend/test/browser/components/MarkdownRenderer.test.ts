/// <reference types="vitest/browser" />
import { test, expect, describe, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import MarkdownRenderer from "@/components/MarkdownRenderer.svelte";

describe("MarkdownRenderer Component (advanced)", () => {
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

        await expect.element(getByText("Heading")).toBeVisible();
        await expect.element(getByText("Bold text")).toBeVisible();
    });

    test("renders markdown with links", async () => {
        const source = "[Link text](https://example.com)";
        const { getByRole } = render(MarkdownRenderer, {
            source,
        });

        await expect.element(getByRole("link", { name: "Link text" })).toBeVisible();
    });

    test("renders empty string without crashing", async () => {
        const { container } = render(MarkdownRenderer, {
            source: "",
        });

        await vi.waitFor(() => {
            const proseDiv = container.querySelector(".prose");
            expect(proseDiv).toBeTruthy();
        });
    });

    test("escapes HTML to prevent XSS", async () => {
        const source = "<script>alert('xss')</script>";
        const { container } = render(MarkdownRenderer, {
            source,
        });

        await vi.waitFor(() => {
            // The script tag should be rendered as text, not executed
            const scripts = container.querySelectorAll("script");
            expect(scripts.length).toBe(0);
        });
    });

    test("renders ordered and unordered lists", async () => {
        const source = "- Item 1\n- Item 2\n- Item 3";
        const { getByText } = render(MarkdownRenderer, {
            source,
        });

        await expect.element(getByText("Item 1")).toBeVisible();
        await expect.element(getByText("Item 2")).toBeVisible();
        await expect.element(getByText("Item 3")).toBeVisible();
    });

    test("renders blockquotes", async () => {
        const source = "> This is a blockquote";
        const { getByText } = render(MarkdownRenderer, {
            source,
        });

        await expect.element(getByText("This is a blockquote")).toBeVisible();
    });

    test("handles very long single-line content", async () => {
        const longWord = "a".repeat(10000);
        const source = `Long word: ${longWord}`;
        const { getByText } = render(MarkdownRenderer, {
            source,
        });

        await expect.element(getByText(/Long word:/)).toBeVisible();
    });
});
