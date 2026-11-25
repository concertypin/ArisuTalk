/**
 * @fileoverview Types for the part of the HTML Sanitizer API that the app uses.
 * TypeScript's DOM lib does not declare `Element.setHTML` or `SanitizerConfig` yet, so they are
 * declared here, following https://developer.mozilla.org/en-US/docs/Web/API/SanitizerConfig.
 * Importing this module also adds the global `Element.setHTML` to the whole program.
 */

/**
 * The sanitizer config that `setHTML` accepts here. The native `setHTML` accepts more (remove
 * lists, namespaces, comments), but the app only uses this subset, and the polyfill in
 * `@/lib/polyfills/setHTML` implements nothing else.
 */
export type SanitizerConfigDictionary = {
    /** Elements to allow, each optionally with its own attributes. Everything else is removed. */
    elements: readonly (string | { name: string; attributes?: readonly string[] })[];
    /** Attributes allowed on every element. An empty list is fine. */
    attributes: readonly string[];
    /** Whether all `data-*` attributes are allowed. */
    dataAttributes?: boolean;
    /** Comments are always removed. Pass `false` so the native default cannot keep them. */
    comments?: false;
};

/** The second argument of `Element.setHTML`. */
export type SetHTMLOptions = {
    sanitizer: SanitizerConfigDictionary;
};

declare global {
    interface Element {
        /**
         * Parses `html`, sanitizes it and replaces the children of the element with the result.
         * Missing in browsers without the HTML Sanitizer API, until the polyfill is installed.
         * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML
         */
        setHTML?(html: string, options: SetHTMLOptions): void;
    }
}
