<script lang="ts">
    import { personaStore } from "../stores/personaStore.svelte";
    import { type IAssetStorageAdapter, IfNotExistBehavior } from "@/lib/interfaces";
    import { OpFSAssetStorageAdapter } from "@/features/character/adapters/assetStorage/OpFSAssetStorageAdapter";
    import type { Persona } from "../schema";
    import { Trash2, SquarePen } from "@lucide/svelte";

    interface Props {
        onEdit: (persona: Persona) => void;
    }

    let { onEdit }: Props = $props();

    function handleDelete(id: string) {
        if (confirm("Delete this persona?")) {
            personaStore.remove(id);
        }
    }
    let personas = $derived(personaStore.personas);
    $effect(() => {
        // Auto-select first persona if none selected
        if (!personaStore.activePersonaId && personaStore.personas.length > 0) {
            personaStore.select(personaStore.personas[0].id);
        }
    });
    $effect(() => {
        // Deselect persona if it was deleted
        if (
            personaStore.activePersonaId &&
            !personaStore.personas.find((p) => p.id === personaStore.activePersonaId)
        ) {
            personaStore.select(null);
        }
    });

    const assetAdapter: IAssetStorageAdapter = new OpFSAssetStorageAdapter();
    async function getProfileAssetUrl(persona: Persona): Promise<string | null> {
        if (persona.profileAsset) {
            return assetAdapter.getAssetUrl(
                new URL(persona.profileAsset),
                IfNotExistBehavior.RETURN_NULL
            );
        }
        return null;
    }
</script>

<div class="flex flex-col gap-2">
    {#each personas as persona (persona.id)}
        <div
            class="flex items-center justify-between p-3 bg-base-100 rounded-lg border border-base-200 hover:border-primary transition-colors cursor-pointer"
            class:border-primary={personaStore.activePersonaId === persona.id}
            onclick={() => personaStore.select(persona.id)}
            role="button"
            tabindex="0"
            onkeydown={(e) => e.key === "Enter" && personaStore.select(persona.id)}
        >
            <div class="flex items-center gap-3">
                <div class="avatar placeholder">
                    <div class="bg-neutral text-neutral-content rounded-full w-10">
                        {#await getProfileAssetUrl(persona)}
                            <span class="text-xs">{persona.name.slice(0, 2).toUpperCase()}</span>
                        {:then url}
                            {#if url}
                                <img
                                    src={url}
                                    alt={persona.name}
                                    class="w-full h-full object-cover"
                                />
                            {:else}
                                <span class="text-xs">{persona.name.slice(0, 2).toUpperCase()}</span
                                >
                            {/if}
                        {:catch}
                            <span class="text-xs">{persona.name.slice(0, 2).toUpperCase()}</span>
                        {/await}
                    </div>
                </div>
                <div>
                    <div class="font-bold">{persona.name}</div>
                    <div class="text-xs opacity-70 line-clamp-1">{persona.description}</div>
                </div>
            </div>

            <!-- This is not interactive trigger, but bubble stopper. -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <div class="flex gap-1" role="group" onclick={(e) => e.stopPropagation()}>
                <button class="btn btn-ghost btn-xs btn-square" onclick={() => onEdit(persona)}>
                    <SquarePen size={14} />
                </button>
                <button
                    class="btn btn-ghost btn-xs btn-square text-error"
                    onclick={() => handleDelete(persona.id)}
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    {/each}

    {#if personaStore.personas.length === 0}
        <div class="text-center p-4 opacity-50 text-sm">No personas created yet.</div>
    {/if}
</div>
