<script lang="ts">
    import type { Character } from "@arisutalk/character-spec/v0/Character";
    import { Trash2, Edit, Download } from "@lucide/svelte";

    interface Props {
        character: Character;
        onEdit: () => void;
        onDelete: () => void;
        onExport: () => void;
    }
    let { character, onEdit, onDelete, onExport }: Props = $props();

    let avatarUrl = $derived.by(() => {
        return character.avatarUrl || "";
    });
</script>

<div
    class="card bg-base-100 shadow-xl compact border border-base-content/10 group hover:border-primary transition-all duration-300 h-full"
>
    {#if avatarUrl}
        <figure class="px-4 pt-4">
            <div class="avatar w-full h-48 rounded-xl overflow-hidden bg-base-200">
                <img src={avatarUrl} alt={character.name} class="w-full h-full object-cover" />
            </div>
        </figure>
    {:else}
        <figure class="px-4 pt-4">
            <div
                class="w-full h-48 rounded-xl bg-neutral text-neutral-content flex items-center justify-center text-4xl font-bold"
            >
                {character.name.substring(0, 2).toUpperCase()}
            </div>
        </figure>
    {/if}
    <div class="card-body">
        <h2 class="card-title text-primary">
            {character.name}
        </h2>
        <p class="line-clamp-3 text-sm opacity-70">
            {character.description || "No description provided."}
        </p>
        <div
            class="card-actions justify-end mt-4 opacity-0 group-hover:opacity-100 transition-opacity"
        >
            <button class="btn btn-ghost btn-xs" onclick={onExport} aria-label="Export">
                <Download size={16} />
            </button>
            <button class="btn btn-ghost btn-xs" onclick={onEdit} aria-label="Edit">
                <Edit size={16} />
            </button>
            <button class="btn btn-ghost btn-xs text-error" onclick={onDelete} aria-label="Delete">
                <Trash2 size={16} />
            </button>
        </div>
    </div>
</div>
