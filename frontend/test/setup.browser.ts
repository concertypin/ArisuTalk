// Setup for the `browser` project: jest-dom matchers, and stand-ins for what jsdom lacks and the components use.
import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";
import { installSetHTMLPolyfill } from "@/lib/polyfills/setHTML";

// <dialog> methods only toggle `open`: no top layer, and Escape does not close.
HTMLDialogElement.prototype.show = function show(this: HTMLDialogElement): void {
    this.setAttribute("open", "");
};
HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement): void {
    this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close = function close(
    this: HTMLDialogElement,
    returnValue?: string
): void {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    if (returnValue !== undefined) this.returnValue = returnValue;
    this.dispatchEvent(new Event("close"));
};

// jsdom fires `submit` but does not implement `form method="dialog"`: close the dialog like a browser.
window.addEventListener("submit", (event) => {
    const form = event.target;
    if (event.defaultPrevented || !(form instanceof HTMLFormElement) || form.method !== "dialog")
        return;
    event.preventDefault();
    const submitter = event.submitter;
    form.closest("dialog")?.close(
        submitter instanceof HTMLButtonElement ? submitter.value : undefined
    );
});

// jsdom has no `Element.setHTML`, so components render through the polyfill. `test/setup.ts` runs
// first and records the missing native method before this installs it.
await installSetHTMLPolyfill();

let objectUrlCount = 0;
URL.createObjectURL = () => `blob:jsdom/${++objectUrlCount}`;
URL.revokeObjectURL = () => undefined;

// A browser downloads an `<a download>` click; jsdom would try to navigate to it instead.
window.addEventListener("click", (event) => {
    const link = event.target;
    if (link instanceof HTMLAnchorElement && link.hasAttribute("download")) event.preventDefault();
});

// In-memory OPFS root with only what `OpFSAssetStorageAdapter` uses.
const opfsFiles = new Map<string, File>();
beforeEach(() => opfsFiles.clear());

function notFound(): DOMException {
    return new DOMException("File not found", "NotFoundError");
}

const opfsRoot = {
    kind: "directory",
    name: "",
    async getFileHandle(name: string, options?: { create?: boolean }) {
        if (!opfsFiles.has(name)) {
            if (!options?.create) throw notFound();
            opfsFiles.set(name, new File([], name));
        }
        return {
            kind: "file",
            name,
            async getFile() {
                const file = opfsFiles.get(name);
                if (!file) throw notFound();
                return file;
            },
            async createWritable() {
                return {
                    async write(data: Blob) {
                        opfsFiles.set(name, new File([data], name));
                    },
                    async close() {},
                };
            },
        };
    },
    async removeEntry(name: string) {
        if (!opfsFiles.delete(name)) throw notFound();
    },
};

Object.defineProperty(navigator, "storage", {
    configurable: true,
    value: { getDirectory: async () => opfsRoot },
});
