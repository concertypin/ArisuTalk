import { test, expect, describe } from "vitest";
import { render } from "vitest-browser-svelte";
import SanitizedHtml from "@/components/SanitizedHtml.svelte";
import { MARKDOWN_SANITIZER } from "@/lib/utils/markdownSanitizer";
import { withoutSetHTML, withStubbedSetHTML } from "@test/utils/setHTML";

describe("SanitizedHtml Component", () => {
    test("renders through setHTML with the markdown allowlist", async () => {
        const setHTML = withStubbedSetHTML();

        const screen = render(SanitizedHtml, { html: "<p>hi</p>" });

        await expect.element(screen.getByText("sanitized:<p>hi</p>")).toBeVisible();
        expect(setHTML).toHaveBeenCalledExactlyOnceWith("<p>hi</p>", {
            sanitizer: MARKDOWN_SANITIZER,
        });
    });

    test("renders again through setHTML when html changes", async () => {
        const setHTML = withStubbedSetHTML();
        const screen = render(SanitizedHtml, { html: "first" });
        await expect.element(screen.getByText("sanitized:first")).toBeVisible();

        await screen.rerender({ html: "second" });

        await expect.element(screen.getByText("sanitized:second")).toBeVisible();
        await expect.element(screen.getByText("sanitized:first")).not.toBeInTheDocument();
        expect(setHTML).toHaveBeenLastCalledWith("second", { sanitizer: MARKDOWN_SANITIZER });
    });

    test("applies the class to its wrapper", async () => {
        withStubbedSetHTML();

        const screen = render(SanitizedHtml, { html: "x", class: "prose" });

        await expect.element(screen.getByText("sanitized:x")).toHaveClass("prose");
    });

    test("shows the HTML as plain text when the browser has no setHTML", async () => {
        withoutSetHTML();

        const screen = render(SanitizedHtml, { html: `<img src="x" alt="pic" onerror="x()">hi` });

        await expect
            .element(screen.getByText(`<img src="x" alt="pic" onerror="x()">hi`))
            .toBeVisible();
        await expect.element(screen.getByRole("img")).not.toBeInTheDocument();
    });
});
