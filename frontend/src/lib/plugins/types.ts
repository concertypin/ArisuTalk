/**
 * @fileoverview Plugin system types for ArisuTalk.
 * Defines the interfaces that first- and third-party plugins implement
 * to hook into the application lifecycle.
 *
 * @remarks
 * Plugins allow users to extend or replace core behaviours without
 * modifying the application itself.  The built-in memory system is
 * shipped as a first-party plugin — it can be swapped out, customised,
 * or completely removed by the user.
 */

import type { Character } from "@arisutalk/character-spec/v0/Character";
import type { Message } from "@arisutalk/character-spec/v0/Character/Message";

// ---------------------------------------------------------------------------
// Plugin definition
// ---------------------------------------------------------------------------

/** Unique identifier for a plugin.  Use reverse-domain notation. */
export type PluginId = string;

/** Metadata describing a plugin. */
export interface PluginMeta {
    id: PluginId;
    name: string;
    version: string;
    description: string;
    /** URL to the plugin's homepage or repository. */
    url?: string;
    /** Author name or handle. */
    author?: string;
}

/**
 * Lifecycle hooks a plugin can implement.
 * All hooks are optional — a plugin only implements what it needs.
 */
export interface CharacterPlugin {
    /** Plugin metadata (shown in the UI). */
    meta: PluginMeta;

    // -- Lifecycle hooks ------------------------------------------------

    /**
     * Called once when the plugin is first registered.
     * Use this for one-time setup (e.g. opening a database connection).
     */
    onInitialize?(): Promise<void>;

    /**
     * Called when a character is loaded into the active view.
     * @param character — the character being activated.
     */
    onCharacterActivate?(character: Character): Promise<void>;

    /**
     * Called when the active character is switched.
     * @param character — the newly active character.
     */
    onCharacterChange?(character: Character): Promise<void>;

    /**
     * Called before a message is sent to the LLM.
     * Plugins can modify the message or context.
     * @param message — the message about to be sent.
     * @param context — additional context (character, history).
     */
    onBeforeMessageSend?(
        message: string,
        context: { character: Character; history: Message[] }
    ): Promise<string>;

    /**
     * Called after an AI response is received.
     * @param response — the AI response.
     * @param context — additional context.
     */
    onAIResponse?(response: string, context: { character: Character }): Promise<void>;

    /**
     * Called when a chat is created or switched.
     * @param chatId — the active chat ID.
     */
    onChatChange?(chatId: string): Promise<void>;

    /**
     * Cleanup when the plugin is unloaded.
     */
    onDispose?(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/** Current state of a registered plugin. */
export interface PluginRegistration {
    plugin: CharacterPlugin;
    enabled: boolean;
}

const registry = new Map<PluginId, PluginRegistration>();

/**
 * Register a plugin with the application.
 * Duplicate IDs are silently ignored.
 *
 * @param plugin — the plugin instance.
 * @param enabled — whether the plugin starts enabled (default true).
 */
export function registerPlugin(plugin: CharacterPlugin, enabled = true): void {
    if (registry.has(plugin.meta.id)) {
        // Duplicate — skip silently.
        return;
    }
    registry.set(plugin.meta.id, { plugin, enabled });
}

/**
 * Unregister a previously registered plugin.
 * @param id — the plugin ID to remove.
 */
export function unregisterPlugin(id: PluginId): void {
    registry.delete(id);
}

/**
 * Get all registered plugins.
 */
export function getPlugins(): PluginRegistration[] {
    return Array.from(registry.values());
}

/**
 * Get a plugin by ID.
 * @param id — the plugin ID.
 */
export function getPlugin(id: PluginId): CharacterPlugin | undefined {
    return registry.get(id)?.plugin;
}

/**
 * Enable or disable a registered plugin.
 * @param id — the plugin ID.
 * @param enabled — new enabled state.
 */
export function setPluginEnabled(id: PluginId, enabled: boolean): void {
    const entry = registry.get(id);
    if (entry) {
        entry.enabled = enabled;
    }
}

/**
 * Initialise all registered plugins.
 * Calls `onInitialize()` for each plugin and collects results.
 */
export async function initializePlugins(): Promise<void> {
    const results = await Promise.allSettled(
        Array.from(registry.values()).map(async (entry) => {
            if (entry.enabled && entry.plugin.onInitialize) {
                await entry.plugin.onInitialize();
            }
        })
    );

    for (const result of results) {
        if (result.status === "rejected") {
            console.warn("[Plugins] Plugin initialisation failed", result.reason);
        }
    }
}

// ---------------------------------------------------------------------------
// Dispatch helpers
// ---------------------------------------------------------------------------

/**
 * Dispatch `onCharacterActivate` to all enabled plugins.
 */
export async function dispatchCharacterActivate(character: Character): Promise<void> {
    await Promise.all(
        Array.from(registry.values()).map(async (entry) => {
            if (entry.enabled && entry.plugin.onCharacterActivate) {
                await entry.plugin.onCharacterActivate(character);
            }
        })
    );
}

/**
 * Dispatch `onCharacterChange` to all enabled plugins.
 */
export async function dispatchCharacterChange(character: Character): Promise<void> {
    await Promise.all(
        Array.from(registry.values()).map(async (entry) => {
            if (entry.enabled && entry.plugin.onCharacterChange) {
                await entry.plugin.onCharacterChange(character);
            }
        })
    );
}

/**
 * Dispatch `onBeforeMessageSend` to all enabled plugins.
 * Each plugin can transform the message; the final result is returned.
 */
export async function dispatchBeforeMessageSend(
    message: string,
    context: { character: Character; history: Message[] }
): Promise<string> {
    let current = message;
    for (const entry of registry.values()) {
        if (entry.enabled && entry.plugin.onBeforeMessageSend) {
            current = await entry.plugin.onBeforeMessageSend(current, context);
        }
    }
    return current;
}

/**
 * Dispatch `onAIResponse` to all enabled plugins.
 */
export async function dispatchAIResponse(
    response: string,
    context: { character: Character }
): Promise<void> {
    await Promise.all(
        Array.from(registry.values()).map(async (entry) => {
            if (entry.enabled && entry.plugin.onAIResponse) {
                await entry.plugin.onAIResponse(response, context);
            }
        })
    );
}
