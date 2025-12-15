// Global test setup
// This file is run before each test file

import { beforeEach } from "vitest";

// Ensure LocalStorage-based adapters start from a clean state for browser tests.
// Remove only the keys used by LocalStorageAdapter so other globals are preserved.
beforeEach(() => {
    try {
        if (typeof localStorage !== "undefined") {
            localStorage.removeItem("arisutalk_chats");
            localStorage.removeItem("arisutalk_characters");
            localStorage.removeItem("arisutalk_settings");
        }
    } catch {
        // ignore in non-browser environments
    }
});
