/**
 * @fileoverview `Element.setHTML` polyfill for browsers without the HTML Sanitizer API, backed by DOMPurify.
 */
import type DOMPurify from "dompurify";
// Also brings in the global `Element.setHTML` declaration, which the TypeScript DOM lib lacks.
import type { SanitizerConfigDictionary, SetHTMLOptions } from "@/lib/types/sanitizer";

/** A DOMPurify instance. */
type Purifier = typeof DOMPurify;

/** Sanitizes markup with one config. It returns the result as a fragment. */
type SanitizeFn = (html: string) => DocumentFragment;

/** The attribute names a config allows, on every element and on each one. */
type Allowlists = {
    /** Attributes allowed on every element. */
    globalAttributes: Set<string>;
    /** Attributes allowed on one element only, by element name. */
    elementAttributes: Map<string, Set<string>>;
};

/** Elements that the native `setHTML` removes whatever the config allows. */
const ALWAYS_REMOVED_ELEMENTS = ["script", "frame", "iframe", "embed", "object", "use"];

/**
 * The URL allowlist for attributes: a copy of DOMPurify's `IS_ALLOWED_URI` (3.x, `src/regexp.ts`,
 * not exported) with `blob` added to its scheme list, because the native `setHTML` allows `blob:`.
 */
const ALLOWED_URI =
    /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix|blob):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i;

/** Sanitize functions by config object, so each config gets its own DOMPurify instance and hook. */
const sanitizeFnByConfig = new WeakMap<SanitizerConfigDictionary, SanitizeFn>();

/** Reads which attributes the config allows, on every element and on each one. */
function readAllowlists(config: SanitizerConfigDictionary): Allowlists {
    const globalAttributes = new Set(config.attributes);
    const elementAttributes = new Map<string, Set<string>>();
    for (const element of config.elements) {
        if (typeof element === "string") {
            elementAttributes.set(element, new Set());
        } else {
            elementAttributes.set(element.name, new Set(element.attributes));
        }
    }
    return { globalAttributes, elementAttributes };
}

/**
 * Makes DOMPurify drop the attributes that are not allowed on their own element.
 * DOMPurify only has one flat attribute list for all elements, so this hook narrows it down.
 * @param purifier The DOMPurify instance to hook. The hook belongs to one config alone.
 * @param allowlists The attributes the config allows.
 * @param allowData Whether every `data-*` attribute is allowed.
 */
function addPerElementAttributeHook(
    purifier: Purifier,
    { globalAttributes, elementAttributes }: Allowlists,
    allowData: boolean
): void {
    function isAttributeAllowed(node: Element, name: string): boolean {
        // Event handlers (`onclick`, ...) never pass, even when the config lists them.
        if (name.startsWith("on")) return false;
        if (allowData && name.startsWith("data-")) return true;
        return (
            globalAttributes.has(name) || elementAttributes.get(node.localName)?.has(name) === true
        );
    }

    purifier.addHook("uponSanitizeAttribute", (node, event) => {
        if (isAttributeAllowed(node, event.attrName)) return;
        event.keepAttr = false;
        event.forceKeepAttr = false;
    });
}

/**
 * Creates the function that sanitizes markup with a config.
 * @param purifier The DOMPurify instance to use. Its hook belongs to this config alone.
 * @param config The config dictionary passed as `options.sanitizer`.
 */
function createSanitizeFn(purifier: Purifier, config: SanitizerConfigDictionary): SanitizeFn {
    const allowlists = readAllowlists(config);
    const allowData = config.dataAttributes === true;
    addPerElementAttributeHook(purifier, allowlists, allowData);

    const allowedAttributes = new Set(allowlists.globalAttributes);
    for (const attributes of allowlists.elementAttributes.values()) {
        for (const name of attributes) allowedAttributes.add(name);
    }
    const allowedTags = [
        // Text nodes are only kept when they are listed here (or KEEP_CONTENT is on).
        "#text",
        ...allowlists.elementAttributes.keys(),
    ];
    return (html) =>
        purifier.sanitize(html, {
            ALLOWED_TAGS: allowedTags,
            ALLOWED_ATTR: [...allowedAttributes],
            ALLOWED_URI_REGEXP: ALLOWED_URI,
            FORBID_TAGS: ALWAYS_REMOVED_ELEMENTS,
            ALLOW_DATA_ATTR: allowData,
            ALLOW_ARIA_ATTR: false,
            KEEP_CONTENT: false,
            RETURN_DOM_FRAGMENT: true,
        });
}

/**
 * Installs `Element.prototype.setHTML` backed by DOMPurify when the browser has no native one.
 * DOMPurify is only fetched when the polyfill is needed, so await this before the app mounts.
 *
 * Like the native method, it removes elements that are not listed together with their content, and
 * attributes that are not listed globally or on their element. It always removes `<script>`,
 * `<iframe>`, `<frame>`, `<embed>`, `<object>`, `<use>`, event handler attributes and `javascript:`
 * URLs. It differs in two ways: URL attributes follow DOMPurify's URL policy plus `blob:`, so the
 * native sanitizer may let more schemes through, and the HTML is parsed as the children of `<body>`.
 */
export async function installSetHTMLPolyfill(): Promise<void> {
    if ("setHTML" in Element.prototype) return;

    const { default: DOMPurify } = await import("dompurify");

    Object.defineProperty(Element.prototype, "setHTML", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: function setHTML(this: Element, html: string, options: SetHTMLOptions): void {
            let sanitize = sanitizeFnByConfig.get(options.sanitizer);
            if (!sanitize) {
                sanitize = createSanitizeFn(DOMPurify(window), options.sanitizer);
                sanitizeFnByConfig.set(options.sanitizer, sanitize);
            }
            this.replaceChildren(sanitize(html));
        },
    });
}
