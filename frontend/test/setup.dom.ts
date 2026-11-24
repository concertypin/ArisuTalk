// Setup for the jsdom component tests (the `dom` project). Runs after `test/setup.ts`.
//
// Testing Library's auto cleanup is added by the `svelteTesting()` Vite plugin (see
// `scripts/testConfig.ts`). The jsdom gaps below are filled only as far as the components under
// test need them. jsdom does no layout and no painting, so behavior that depends on either is
// tested through classes and attributes instead.

import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";

// jsdom implements the `open` attribute of <dialog> but not `show()`, `showModal()` or `close()`.
// Components (StickerPicker, the settings modals, ...) call `showModal()` from an effect. This
// stand-in only toggles `open` and fires `close`. Differences from a browser, so that no test
// mistakes a passing result here for proof of the real behavior:
// - There is no top layer and no `inert` on the rest of the page: a "modal" dialog does not block
//   or hide anything behind it, and focus is not trapped or moved into it.
// - Escape does not fire `cancel` and does not close the dialog, and a submit of a
//   `<form method="dialog">` does not close it either. Tests that need either must call `close()`
//   (or dispatch the event) themselves.
// - `close` is dispatched synchronously inside `close()`. Browsers queue it as a task, so code that
//   relies on the event arriving after `close()` has returned is not exercised.
// jsdom does evaluate the `open` attribute through its built-in dialog styles, so `toBeVisible()`
// on a dialog (or on something inside it) does tell whether `showModal()`/`show()` was called.
if (typeof HTMLDialogElement !== "undefined") {
    const dialogProto = HTMLDialogElement.prototype;
    if (typeof dialogProto.show !== "function") {
        dialogProto.show = function show(this: HTMLDialogElement): void {
            this.setAttribute("open", "");
        };
    }
    if (typeof dialogProto.showModal !== "function") {
        dialogProto.showModal = function showModal(this: HTMLDialogElement): void {
            this.setAttribute("open", "");
        };
    }
    if (typeof dialogProto.close !== "function") {
        dialogProto.close = function close(this: HTMLDialogElement, returnValue?: string): void {
            if (!this.hasAttribute("open")) return;
            this.removeAttribute("open");
            if (returnValue !== undefined) this.returnValue = returnValue;
            this.dispatchEvent(new Event("close"));
        };
    }
}

// jsdom has no `URL.createObjectURL` / `revokeObjectURL` (it cannot render blobs). Export and avatar
// code create object URLs for downloads and previews. Tests that check them spy on these stubs.
// The stub returns the same constant URL for every blob, so it cannot tell two blobs apart: a test
// that must distinguish URLs (one per file, revoking the right one) has to mock the function with
// distinct return values itself.
if (typeof URL.createObjectURL !== "function") {
    URL.createObjectURL = () => "blob:jsdom-stub";
}
if (typeof URL.revokeObjectURL !== "function") {
    URL.revokeObjectURL = () => undefined;
}

// jsdom has no Origin Private File System (`navigator.storage`). The real `OpFSAssetStorageAdapter`
// opens it as soon as a character settings page mounts. This is a small in-memory stand-in for the
// part the adapter uses: a flat directory of files with `getFileHandle`, `removeEntry`, `getFile` and
// `createWritable`. Adapter-level tests stub `navigator` themselves and are not affected.
// The files live in one map for the whole test file and are emptied before every test, so a test
// never sees files another test wrote, whatever the order.
if (!("storage" in navigator)) {
    const files = new Map<string, File>();
    beforeEach(() => {
        files.clear();
    });
    const root = {
        kind: "directory",
        name: "",
        async getFileHandle(name: string, options?: { create?: boolean }) {
            if (!files.has(name)) {
                if (!options?.create) throw new DOMException("File not found", "NotFoundError");
                files.set(name, new File([], name));
            }
            return {
                kind: "file",
                name,
                async getFile() {
                    const file = files.get(name);
                    if (!file) throw new DOMException("File not found", "NotFoundError");
                    return file;
                },
                async createWritable() {
                    return {
                        async write(data: Blob) {
                            files.set(name, new File([data], name));
                        },
                        async close() {},
                    };
                },
            };
        },
        async removeEntry(name: string) {
            if (!files.delete(name)) throw new DOMException("File not found", "NotFoundError");
        },
    };
    Object.defineProperty(navigator, "storage", {
        configurable: true,
        value: { getDirectory: async () => root },
    });
}
