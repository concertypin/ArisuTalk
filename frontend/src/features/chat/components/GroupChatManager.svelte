<script lang="ts">
    import { characterStore } from "../../character/stores/characterStore.svelte";

    type Props = {
        selectedIds: string[];
        onToggle: (characterId: string) => void;
        onCreate: () => void;
        onClose: () => void;
    };

    let { selectedIds, onToggle, onCreate, onClose }: Props = $props();

    let selectedCharacters = $derived(
        characterStore.characters.filter((c) => selectedIds.includes(c.id))
    );

    let availableCharacters = $derived(
        characterStore.characters.filter((c) => !selectedIds.includes(c.id))
    );

    function getInitials(name: string): string {
        return name.substring(0, 2).toUpperCase();
    }
</script>

<div class="p-6">
    <h3 class="font-bold text-lg mb-2">Create Group Chat</h3>
    <p class="text-sm text-base-content/60 mb-6">Select characters to include in the group chat.</p>

    <!-- Selected Participants -->
    {#if selectedCharacters.length > 0}
        <div class="mb-4">
            <h4 class="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-2">
                Participants ({selectedCharacters.length})
            </h4>
            <div class="flex flex-wrap gap-2">
                {#each selectedCharacters as char (char.id)}
                    <div class="badge badge-primary gap-1 p-3">
                        {#if char.avatarUrl}
                            <img
                                src={char.avatarUrl}
                                alt={char.name}
                                class="w-4 h-4 rounded-full object-cover"
                            />
                        {:else}
                            <span class="text-xs font-bold">{getInitials(char.name)}</span>
                        {/if}
                        <span>{char.name}</span>
                        <button
                            class="ml-1 hover:text-error transition-colors"
                            onclick={() => onToggle(char.id)}
                            aria-label="Remove {char.name}"
                        >
                            ✕
                        </button>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Available Characters Grid -->
    <div class="overflow-y-auto max-h-80">
        {#if selectedCharacters.length === 0}
            <h4 class="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-2">
                Select Characters
            </h4>
        {:else if availableCharacters.length > 0}
            <h4 class="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-2">
                Add More
            </h4>
        {/if}

        {#if availableCharacters.length > 0}
            <div class="grid grid-cols-2 gap-2">
                {#each availableCharacters as char (char.id)}
                    <button
                        class="flex items-center gap-3 px-3 py-2 rounded-lg border border-base-300 hover:border-primary hover:bg-base-200 transition-all text-left"
                        onclick={() => onToggle(char.id)}
                    >
                        <div class="avatar">
                            <div
                                class="w-8 h-8 rounded-full bg-base-300 flex items-center justify-center overflow-hidden"
                            >
                                {#if char.avatarUrl}
                                    <img
                                        src={char.avatarUrl}
                                        alt={char.name}
                                        class="w-full h-full object-cover"
                                    />
                                {:else}
                                    <span class="text-xs font-bold">{getInitials(char.name)}</span>
                                {/if}
                            </div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium truncate">{char.name}</p>
                            {#if char.description}
                                <p class="text-xs text-base-content/50 truncate">
                                    {char.description}
                                </p>
                            {/if}
                        </div>
                    </button>
                {/each}
            </div>
        {:else if characterStore.characters.length === 0}
            <div class="text-center p-8 opacity-60">
                <p class="text-sm">No characters available.</p>
                <p class="text-xs mt-1">Create some characters first.</p>
            </div>
        {:else}
            <div class="text-center p-8 opacity-60">
                <p class="text-sm">All characters selected!</p>
            </div>
        {/if}
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-2 mt-6 pt-4 border-t border-base-300">
        <button class="btn btn-ghost" onclick={onClose}> Cancel </button>
        <button class="btn btn-primary" onclick={onCreate} disabled={selectedIds.length < 2}>
            Create Group Chat
        </button>
    </div>
</div>
