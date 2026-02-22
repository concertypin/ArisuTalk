<script lang="ts">
    import Plus from "phosphor-svelte/lib/Plus";
    import User from "phosphor-svelte/lib/User";
    import Gear from "phosphor-svelte/lib/Gear";
    import House from "phosphor-svelte/lib/House";
    import { flip } from "svelte/animate";
    import CharacterSidebarItem from "./CharacterSidebarItem.svelte";
    import { characterStore } from "../stores/characterStore.svelte";
    import { uiState } from "@/lib/stores/ui.svelte";

    type Props = {
        selectedCharacterId: string | null;
        onSelect: (id: string | null) => void;
        onAdd: () => void;
        onPersona: () => void;
    };

    const { selectedCharacterId, onSelect, onAdd, onPersona }: Props = $props();

    const flipDurationMs = 200;

    /** Currently dragged item index */
    let draggedIndex = $state<number | null>(null);
    /** Drop target index */
    let dropTargetIndex = $state<number | null>(null);

    function handleDragStart(e: DragEvent, index: number) {
        draggedIndex = index;
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", String(index));
        }
    }

    function handleDragOver(e: DragEvent, index: number) {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== index) {
            dropTargetIndex = index;
        }
    }

    function handleDragLeave() {
        dropTargetIndex = null;
    }

    function handleDrop(e: DragEvent, toIndex: number) {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== toIndex) {
            characterStore.reorder(draggedIndex, toIndex);
        }
        draggedIndex = null;
        dropTargetIndex = null;
    }

    function handleDragEnd() {
        draggedIndex = null;
        dropTargetIndex = null;
    }
</script>

<div
    class="flex flex-col items-center w-18 bg-base-300 py-3 overflow-y-auto overflow-x-hidden h-full scrollbar-none"
>
    <!-- Home Button -->
    <div class="mb-2 tooltip tooltip-right z-50" data-tip="Home">
        <button
            class="flex items-center justify-center w-12 h-12 rounded-3xl hover:rounded-xl bg-base-200 hover:bg-accent text-accent hover:text-white transition-all duration-200"
            onclick={() => onSelect(null)}
            aria-label="Home"
        >
            <House size={24} weight={selectedCharacterId === null ? "fill" : "bold"} />
        </button>
    </div>

    <div class="flex flex-col items-center gap-1 w-full" role="listbox" aria-label="Characters">
        {#each characterStore.characters as character, index (character.id)}
            {@const dragged = draggedIndex === index}
            {@const dropTarget = dropTargetIndex === index}
            {@const selected = selectedCharacterId === character.id}
            <div
                class="relative"
                class:opacity-50={dragged}
                class:border-t-2={dropTarget && draggedIndex !== null && draggedIndex > index}
                class:border-b-2={dropTarget && draggedIndex !== null && draggedIndex < index}
                class:border-primary={dropTarget}
                role="option"
                tabindex="0"
                aria-selected={selected}
                aria-roledescription="draggable character"
                aria-grabbed={dragged}
                draggable="true"
                ondragstart={(e) => handleDragStart(e, index)}
                ondragover={(e) => handleDragOver(e, index)}
                ondragleave={handleDragLeave}
                ondrop={(e) => handleDrop(e, index)}
                ondragend={handleDragEnd}
                animate:flip={{ duration: flipDurationMs }}
            >
                <CharacterSidebarItem
                    {character}
                    active={selected}
                    onClick={() => onSelect(character.id)}
                />
            </div>
        {/each}
    </div>

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

    <div class="mt-auto pb-4 flex flex-col gap-2">
        <div class="tooltip tooltip-right z-50" data-tip="Settings">
            <button
                class="group flex items-center justify-center w-12 h-12 rounded-3xl hover:rounded-xl bg-base-200 hover:bg-secondary text-secondary hover:text-white transition-all duration-200"
                onclick={() => uiState.openSettingsModal()}
                aria-label="Settings"
            >
                <Gear size={24} />
            </button>
        </div>
        <div class="tooltip tooltip-right z-50" data-tip="Personas">
            <button
                class="group flex items-center justify-center w-12 h-12 rounded-3xl hover:rounded-xl bg-base-200 hover:bg-primary text-primary hover:text-white transition-all duration-200"
                onclick={onPersona}
                aria-label="Manage Personas"
            >
                <User size={24} />
            </button>
        </div>
    </div>
</div>
