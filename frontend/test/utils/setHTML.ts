import { onTestFinished, vi } from "vitest";
import { installSetHTMLPolyfill } from "@/lib/polyfills/setHTML";

/**
 * The `setHTML` property of `Element.prototype` as the browser shipped it, or `undefined` when the
 * browser has no HTML Sanitizer API. `test/setup.ts` imports this module before it installs the
 * polyfill, so the value is read while the prototype is still untouched.
 */
const nativeSetHTML =
    typeof Element === "undefined"
        ? undefined
        : Object.getOwnPropertyDescriptor(Element.prototype, "setHTML");

/** Whether the browser has the HTML Sanitizer API. */
export const hasNativeSetHTML = nativeSetHTML !== undefined;

/** Puts `Element.prototype.setHTML` back the way it is now, after the current test. */
function restoreSetHTMLAfterTest() {
    const before = Object.getOwnPropertyDescriptor(Element.prototype, "setHTML");
    onTestFinished(() => {
        if (before) Object.defineProperty(Element.prototype, "setHTML", before);
        else Reflect.deleteProperty(Element.prototype, "setHTML");
    });
}

/**
 * Removes `Element.prototype.setHTML` for the current test, as in a browser without the API.
 * The previous state is restored when the test finishes.
 */
export function withoutSetHTML() {
    restoreSetHTMLAfterTest();
    Reflect.deleteProperty(Element.prototype, "setHTML");
}

/**
 * Replaces `Element.prototype.setHTML` with a mock for the current test.
 * The previous state is restored when the test finishes.
 * @returns The mock. It writes its input as `sanitized:<html>` so the output is easy to tell apart.
 */
export function withStubbedSetHTML() {
    restoreSetHTMLAfterTest();
    const setHTML = vi.fn(function (this: Element, html: string) {
        this.textContent = `sanitized:${html}`;
    });
    Object.defineProperty(Element.prototype, "setHTML", {
        configurable: true,
        writable: true,
        value: setHTML,
    });
    return setHTML;
}

/**
 * Makes `Element.prototype.setHTML` the browser's own method for the current test.
 * The previous state is restored when the test finishes.
 * @throws {Error} When the browser has no native `setHTML`.
 */
export function withNativeSetHTML() {
    if (!nativeSetHTML) throw new Error("This browser has no native setHTML");
    restoreSetHTMLAfterTest();
    Object.defineProperty(Element.prototype, "setHTML", nativeSetHTML);
}

/**
 * Makes `Element.prototype.setHTML` the polyfill for the current test.
 * The previous state is restored when the test finishes.
 */
export async function withPolyfilledSetHTML() {
    withoutSetHTML();
    await installSetHTMLPolyfill();
}

/**
 * Calls the current `setHTML` of `element`. Unlike `element.setHTML(...)`, it fails the test with
 * a clear error when `setHTML` is missing, instead of needing `?.`.
 */
export function callSetHTML(
    element: Element,
    ...args: Parameters<NonNullable<Element["setHTML"]>>
) {
    if (!element.setHTML) throw new Error("Element.prototype.setHTML is not defined");
    element.setHTML(...args);
}
