<script lang="ts">
    import type { Character } from "@arisutalk/character-spec/v0/Character";
    import PencilSimpleIcon from "phosphor-svelte/lib/PencilSimpleIcon";
    import { uiState } from "@/lib/stores/ui.svelte";

    type Props = {
        character: Character;
        active: boolean;
        onClick: () => void;
    };

    const { character, active, onClick }: Props = $props();

    // Generate initials from name
    const initials = $derived(character.name.substring(0, 2).toUpperCase());

    // Check for avatar in this order: top-level property -> assets 'portrait-default' -> any image asset
    const avatarUrl = $derived(character.avatarUrl || "");

    function handleButtonClick(e: MouseEvent) {
        if (active) {
            e.stopPropagation();
            uiState.openCharacterSettings(character);
        } else {
            onClick();
        }
    }

    let isHovered = $state(false);
</script>

{#snippet CharacterIcon()}
    {#if avatarUrl}
        <img src={avatarUrl} alt={character.name} class="w-full h-full object-cover" />
    {:else}
        <span class="font-bold text-sm select-none">{initials}</span>
    {/if}
{/snippet}

<div class="tooltip tooltip-right z-50" data-tip={active ? "Settings" : character.name}>
    <button
        class="group relative flex items-center justify-center w-12 h-12 mb-2 transition-all duration-200 ease-out focus:outline-none"
        onclick={handleButtonClick}
        onmouseenter={() => (isHovered = true)}
        onmouseleave={() => (isHovered = false)}
        aria-label={active ? "Settings" : character.name}
    >
        <!-- Active Pill -->
        <span
            class="absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200"
            class:h-8={active}
            class:h-2={!active}
            class:opacity-100={active}
            class:opacity-0={!active}
            class:group-hover:h-5={!active}
            class:group-hover:opacity-100={!active}
        ></span>

        <!-- Icon/Avatar Swap -->
        <div
            class="swap swap-rotate w-12 h-12 overflow-hidden transition-all duration-200"
            class:swap-active={active && isHovered}
            class:rounded-xl={active}
            class:rounded-3xl={!active}
            class:group-hover:rounded-xl={!active}
            class:bg-primary={active}
            class:text-primary-content={active}
            class:bg-neutral={!active}
            class:text-neutral-content={!active}
        >
            <!-- Start State: Settings Icon (when active & hovered) -->
            <div class="swap-on flex items-center justify-center w-full h-full">
                <PencilSimpleIcon size={20} />
            </div>

            <!-- End State: Avatar (when inactive OR not hovered) -->
            <div class="swap-off flex items-center justify-center w-full h-full">
                {@render CharacterIcon()}
            </div>
        </div>
    </button>
</div>
