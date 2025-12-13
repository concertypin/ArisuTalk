<script lang="ts">
    import type { Character } from "@arisutalk/character-spec/v0/Character";

    interface Props {
        character: Character;
        active: boolean;
        onClick: () => void;
    }

    let { character, active, onClick }: Props = $props();

    // Generate initials from name
    let initials = $derived(character.name.substring(0, 2).toUpperCase());

    // Check for avatar in this order: top-level property -> assets 'portrait-default' -> any image asset
    let avatarUrl = $derived.by(() => {
        if (character.avatarUrl) return character.avatarUrl;
        const assets = character.assets?.assets || [];
        const portrait =
            assets.find((a) => a.name === "portrait-default") ||
            assets.find((a) => a.mimeType.startsWith("image/"));
        return portrait?.url || "";
    });
</script>

<div class="tooltip tooltip-right z-50" data-tip={character.name}>
    <button
        class="group relative flex items-center justify-center w-12 h-12 mb-2 transition-all duration-200 ease-out focus:outline-none"
        onclick={onClick}
        aria-label={character.name}
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

        <!-- Icon/Avatar -->
        <div
            class="flex items-center justify-center w-12 h-12 overflow-hidden bg-neutral text-neutral-content transition-all duration-200"
            class:rounded-xl={active}
            class:rounded-3xl={!active}
            class:group-hover:rounded-xl={!active}
            class:bg-primary={active}
        >
            {#if avatarUrl}
                <img src={avatarUrl} alt={character.name} class="w-full h-full object-cover" />
            {:else}
                <span class="font-bold text-sm select-none">{initials}</span>
            {/if}
        </div>
    </button>
</div>
