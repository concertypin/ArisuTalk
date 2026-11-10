import { test, expect, describe } from "vitest";
import { render } from "vitest-browser-svelte";
import SanitizedHtml from "@/components/SanitizedHtml.svelte";

describe("SanitizedHtml Component", () => {
    test("renders safe markup", async () => {
        const screen = render(SanitizedHtml, {
            html: "<p>Hello <strong>world</strong></p>",
        });

        await expect.element(screen.getByText("world")).toBeVisible();
        expect(screen.container.querySelector("strong")).not.toBeNull();
    });

    test("strips scripts and event handlers", async () => {
        const screen = render(SanitizedHtml, {
            html: '<img src="x" onerror="window.__xss = true"><script>window.__xss = true</script><p>ok</p>',
        });

        await expect.element(screen.getByText("ok")).toBeVisible();
        expect(screen.container.querySelector("script")).toBeNull();
        expect(screen.container.querySelector("img")?.hasAttribute("onerror")).toBe(false);
        expect("__xss" in window).toBe(false);
    });

    test("applies the class to its wrapper", async () => {
        const screen = render(SanitizedHtml, { html: "<p>x</p>", class: "prose" });

        expect(screen.container.querySelector(".prose p")).not.toBeNull();
    });

    test("re-renders when html changes", async () => {
        const screen = render(SanitizedHtml, { html: "<p>first</p>" });
        await expect.element(screen.getByText("first")).toBeVisible();

        await screen.rerender({ html: "<p>second</p>" });

        await expect.element(screen.getByText("second")).toBeVisible();
        expect(screen.container.textContent).not.toContain("first");
    });
});
