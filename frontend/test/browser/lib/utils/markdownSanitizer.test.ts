import { describe, test, expect, beforeEach, onTestFinished } from "vitest";
import { page } from "vitest/browser";
import type { SanitizerConfigDictionary } from "@/lib/types/sanitizer";
import { MARKDOWN_SANITIZER } from "@/lib/utils/markdownSanitizer";
import { parseMarkdown } from "@/lib/utils/markdown";
import {
    callSetHTML,
    hasNativeSetHTML,
    withNativeSetHTML,
    withPolyfilledSetHTML,
} from "@test/utils/setHTML";

/** Runs `html` through `setHTML` and returns the element that received it. */
function renderSanitized(html: string, sanitizer: SanitizerConfigDictionary = MARKDOWN_SANITIZER) {
    const host = document.createElement("div");
    document.body.append(host);
    onTestFinished(() => host.remove());
    callSetHTML(host, html, { sanitizer });
    return host;
}

// The same expectations run on the polyfill and on the native sanitizer, so the two stay in
// agreement. The tests replace `Element.prototype.setHTML`, so they must stay serial.
describe.each<{ name: string; prepare: () => void | Promise<void>; supported: boolean }>([
    { name: "polyfilled", prepare: withPolyfilledSetHTML, supported: true },
    { name: "native", prepare: withNativeSetHTML, supported: hasNativeSetHTML },
])("markdown allowlist on the $name setHTML", ({ prepare, supported }) => {
    beforeEach(async ({ skip }) => {
        if (!supported) skip("this browser has no native setHTML");
        await prepare();
    });

    test("keeps an image with its src, alt and title", async () => {
        const host = renderSanitized(`<img src="/a.png" alt="a cat" title="Tom">`);

        const image = page.elementLocator(host).getByRole("img", { name: "a cat" });

        await expect.element(image).toHaveAttribute("src", "/a.png");
        await expect.element(image).toHaveAttribute("title", "Tom");
    });

    test("keeps blob: and data: image URLs", async () => {
        const blobUrl = "blob:https://arisutalk.test/0b1c9a52";
        const dataUrl = "data:image/png;base64,iVBORw0KGgo=";
        const host = renderSanitized(
            `<img src="${blobUrl}" alt="blob"><img src="${dataUrl}" alt="data">`
        );

        const root = page.elementLocator(host);

        await expect
            .element(root.getByRole("img", { name: "blob" }))
            .toHaveAttribute("src", blobUrl);
        await expect
            .element(root.getByRole("img", { name: "data" }))
            .toHaveAttribute("src", dataUrl);
    });

    test("keeps task-list checkboxes with their checked and disabled state", async () => {
        const host = renderSanitized(
            `<ul><li><input checked="" disabled="" type="checkbox"> done</li>` +
                `<li><input disabled="" type="checkbox"> todo</li></ul>`
        );

        const boxes = page.elementLocator(host).getByRole("checkbox");

        await expect.element(boxes.first()).toBeChecked();
        await expect.element(boxes.first()).toBeDisabled();
        await expect.element(boxes.last()).not.toBeChecked();
        await expect.element(boxes.last()).toBeDisabled();
    });

    test("keeps link, list-start and table-alignment attributes", async () => {
        const host = renderSanitized(
            `<a href="https://example.com" title="Example">site</a>` +
                `<ol start="3"><li>three</li></ol>` +
                `<table><tbody><tr><td align="right">cell</td></tr></tbody></table>`
        );

        const root = page.elementLocator(host);

        await expect
            .element(root.getByRole("link", { name: "site" }))
            .toHaveAttribute("href", "https://example.com");
        await expect.element(root.getByRole("list")).toHaveAttribute("start", "3");
        await expect.element(root.getByRole("cell")).toHaveAttribute("align", "right");
    });

    test("drops class and style, so untrusted text cannot borrow the app's styling", async () => {
        const host = renderSanitized(
            `<p class="fixed inset-0 z-50 bg-base-100" style="position:fixed">overlay</p>` +
                `<img src="/a.png" alt="pic" class="fixed" style="width:9999px">`
        );

        const root = page.elementLocator(host);
        const paragraph = root.getByText("overlay");
        const image = root.getByRole("img", { name: "pic" });

        await expect.element(paragraph).not.toHaveAttribute("class");
        await expect.element(paragraph).not.toHaveAttribute("style");
        await expect.element(image).not.toHaveAttribute("class");
        await expect.element(image).not.toHaveAttribute("style");
    });

    test("keeps an attribute only on the elements that list it", async () => {
        const host = renderSanitized(
            `<a href="https://example.com" src="/a.png">link</a>` +
                `<p href="https://example.com" align="left">para</p>` +
                `<img src="/a.png" alt="pic" href="https://example.com">`
        );

        const root = page.elementLocator(host);
        const link = root.getByRole("link", { name: "link" });
        const paragraph = root.getByText("para");
        const image = root.getByRole("img", { name: "pic" });

        await expect.element(link).toHaveAttribute("href");
        await expect.element(link).not.toHaveAttribute("src");
        await expect.element(paragraph).not.toHaveAttribute("href");
        await expect.element(paragraph).not.toHaveAttribute("align");
        await expect.element(image).toHaveAttribute("src");
        await expect.element(image).not.toHaveAttribute("href");
    });

    test("removes elements that are not on the list together with their content", () => {
        const host = renderSanitized(
            `<p>kept</p><form action="/steal"><button>send</button></form>` +
                `<style>body { display: none }</style><iframe src="/frame"></iframe>`
        );

        expect(host.innerHTML).toBe("<p>kept</p>");
    });

    test("removes data attributes and comments", async () => {
        const host = renderSanitized(`<p data-role="admin">text<!-- secret --></p>`);

        await expect
            .element(page.elementLocator(host).getByText("text"))
            .not.toHaveAttribute("data-role");
        expect(host.innerHTML).not.toContain("secret");
    });

    test("removes scripts, event handlers and javascript: URLs even when listed", async () => {
        const permissive = {
            elements: ["script", "iframe", "img", { name: "a", attributes: ["href"] }],
            attributes: ["src", "alt", "onerror", "onclick"],
        } satisfies SanitizerConfigDictionary;
        const host = renderSanitized(
            `<img src="/a.png" alt="pic" onerror="window.__xss = 1" onclick="window.__xss = 2">` +
                `<script>window.__xss = 3</script><iframe src="/frame"></iframe>` +
                `<a href="javascript:window.__xss = 4">link</a>`,
            permissive
        );

        const root = page.elementLocator(host);
        const image = root.getByRole("img", { name: "pic" });

        await expect.element(image).toHaveAttribute("src");
        await expect.element(image).not.toHaveAttribute("onerror");
        await expect.element(image).not.toHaveAttribute("onclick");
        await expect.element(root.getByText("link")).not.toHaveAttribute("href");
        expect(host.innerHTML).not.toMatch(/script|iframe/);
    });

    describe("with parseMarkdown output", () => {
        test("keeps the link and the image", async () => {
            const host = renderSanitized(
                parseMarkdown("[site](https://example.com) ![a cat](/a.png)")
            );

            const root = page.elementLocator(host);

            await expect
                .element(root.getByRole("link", { name: "site" }))
                .toHaveAttribute("href", "https://example.com");
            await expect
                .element(root.getByRole("img", { name: "a cat" }))
                .toHaveAttribute("src", "/a.png");
        });

        test("keeps the task-list checkboxes", async () => {
            const host = renderSanitized(parseMarkdown("- [x] done\n- [ ] todo"));

            const boxes = page.elementLocator(host).getByRole("checkbox");

            await expect.element(boxes.first()).toBeChecked();
            await expect.element(boxes.last()).not.toBeChecked();
        });

        test("keeps the table column alignment", async () => {
            const host = renderSanitized(parseMarkdown("| a | b |\n|:--|--:|\n| 1 | 2 |"));

            const root = page.elementLocator(host);

            await expect
                .element(root.getByRole("cell", { name: "1" }))
                .toHaveAttribute("align", "left");
            await expect
                .element(root.getByRole("cell", { name: "2" }))
                .toHaveAttribute("align", "right");
        });

        test("keeps headings and strikethrough", async () => {
            const host = renderSanitized(parseMarkdown("# Title\n\n~~gone~~"));

            const root = page.elementLocator(host);

            await expect.element(root.getByRole("heading", { name: "Title" })).toBeVisible();
            await expect.element(root.getByRole("deletion")).toHaveTextContent("gone");
        });

        test("shows an unknown tag as text instead of swallowing it", async () => {
            const host = renderSanitized(parseMarkdown("<thinking>plan</thinking>"));

            await expect
                .element(page.elementLocator(host).getByText("<thinking>plan</thinking>"))
                .toBeVisible();
        });

        test("shows generic type arguments as text", async () => {
            const host = renderSanitized(
                parseMarkdown("A `Vec<T>` holds items, and so does Vec<T>.")
            );

            await expect
                .element(page.elementLocator(host).getByText("and so does Vec<T>."))
                .toBeVisible();
        });
    });
});
