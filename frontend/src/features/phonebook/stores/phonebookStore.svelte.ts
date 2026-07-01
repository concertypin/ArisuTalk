/**
 * @fileoverview Store managing connection to the Phonebook character-sharing platform.
 *
 * Phonebook is a community platform for sharing and discovering character cards.
 * This store manages connectivity to the Phonebook backend and provides methods
 * for uploading, searching, and importing characters.
 *
 * Authentication is handled via Clerk (optional) — the store integrates with
 * the Clerk auth system through `setTokenProvider`.
 */

import { post, get, setTokenProvider } from "@/lib/api/client";
import { characterStore } from "@/features/character/stores/characterStore.svelte";
import { Logger } from "@common/logger/Logger";
import type { Character } from "@arisutalk/character-spec/v0/Character";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PhonebookState = "idle" | "connecting" | "connected" | "error";

export interface PhonebookEntry {
    id: string;
    name: string;
    description: string;
    authorId?: string;
    downloads: number;
    rating: number;
    characterId: string;
    createdAt: string;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

class PhonebookStore {
    // -- reactive state -----------------------------------------------------
    connection = $state<PhonebookState>("idle");
    error = $state<string | null>(null);
    featuredCharacters = $state<PhonebookEntry[]>([]);
    searchResults = $state<PhonebookEntry[]>([]);
    isSearching = $state(false);
    isPublishing = $state(false);

    // -- internals ----------------------------------------------------------
    private healthTimer: ReturnType<typeof setInterval> | null = null;

    /** Health-check interval in ms (30 s). */
    private static readonly HEALTH_INTERVAL_MS = 30_000;

    /**
     * Initialise the phonebook store.
     *
     * @param clerkTokenProvider - An async function that returns a Clerk JWT.
     * Should be provided once the Clerk client is ready.
     */
    init(clerkTokenProvider: () => Promise<string | null>): void {
        if (this.healthTimer) return; // already initialised

        setTokenProvider(clerkTokenProvider);

        this.healthTimer = setInterval(() => {
            this.checkConnectivity().catch(() => {
                /* handled inside */
            });
        }, PhonebookStore.HEALTH_INTERVAL_MS);

        this.checkConnectivity().catch(() => {
            /* handled inside */
        });

        Logger.info("[PhonebookStore] Initialised");
    }

    /**
     * Destroy the store — clears intervals and resets state.
     */
    destroy(): void {
        if (this.healthTimer) {
            clearInterval(this.healthTimer);
            this.healthTimer = null;
        }
        this.connection = "idle";
        this.error = null;
        Logger.info("[PhonebookStore] Destroyed");
    }

    // -- connectivity -------------------------------------------------------

    /**
     * Check connectivity to the Phonebook backend.
     * Updates `connection` state reactively.
     */
    async checkConnectivity(): Promise<void> {
        try {
            const res = await get("/");
            if (res.ok) {
                if (this.connection === "error" || this.connection === "idle") {
                    this.connection = "connected";
                    this.error = null;
                }
            } else if (this.connection === "connected") {
                this.connection = "error";
                this.error = res.error ?? "Connection lost";
            }
        } catch (err) {
            if (this.connection === "connected") {
                this.connection = "error";
                this.error = err instanceof Error ? err.message : "Connection failed";
            }
        }
    }

    /**
     * Attempt to connect to the Phonebook backend.
     */
    async connect(): Promise<void> {
        if (this.connection === "connecting" || this.connection === "connected") return;
        this.connection = "connecting";
        this.error = null;

        await this.checkConnectivity();

        // checkConnectivity transitions to "connected" or "error" from "connecting"
        // Use String() to widen the type and avoid TS2367 from property narrowing
        const state = String(this.connection);
        if (state !== "connected") {
            this.connection = "error";
            this.error = this.error || "Failed to connect";
        }
    }

    /**
     * Disconnect from the backend.
     */
    disconnect(): void {
        if (this.healthTimer) {
            clearInterval(this.healthTimer);
            this.healthTimer = null;
        }
        this.connection = "idle";
        this.error = null;
        Logger.info("[PhonebookStore] Disconnected");
    }

    // -- character sharing --------------------------------------------------

    /**
     * Publish a character to the Phonebook platform.
     * @param character - The character to publish.
     * @throws If the backend request fails.
     */
    async publishCharacter(character: Character): Promise<void> {
        if (this.connection !== "connected") {
            throw new Error("Not connected to Phonebook");
        }

        this.isPublishing = true;
        try {
            const res = await post("/api/characters", character);
            if (!res.ok) {
                throw new Error(res.error ?? "Failed to publish character");
            }
            Logger.structured("phonebook.character.publish", {
                characterId: character.id,
                name: character.name,
            });
        } finally {
            this.isPublishing = false;
        }
    }

    /**
     * Fetch featured characters from the Phonebook platform.
     */
    async fetchFeatured(): Promise<void> {
        if (this.connection !== "connected") return;

        try {
            const res = await get<PhonebookEntry[]>("/api/characters/featured");
            if (res.ok && res.data) {
                this.featuredCharacters = res.data;
            }
        } catch (err) {
            Logger.warn("[PhonebookStore] Failed to fetch featured", err);
        }
    }

    /**
     * Search for characters on the Phonebook platform.
     * @param query - The search query string.
     */
    async search(query: string): Promise<void> {
        if (this.connection !== "connected") return;

        this.isSearching = true;
        try {
            const res = await get<PhonebookEntry[]>(
                `/api/characters/search?q=${encodeURIComponent(query)}`
            );
            if (res.ok && res.data) {
                this.searchResults = res.data;
            }
        } catch (err) {
            Logger.warn("[PhonebookStore] Search failed", err);
            this.searchResults = [];
        } finally {
            this.isSearching = false;
        }
    }

    /**
     * Import a character from the Phonebook by its entry ID.
     * Downloads the character data and adds it to the local character store.
     * @param entryId - The Phonebook entry ID to import.
     * @throws If download or import fails.
     */
    async importCharacter(entryId: string): Promise<void> {
        if (this.connection !== "connected") {
            throw new Error("Not connected to Phonebook");
        }

        const res = await get<{ character: Character }>(`/api/characters/${entryId}/download`);
        if (!res.ok) {
            throw new Error(String(res.error ?? "Failed to download character"));
        }
        if (!res.data) {
            throw new Error("Failed to download character");
        }

        await characterStore.add(res.data.character);
        Logger.structured("phonebook.character.import", {
            entryId,
            characterId: res.data.character.id,
        });
    }
}

export const phonebookStore = new PhonebookStore();
