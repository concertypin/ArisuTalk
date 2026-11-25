import { describe, test, expect, expectTypeOf, beforeEach, onTestFinished } from "vitest";
import { page } from "vitest/browser";
import { installSetHTMLPolyfill } from "@/lib/polyfills/setHTML";
import type { SanitizerConfigDictionary } from "@/lib/types/sanitizer";
import {
    callSetHTML,
    withoutSetHTML,
    withPolyfilledSetHTML,
    withStubbedSetHTML,
} from "@test/utils/setHTML";

/** Creates an element that is attached to the page, so locators can find what is inside it. */
function createHost() {
    const host = document.createElement("div");
    document.body.append(host);
    onTestFinished(() => host.remove());
    return host;
}

describe("installSetHTMLPolyfill", () => {
    test("leaves a browser that already has setHTML alone", async () => {
        const existing = withStubbedSetHTML();

        await installSetHTMLPolyfill();

        expect(Element.prototype.setHTML).toBe(existing);
    });

    test("defines setHTML when the browser lacks it", async () => {
        withoutSetHTML();

        await installSetHTMLPolyfill();

        expect(Element.prototype.setHTML).toBeTypeOf("function");
    });

    test("keeps the method it installed on a second call", async () => {
        withoutSetHTML();
        await installSetHTMLPolyfill();
        const installed = Element.prototype.setHTML;

        await installSetHTMLPolyfill();

        expect(Element.prototype.setHTML).toBe(installed);
    });
});

describe("the polyfilled setHTML", () => {
    beforeEach(withPolyfilledSetHTML);

    test("allows data attributes when the config asks for them", async () => {
        const host = createHost();

        callSetHTML(host, `<p data-id="7">text</p>`, {
            sanitizer: { elements: ["p"], attributes: [], dataAttributes: true },
        });

        await expect
            .element(page.elementLocator(host).getByText("text"))
            .toHaveAttribute("data-id", "7");
    });

    test("replaces the existing children", () => {
        const host = document.createElement("div");
        host.textContent = "old";

        callSetHTML(host, "<p>new</p>", { sanitizer: { elements: ["p"], attributes: [] } });

        expect(host.innerHTML).toBe("<p>new</p>");
    });

    test("keeps the per-element attributes of one config out of another", async () => {
        const linkWithHref = { elements: [{ name: "a", attributes: ["href"] }], attributes: [] };
        const linkWithTitle = { elements: [{ name: "a", attributes: ["title"] }], attributes: [] };
        const html = `<a href="/x" title="t">link</a>`;
        const first = createHost();
        const second = createHost();
        const firstAgain = createHost();

        callSetHTML(first, html, { sanitizer: linkWithHref });
        callSetHTML(second, html, { sanitizer: linkWithTitle });
        callSetHTML(firstAgain, html, { sanitizer: linkWithHref });

        for (const [host, kept, dropped] of [
            [first, "href", "title"],
            [second, "title", "href"],
            [firstAgain, "href", "title"],
        ] as const) {
            const link = page.elementLocator(host).getByText("link");
            await expect.element(link).toHaveAttribute(kept);
            await expect.element(link).not.toHaveAttribute(dropped);
        }
    });
});

describe("SanitizerConfigDictionary", () => {
    // The polyfill has no runtime check for unsupported configs: the compiler rejects them, so
    // the type must not grow a field (such as `removeElements`) that the polyfill ignores.
    test("is limited to what the polyfill implements", () => {
        expectTypeOf<SanitizerConfigDictionary>().toEqualTypeOf<{
            elements: readonly (string | { name: string; attributes?: readonly string[] })[];
            attributes: readonly string[];
            dataAttributes?: boolean;
            comments?: false;
        }>();
    });
});
