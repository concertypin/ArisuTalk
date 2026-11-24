// Setup for the `browser` project: jest-dom matchers, and stand-ins for what jsdom lacks and the components use.
import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";

// <dialog> methods only toggle `open`: no top layer, and Escape or `form method="dialog"` does not close.
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

let objectUrlCount = 0;
URL.createObjectURL = () => `blob:jsdom/${++objectUrlCount}`;
URL.revokeObjectURL = () => undefined;

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
