// Global test setup
// This file is run before each test file

import { beforeEach, vi } from "vitest";
import { createLocalStorageMock } from "@test/utils/localStorageMock";
// Keep this a static import: loading it records the browser's own `setHTML`, and that has to
// happen before the polyfill is installed at the bottom of this file.
import "@test/utils/setHTML";

// Ensure LocalStorage-based adapters start from a clean state for component and adapter tests.
// Remove only the keys used by LocalStorageAdapter so other globals are preserved.
beforeEach(() => {
    try {
        if (typeof localStorage === "undefined" || typeof localStorage.clear !== "function") {
            vi.stubGlobal("localStorage", createLocalStorageMock(vi));
        }

        if (typeof localStorage !== "undefined") {
            localStorage.removeItem("arisutalk_chats");
            localStorage.removeItem("arisutalk_characters");
            localStorage.removeItem("arisutalk_settings");
            localStorage.removeItem("arisutalk_personas");
            localStorage.removeItem("arisutalk_active_persona");
            localStorage.removeItem("arisutalk_persona_order");
        }

        // Prevent native dialogs that block thread and degrade UX
        if (typeof window !== "undefined") {
            window.alert = () => {
                throw new Error(
                    "strict mode violation: window.alert() is banned as it degrades UX. Use custom Modal or Toast UI instead."
                );
            };
            window.confirm = () => {
                throw new Error(
                    "strict mode violation: window.confirm() is banned as it degrades UX. Use custom Modal or Toast UI instead."
                );
            };
            window.prompt = () => {
                throw new Error(
                    "strict mode violation: window.prompt() is banned as it degrades UX. Use custom Modal or Toast UI instead."
                );
            };
        }
    } catch {
        // ignore in environments without a window
    }
});
