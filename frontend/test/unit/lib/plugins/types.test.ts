/**
 * @fileoverview Tests for the plugin system.
 */

import { describe, it, expect, vi } from "vitest";
import {
    registerPlugin,
    unregisterPlugin,
    getPlugins,
    getPlugin,
    setPluginEnabled,
    initializePlugins,
    dispatchCharacterActivate,
    dispatchCharacterChange,
    dispatchBeforeMessageSend,
    dispatchAIResponse,
} from "@/lib/plugins/types";
import type { CharacterPlugin, PluginMeta } from "@/lib/plugins/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const testMeta: PluginMeta = {
    id: "test.plugin",
    name: "Test Plugin",
    version: "1.0.0",
    description: "A test plugin.",
};

function createMockPlugin(overrides: Partial<CharacterPlugin> = {}): CharacterPlugin {
    return {
        meta: testMeta,
        onInitialize: vi.fn(),
        onCharacterActivate: vi.fn(),
        onCharacterChange: vi.fn(),
        onBeforeMessageSend: vi.fn((msg: string) => Promise.resolve(msg)),
        onAIResponse: vi.fn(),
        onDispose: vi.fn(),
        ...overrides,
    };
}

const emptyCharacter = {
    id: "char-1",
    name: "Test",
    description: "",
    specVersion: "v0",
    assets: { avatar: [], assets: [] },
    prompt: { description: "", authorsNote: "" },
    meta: {
        created: Date.now(),
        updated: Date.now(),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

const emptyMessage = { id: "msg-1", chatId: "chat-1", role: "user" as const, content: "Hello", timestamp: Date.now() };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Plugin System", () => {
    afterEach(() => {
        // Clean up: remove all test plugins
        const plugins = getPlugins();
        for (const p of plugins) {
            if (p.plugin.meta.id.startsWith("test.")) {
                unregisterPlugin(p.plugin.meta.id);
            }
        }
    });

    describe("registerPlugin / getPlugin", () => {
        it("should register a plugin and retrieve it by ID", () => {
            const plugin = createMockPlugin();
            registerPlugin(plugin);

            const retrieved = getPlugin("test.plugin");
            expect(retrieved).toBe(plugin);
        });

        it("should ignore duplicate registrations", () => {
            const p1 = createMockPlugin();
            const p2 = createMockPlugin();
            registerPlugin(p1);
            registerPlugin(p2);

            const retrieved = getPlugin("test.plugin");
            expect(retrieved).toBe(p1);
        });

        it("should return undefined for unknown IDs", () => {
            expect(getPlugin("nonexistent")).toBeUndefined();
        });
    });

    describe("unregisterPlugin", () => {
        it("should remove a registered plugin", () => {
            const plugin = createMockPlugin();
            registerPlugin(plugin);
            unregisterPlugin("test.plugin");

            expect(getPlugin("test.plugin")).toBeUndefined();
        });
    });

    describe("getPlugins", () => {
        it("should return all registered plugins", () => {
            const p1 = createMockPlugin({ meta: { ...testMeta, id: "test.one" } });
            const p2 = createMockPlugin({ meta: { ...testMeta, id: "test.two" } });
            registerPlugin(p1);
            registerPlugin(p2);

            const all = getPlugins();
            expect(all).toHaveLength(2);
            expect(all.map((r) => r.plugin.meta.id)).toContain("test.one");
            expect(all.map((r) => r.plugin.meta.id)).toContain("test.two");
        });

        it("should include enabled status", () => {
            registerPlugin(createMockPlugin(), false);
            const [entry] = getPlugins();
            expect(entry.enabled).toBe(false);
        });
    });

    describe("setPluginEnabled", () => {
        it("should toggle a plugin's enabled state", () => {
            const plugin = createMockPlugin();
            registerPlugin(plugin);
            setPluginEnabled("test.plugin", false);

            const [entry] = getPlugins();
            expect(entry.enabled).toBe(false);
        });
    });

    describe("initializePlugins", () => {
        it("should call onInitialize for all enabled plugins", async () => {
            const p1 = createMockPlugin();
            const p2 = createMockPlugin({ meta: { ...testMeta, id: "test.two" } });
            registerPlugin(p1);
            registerPlugin(p2);

            await initializePlugins();

            expect(p1.onInitialize).toHaveBeenCalledOnce();
            expect(p2.onInitialize).toHaveBeenCalledOnce();
        });

        it("should skip disabled plugins", async () => {
            const plugin = createMockPlugin();
            registerPlugin(plugin, false);

            await initializePlugins();

            expect(plugin.onInitialize).not.toHaveBeenCalled();
        });
    });

    describe("dispatchCharacterActivate", () => {
        it("should call onCharacterActivate on enabled plugins", async () => {
            const plugin = createMockPlugin();
            registerPlugin(plugin);

            await dispatchCharacterActivate(emptyCharacter);

            expect(plugin.onCharacterActivate).toHaveBeenCalledWith(emptyCharacter);
        });

        it("should skip disabled plugins", async () => {
            const plugin = createMockPlugin();
            registerPlugin(plugin, false);

            await dispatchCharacterActivate(emptyCharacter);

            expect(plugin.onCharacterActivate).not.toHaveBeenCalled();
        });
    });

    describe("dispatchCharacterChange", () => {
        it("should call onCharacterChange on enabled plugins", async () => {
            const plugin = createMockPlugin();
            registerPlugin(plugin);

            await dispatchCharacterChange(emptyCharacter);

            expect(plugin.onCharacterChange).toHaveBeenCalledWith(emptyCharacter);
        });
    });

    describe("dispatchBeforeMessageSend", () => {
        it("should call onBeforeMessageSend and return the result", async () => {
            const plugin = createMockPlugin({
                onBeforeMessageSend: vi.fn((msg: string) => Promise.resolve(`modified: ${msg}`)),
            });
            registerPlugin(plugin);

            const result = await dispatchBeforeMessageSend("hello", {
                character: emptyCharacter,
                history: [emptyMessage],
            });

            expect(result).toBe("modified: hello");
        });

        it("should chain multiple plugins", async () => {
            const p1 = createMockPlugin({
                meta: { ...testMeta, id: "test.one" },
                onBeforeMessageSend: vi.fn((msg: string) => Promise.resolve(`[A]${msg}`)),
            });
            const p2 = createMockPlugin({
                meta: { ...testMeta, id: "test.two" },
                onBeforeMessageSend: vi.fn((msg: string) => Promise.resolve(`[B]${msg}`)),
            });
            registerPlugin(p1);
            registerPlugin(p2);

            const result = await dispatchBeforeMessageSend("hello", {
                character: emptyCharacter,
                history: [emptyMessage],
            });

            // p1 runs first, then p2 gets p1's output
            expect(result).toBe("[B][A]hello");
        });
    });

    describe("dispatchAIResponse", () => {
        it("should call onAIResponse on enabled plugins", async () => {
            const plugin = createMockPlugin();
            registerPlugin(plugin);

            await dispatchAIResponse("response text", { character: emptyCharacter });

            expect(plugin.onAIResponse).toHaveBeenCalledWith("response text", {
                character: emptyCharacter,
            });
        });
    });
});
