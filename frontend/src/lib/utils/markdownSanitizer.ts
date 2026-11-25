/**
 * @fileoverview The `setHTML` allowlist for rendered markdown.
 */
import type { SanitizerConfigDictionary } from "@/lib/types/sanitizer";

/**
 * What the sanitizer lets through when rendering markdown: the elements that `marked` emits for
 * GFM. Raw HTML in the text is escaped by `@/lib/utils/markdown` before it gets here.
 *
 * Decisions:
 * - Images and GFM task-list checkboxes are allowed. External image URLs are loaded on purpose.
 * - `class` and `style` are never allowed. Untrusted text could otherwise use the app's own
 *   Tailwind/DaisyUI classes to draw fake UI over the real one.
 * - Data attributes and comments are dropped, and so is every element that is not listed.
 *
 * Both the native `Element.setHTML` and the polyfill in `@/lib/polyfills/setHTML` read this object.
 */
export const MARKDOWN_SANITIZER = {
    elements: [
        // Block structure
        "p",
        "br",
        "hr",
        "blockquote",
        "pre",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        // Inline formatting
        "strong",
        "em",
        "del",
        "code",
        // Lists. `start` is emitted for ordered lists that do not begin at 1.
        "ul",
        { name: "ol", attributes: ["start"] },
        "li",
        // Tables. `align` is emitted for column alignment.
        "table",
        "thead",
        "tbody",
        "tr",
        { name: "th", attributes: ["align"] },
        { name: "td", attributes: ["align"] },
        // Links, images and task-list checkboxes
        { name: "a", attributes: ["href", "title"] },
        { name: "img", attributes: ["src", "alt", "title"] },
        { name: "input", attributes: ["type", "checked", "disabled"] },
    ],
    // Without a global `attributes` list, setHTML switches to "remove attributes" mode and keeps
    // every attribute that is not unsafe.
    attributes: [],
    comments: false,
    dataAttributes: false,
} as const satisfies SanitizerConfigDictionary;
