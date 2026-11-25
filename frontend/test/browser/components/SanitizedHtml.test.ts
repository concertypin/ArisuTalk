import { test, expect, describe } from "vitest";
import { render } from "@testing-library/svelte";
import SanitizedHtml from "@/components/SanitizedHtml.svelte";
import { MARKDOWN_SANITIZER } from "@/lib/utils/markdownSanitizer";
import { withoutSetHTML, withStubbedSetHTML } from "@test/utils/setHTML";

describe("SanitizedHtml Component", () => {
    test("renders through setHTML with the markdown allowlist", () => {
        const setHTML = withStubbedSetHTML();

        const screen = render(SanitizedHtml, { props: { html: "<p>hi</p>" } });

        expect(screen.getByText("sanitized:<p>hi</p>")).toBeVisible();
        expect(setHTML).toHaveBeenCalledExactlyOnceWith("<p>hi</p>", {
            sanitizer: MARKDOWN_SANITIZER,
        });
    });

    test("renders again through setHTML when html changes", async () => {
        const setHTML = withStubbedSetHTML();
        const screen = render(SanitizedHtml, { props: { html: "first" } });
        expect(screen.getByText("sanitized:first")).toBeVisible();

        await screen.rerender({ html: "second" });

        expect(screen.getByText("sanitized:second")).toBeVisible();
        expect(screen.queryByText("sanitized:first")).not.toBeInTheDocument();
        expect(setHTML).toHaveBeenLastCalledWith("second", { sanitizer: MARKDOWN_SANITIZER });
    });

    test("applies the class to its wrapper", () => {
        withStubbedSetHTML();

        const screen = render(SanitizedHtml, { props: { html: "x", class: "prose" } });

        expect(screen.getByText("sanitized:x")).toHaveClass("prose");
    });

    test("shows the HTML as plain text when the browser has no setHTML", () => {
        withoutSetHTML();

        const screen = render(SanitizedHtml, {
            props: { html: `<img src="x" alt="pic" onerror="x()">hi` },
        });

        expect(screen.getByText(`<img src="x" alt="pic" onerror="x()">hi`)).toBeVisible();
        expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });
});
