<!--
@component PhonebookPanel
Phonebook community panel: connection status and character sharing platform access.
Phonebook is a platform for sharing and discovering character cards.
-->
<script lang="ts">
    import { Logger } from "@common/logger/Logger";
    import CloudCheck from "phosphor-svelte/lib/CloudCheckIcon";
    import CloudSlash from "phosphor-svelte/lib/CloudSlashIcon";
    import CircleNotch from "phosphor-svelte/lib/CircleNotchIcon";
    import WarningCircle from "phosphor-svelte/lib/WarningCircleIcon";
    import Plugs from "phosphor-svelte/lib/PlugsIcon";
    import PlugsConnected from "phosphor-svelte/lib/PlugsConnectedIcon";
    import UploadSimple from "phosphor-svelte/lib/UploadSimpleIcon";
    import MagnifyingGlass from "phosphor-svelte/lib/MagnifyingGlassIcon";

    import { phonebookStore } from "../stores/phonebookStore.svelte";
    import { characterStore } from "@/features/character/stores/characterStore.svelte";

    let selectedCharacterId = $state<string | null>(null);
    let searchQuery = $state("");

    // --- connection helpers --------------------------------------------------

    let badgeClass = $derived.by(() => {
        switch (phonebookStore.connection) {
            case "connected":
                return "badge-success";
            case "connecting":
                return "badge-warning";
            case "error":
                return "badge-error";
            default:
                return "badge-ghost";
        }
    });

    let connectionLabel = $derived.by(() => {
        switch (phonebookStore.connection) {
            case "connected":
                return "Connected";
            case "connecting":
                return "Connecting…";
            case "error":
                return "Error";
            default:
                return "Idle";
        }
    });

    // --- actions ------------------------------------------------------------

    async function handlePublish() {
        if (!selectedCharacterId) return;
        const character = characterStore.characters.find((c) => c.id === selectedCharacterId);
        if (!character) return;

        try {
            await phonebookStore.publishCharacter(character);
        } catch (err) {
            // Error is handled internally; re-throw for UI feedback if needed
            Logger.error("Failed to publish character:", err);
        }
    }

    async function handleSearch() {
        if (!searchQuery.trim()) return;
        await phonebookStore.search(searchQuery);
    }
</script>

<div class="flex flex-col gap-4">
    <!-- Header -->
    <div class="flex items-center gap-2">
        <CloudCheck size={22} class="text-primary" />
        <h2 class="text-lg font-bold">Phonebook Community</h2>
    </div>

    <!-- Connection status card -->
    <div class="card bg-base-200">
        <div class="card-body p-4 gap-3">
            <h3 class="card-title text-sm font-semibold flex items-center gap-2">
                <PlugsConnected size={18} />
                Connection
            </h3>

            <div class="flex items-center gap-3">
                <span class="badge {badgeClass} gap-1">
                    {#if phonebookStore.connection === "connecting"}
                        <CircleNotch size={14} class="animate-spin" />
                    {:else}
                        <span class="flex items-center gap-1">
                            {#if phonebookStore.connection === "connected"}
                                <CloudCheck size={14} />
                            {:else if phonebookStore.connection === "error"}
                                <WarningCircle size={14} />
                            {:else}
                                <CloudSlash size={14} />
                            {/if}
                            {connectionLabel}
                        </span>
                    {/if}
                </span>

                {#if phonebookStore.error}
                    <span class="text-xs text-error flex items-center gap-1">
                        <WarningCircle size={14} />
                        {phonebookStore.error}
                    </span>
                {/if}
            </div>

            {#if phonebookStore.connection === "connected"}
                <button class="btn btn-outline btn-sm" onclick={() => phonebookStore.disconnect()}>
                    <Plugs size={16} />
                    Disconnect
                </button>
            {:else}
                <button
                    class="btn btn-primary btn-sm"
                    onclick={() => phonebookStore.connect()}
                    disabled={phonebookStore.connection === "connecting"}
                >
                    <PlugsConnected size={16} />
                    Connect
                </button>
            {/if}
        </div>
    </div>

    <!-- Publish character card -->
    <div class="card bg-base-200">
        <div class="card-body p-4 gap-3">
            <h3 class="card-title text-sm font-semibold flex items-center gap-2">
                <UploadSimple size={18} />
                Share Character
            </h3>

            <select
                class="select select-bordered select-sm w-full"
                bind:value={selectedCharacterId}
            >
                <option value={null}>Select a character to share...</option>
                {#each characterStore.characters as char (char.id)}
                    <option value={char.id}>{char.name}</option>
                {/each}
            </select>

            <button
                class="btn btn-primary btn-sm"
                onclick={handlePublish}
                disabled={!selectedCharacterId ||
                    phonebookStore.isPublishing ||
                    phonebookStore.connection !== "connected"}
            >
                {#if phonebookStore.isPublishing}
                    <CircleNotch size={16} class="animate-spin" />
                {:else}
                    <UploadSimple size={16} />
                {/if}
                Publish to Phonebook
            </button>
        </div>
    </div>

    <!-- Search card -->
    <div class="card bg-base-200">
        <div class="card-body p-4 gap-3">
            <h3 class="card-title text-sm font-semibold flex items-center gap-2">
                <MagnifyingGlass size={18} />
                Discover Characters
            </h3>

            <div class="flex gap-2">
                <input
                    type="text"
                    class="input input-bordered input-sm flex-1"
                    placeholder="Search characters..."
                    bind:value={searchQuery}
                    onkeydown={(e) => {
                        if (e.key === "Enter") void handleSearch();
                    }}
                />
                <button
                    class="btn btn-primary btn-sm"
                    onclick={handleSearch}
                    disabled={phonebookStore.isSearching || !searchQuery.trim()}
                >
                    <MagnifyingGlass size={16} />
                    Search
                </button>
            </div>

            {#if phonebookStore.searchResults.length > 0}
                <div class="space-y-2 mt-2">
                    {#each phonebookStore.searchResults as entry (entry.id)}
                        <div class="flex items-center justify-between p-2 bg-base-100 rounded-lg">
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium truncate">{entry.name}</p>
                                <p class="text-xs text-base-content/60 truncate">
                                    {entry.description}
                                </p>
                            </div>
                            <button
                                class="btn btn-ghost btn-xs"
                                onclick={() => phonebookStore.importCharacter(entry.id)}
                            >
                                Import
                            </button>
                        </div>
                    {/each}
                </div>
            {:else if phonebookStore.isSearching}
                <div class="flex items-center justify-center p-4">
                    <CircleNotch size={20} class="animate-spin text-base-content/40" />
                </div>
            {/if}
        </div>
    </div>
</div>
