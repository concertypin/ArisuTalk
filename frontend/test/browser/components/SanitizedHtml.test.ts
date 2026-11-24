import { test, expect, describe } from "vitest";
import { render, screen } from "@testing-library/svelte";
import SanitizedHtml from "@/components/SanitizedHtml.svelte";

describe("SanitizedHtml Component", () => {
    test("renders safe markup", () => {
        const { container } = render(SanitizedHtml, {
            props: { html: "<p>Hello <strong>world</strong></p>" },
        });

        expect(screen.getByText("world")).toBeInTheDocument();
        expect(container.querySelector("strong")).not.toBeNull();
    });

    test("strips scripts and event handlers", () => {
        const { container } = render(SanitizedHtml, {
            props: {
                html: '<img src="x" onerror="window.__xss = true"><script>window.__xss = true</script><p>ok</p>',
            },
        });

        expect(screen.getByText("ok")).toBeInTheDocument();
        expect(container.querySelector("script")).toBeNull();
        expect(container.querySelector("img")?.hasAttribute("onerror")).toBe(false);
        expect("__xss" in window).toBe(false);
    });

    test("applies the class to its wrapper", () => {
        const { container } = render(SanitizedHtml, {
            props: { html: "<p>x</p>", class: "prose" },
        });

        expect(container.querySelector(".prose p")).not.toBeNull();
    });

    test("re-renders when html changes", async () => {
        const { container, rerender } = render(SanitizedHtml, {
            props: { html: "<p>first</p>" },
        });
        expect(screen.getByText("first")).toBeInTheDocument();

        await rerender({ html: "<p>second</p>" });

        expect(screen.getByText("second")).toBeInTheDocument();
        expect(container.textContent).not.toContain("first");
    });
});
