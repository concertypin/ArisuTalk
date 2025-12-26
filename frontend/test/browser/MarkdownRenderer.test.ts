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
        await vi.waitFor(() => expect.element(getByText("Bold text and italic text")).toBeVisible());
    });

    test("renders markdown with links", async () => {
        const source = "[Link text](https://example.com)";
        const { getByRole } = render(MarkdownRenderer, {
            source,
        });

        await vi.waitFor(() => expect.element(getByRole("link", { name: "Link text" })).toBeVisible());
    });

    test("shows loading state initially", async () => {
        // Mock a delayed import
        const mockPromise = new Promise((resolve) => {
            setTimeout(() => resolve({ default: vi.fn() }), 100);
        });
        vi.doMock("svelte-markdown", () => mockPromise);

        const { getByRole } = render(MarkdownRenderer, {
            source: "Test",
        });

        const spinner = getByRole("status");
        await expect.element(spinner).toBeVisible();
    });

    test("handles render errors gracefully", async () => {
        // Mock a failed import
        vi.doMock("svelte-markdown", () => {
            throw new Error("Failed to load");
        });

        const { getByText } = render(MarkdownRenderer, {
            source: "Test content",
        });

        const errorMessage = getByText("Failed to load markdown renderer");
        await expect.element(errorMessage).toBeVisible();

        // Should show fallback plain text
        await expect.element(getByText("Test content")).toBeVisible();
    });

    test("renders empty string", async () => {
        const { container } = render(MarkdownRenderer, {
            source: "",
        });

        // Should render empty container
        const proseDiv = container.querySelector(".prose");
        expect(proseDiv).toBeTruthy();
    });

    test("handles markdown with code blocks", async () => {
        const source = "```\nconst x = 1;\n```";
        const { container } = render(MarkdownRenderer, {
            source,
        });

        // Should render code block
        const codeElement = container.querySelector("code");
        expect(codeElement).toBeTruthy();
    });
});
