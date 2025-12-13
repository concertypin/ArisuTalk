<script lang="ts">
    import { Plus } from "@lucide/svelte";
    import CharacterSidebarItem from "./CharacterSidebarItem.svelte";
    import { characterStore } from "../stores/characterStore.svelte";

    interface Props {
        selectedCharacterId: string | null;
        onSelect: (id: string) => void;
        onAdd: () => void;
    }

    let { selectedCharacterId, onSelect, onAdd }: Props = $props();
</script>

<div
    class="flex flex-col items-center w-[72px] bg-base-300 py-3 overflow-y-auto h-full scrollbar-none"
>
    {#each characterStore.characters as character (character.id || character.name)}
        <CharacterSidebarItem
            {character}
            active={selectedCharacterId === (character.id || character.name)}
            onClick={() => onSelect(character.id || character.name)}
        />
    {/each}

    <div class="divider mx-2 my-2"></div>

    <div class="tooltip tooltip-right z-50" data-tip="Add Character">
        <button
            class="group flex items-center justify-center w-12 h-12 rounded-3xl hover:rounded-xl bg-base-200 hover:bg-success text-success hover:text-white transition-all duration-200"
            onclick={onAdd}
            aria-label="Add Character"
        >
            <Plus size={24} />
        </button>
    </div>
</div>
