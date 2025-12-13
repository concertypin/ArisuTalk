<script lang="ts">
    import { personaStore } from "../stores/personaStore.svelte";
    import type { Persona } from "../schema";
    import { Trash2, Edit, Plus, User } from "@lucide/svelte";

    interface Props {
        onEdit: (persona: Persona) => void;
    }

    let { onEdit }: Props = $props();

    function handleDelete(id: string) {
        if (confirm("Delete this persona?")) {
            personaStore.remove(id);
        }
    }
</script>

<div class="flex flex-col gap-2">
    {#each personaStore.personas as persona (persona.id)}
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
                        {#if persona.profileAsset}
                            <!-- todo: resolve asset url -->
                            <span class="text-xs">IMG</span>
                        {:else}
                            <span class="text-xs">{persona.name.slice(0, 2).toUpperCase()}</span>
                        {/if}
                    </div>
                </div>
                <div>
                    <div class="font-bold">{persona.name}</div>
                    <div class="text-xs opacity-70 line-clamp-1">{persona.description}</div>
                </div>
            </div>

            <div class="flex gap-1" role="group" onclick={(e) => e.stopPropagation()}>
                <button class="btn btn-ghost btn-xs btn-square" onclick={() => onEdit(persona)}>
                    <Edit size={14} />
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
