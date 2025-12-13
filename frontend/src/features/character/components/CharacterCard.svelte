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
</script>

<div
    class="card bg-base-100 shadow-xl compact border border-base-content/10 group hover:border-primary transition-all duration-300"
>
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
