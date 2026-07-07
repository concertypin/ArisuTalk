/**
 * @fileoverview Tests for the memory plugin.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CharacterPlugin } from "@/lib/plugins/types";
import type { Character } from "@arisutalk/character-spec/v0/Character";

const mockAddMemory = vi.fn();
const mockLoadMemories = vi.fn();

vi.mock("@/features/memory/stores/memoryStore.svelte", () => ({
    memoryStore: {
        addMemory: mockAddMemory,
        loadMemories: mockLoadMemories,
        memories: [],
        memoryCount: 0,
    },
}));

describe.concurrent("memoryPlugin", () => {
    let plugin: CharacterPlugin;

    beforeEach(async () => {
        vi.clearAllMocks();
        const mod = await import("@/features/memory/memoryPlugin");
        plugin = mod.memoryPlugin;
    });

    it("should have correct metadata", () => {
        expect(plugin.meta.id).toBe("arisutalk.memory");
        expect(plugin.meta.name).toBe("Character Memory");
        expect(plugin.meta.version).toBe("1.0.0");
    });

    it("onInitialize should complete successfully", async () => {
        await expect(plugin.onInitialize?.()).resolves.toBeUndefined();
    });

    it("onCharacterActivate should load memories for the character", async () => {
        const char = { id: "char-1", name: "Test" } as Character;
        await plugin.onCharacterActivate?.(char);
        expect(mockLoadMemories).toHaveBeenCalledWith("char-1");
    });

    it("onCharacterChange should load memories for the new character", async () => {
        const char = { id: "char-2", name: "Test2" } as Character;
        await plugin.onCharacterChange?.(char);
        expect(mockLoadMemories).toHaveBeenCalledWith("char-2");
    });

    it("onAIResponse should store the response as conversation memory", async () => {
        const char = { id: "char-1", name: "Test" } as Character;
        await plugin.onAIResponse?.("Hello from AI", { character: char });
        expect(mockAddMemory).toHaveBeenCalledWith("Hello from AI", "conversation", 0.5);
    });
});
