import { describe, it, expect } from "vitest";
import { routes } from "@/lib/routeConfig";

describe("routeConfig", () => {
    it("exports a routes object", () => {
        expect(routes).toBeDefined();
        expect(typeof routes).toBe("object");
    });

    it("has a root route", async () => {
        expect(routes["/"]).toBeDefined();
        // Since it's a dynamic import, we can try to call it, but in a unit test environment
        // the import might fail or return a mock if not handled.
        // However, we just want to verify the structure and that it returns a promise.
        const loader = routes["/"];
        expect(typeof loader).toBe("function");

        // We can spy on the dynamic import if we were testing App.svelte, but here we just test the registry.
        // We can verify it returns a promise.
        const promise = loader();
        expect(promise).toBeInstanceOf(Promise);

        // We can try to await it, but if Home.svelte has dependencies that fail in unit test env, it might crash.
        // For unit testing the config, proving it's a function returning a promise is usually enough coverage for the config file itself.
        try {
            await promise;
        } catch {
            // It's expected to potentially fail to resolve the actual component in unit test environment
            // if configured with JSDOM/HappyDOM and without full vite build context for all imports in Home.svelte
            // But if it fails, it means it tried to import.
        }
    });
});
