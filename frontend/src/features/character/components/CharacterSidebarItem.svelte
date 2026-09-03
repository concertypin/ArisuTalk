<script module>
    import type { Character } from "@arisutalk/character-spec/v0/Character";
    import PencilSimple from "phosphor-svelte/lib/PencilSimpleIcon";
    import PushPin from "phosphor-svelte/lib/PushPinIcon";
    import { opfsAdapter } from "../adapters/assetStorage/OpFSAssetStorageAdapter";
    import { IfNotExistBehavior } from "@/lib/interfaces";

    import { getAppContext } from "@/context";
</script>

<script lang="ts">
    let {
        character,
        active,
        isPinned = false,
        onClick,
        onTogglePin,
    }: {
        /** Character object referenced by the UI element */
        character: Character;
        /** Specifies whether the element is enabled. This primarily affects its visual appearance. */
        active: boolean;
        /** Whether the element is pinned. This primarily affects its visual appearance and updates the aria-label to reflect the available action. */
        isPinned?: boolean;
        /** Event handler called when the element is clicked. */
        onClick: () => void;
        /** Specifies the event handler to run when the toggle pin button is clicked. Defaults to no action. */
        onTogglePin?: () => void;
    } = $props();

    let appContext = getAppContext();

    // Generate initials from name
    let initials = $derived(character.name.substring(0, 2).toUpperCase());

    // Resolve avatar URL (handles local:// OpFS URLs)
    let resolvedAvatarUrl = $state("");

    $effect(() => {
        const url = character.avatarUrl;
        if (!url) {
            resolvedAvatarUrl = "";
            return;
        }

        let revoked = false;
        let blobUrl: string | null = null;

        if (url.startsWith("local:")) {
            void (async () => {
                try {
                    const res = await opfsAdapter.getAssetUrl(
                        new URL(url),
                        IfNotExistBehavior.RETURN_NULL
                    );
                    if (!revoked) {
                        blobUrl = res;
                        resolvedAvatarUrl = res || "";
                    } else if (res) {
                        URL.revokeObjectURL(res);
                    }
                } catch {
                    if (!revoked) resolvedAvatarUrl = "";
                }
            })();
        } else {
            resolvedAvatarUrl = url;
        }

        return () => {
            revoked = true;
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    });

    function openCharacterSettings(character: Character) {
        appContext.editingCharacter = character;
        appContext.characterSettingsOpen = true;
    }

    function handleButtonClick(e: MouseEvent) {
        if (active) {
            e.stopPropagation();
            openCharacterSettings(character);
        } else {
            onClick();
        }
    }

    let isHovered = $state(false);
</script>

{#snippet CharacterIcon()}
    {#if resolvedAvatarUrl}
        <img src={resolvedAvatarUrl} alt={character.name} class="w-full h-full object-cover" />
    {:else}
        <span class="font-bold text-sm select-none">{initials}</span>
    {/if}
{/snippet}

<div
    class="tooltip tooltip-right z-50 relative group"
    data-tip={active ? "Settings" : character.name}
>
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
                <PencilSimple size={20} />
            </div>

            <!-- End State: Avatar (when inactive OR not hovered) -->
            <div class="swap-off flex items-center justify-center w-full h-full">
                {@render CharacterIcon()}
            </div>
        </div>
    </button>
    <!-- Pin Toggle (visible on hover) -->
    {#if onTogglePin}
        <button
            class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-accent z-10"
            onclick={(e) => {
                e.stopPropagation();
                onTogglePin?.();
            }}
            aria-label={isPinned ? "Unpin character" : "Pin character"}
        >
            <PushPin size={10} weight={isPinned ? "fill" : "regular"} />
        </button>
    {/if}
</div>
