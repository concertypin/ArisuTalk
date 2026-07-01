/**
 * @fileoverview First-party memory plugin.
 * Wraps the built-in character memory system into a CharacterPlugin
 * so it can be customised, replaced, or disabled by the user.
 *
 * @remarks
 * This is the reference implementation for the plugin system.
 * Users who want a different memory approach (e.g. vector-store-based
 * retrieval) can swap this out or layer their own plugin alongside it.
 */

import type { Character } from "@arisutalk/character-spec/v0/Character";
import type { CharacterPlugin, PluginMeta } from "@/lib/plugins/types";
import { memoryStore } from "@/features/memory/stores/memoryStore.svelte";
import { Logger } from "@common/logger/Logger";

const META: PluginMeta = {
    id: "arisutalk.memory",
    name: "Character Memory",
    version: "1.0.0",
    description:
        "Per-character memory with importance-ranked recall and automatic " +
        "summary generation.  Ships as a first-party plugin.",
    url: "https://github.com/concertypin/ArisuTalk",
    author: "ArisuTalk Team",
};

/**
 * First-party memory plugin.
 * Listens to character activation events and loads/stores memories.
 */
export const memoryPlugin: CharacterPlugin = {
    meta: META,

    async onInitialize(): Promise<void> {
        // MemoryStore is already initialised as a singleton.
        Logger.structured("plugin.memory.initialized", {});
    },

    async onCharacterActivate(character: Character): Promise<void> {
        await memoryStore.loadMemories(character.id);
        Logger.structured("plugin.memory.characterActivated", {
            characterId: character.id,
            memoryCount: memoryStore.memoryCount,
        });
    },

    async onCharacterChange(character: Character): Promise<void> {
        await memoryStore.loadMemories(character.id);
    },

    async onAIResponse(response: string, context: { character: Character }): Promise<void> {
        // Store AI responses as conversation memories automatically.
        await memoryStore.addMemory(response, "conversation", 0.5);
    },
};
