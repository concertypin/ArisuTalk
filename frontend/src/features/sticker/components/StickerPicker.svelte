<script module>
    import StickerIcon from "phosphor-svelte/lib/StickerIcon";
    import XIcon from "phosphor-svelte/lib/XIcon";
    import MagnifyingGlassIcon from "phosphor-svelte/lib/MagnifyingGlassIcon";
    import { Logger } from "@common/logger/Logger";
    import { type AssetEntity } from "@arisutalk/character-spec/v0/Character";

    type EmojiClass = {
        emoji: string;
        skin_tone_support: boolean;
        name: string;
        slug: string;
        unicode_version: string;
        emoji_version: string;
    };

    type EmojiGroup = {
        name: string;
        slug: string;
        emojis: EmojiClass[];
    };

    let BUILTIN_EMOJIS = $state<EmojiGroup[]>([]);

    const emojisLoadPromise = import("unicode-emoji-json/data-by-group.json");
</script>

<!--
@component StickerPicker
Modal/panel for selecting stickers from packs, or picking emoji characters.
Emits `onSelect` with the chosen Sticker object.
-->
<script lang="ts">
    let {
        onSelect,
        onClose,
    }: {
        /** Callback invoked when a sticker or emoji is selected. */
        onSelect: (sticker: AssetEntity) => void;
        /** Called when the modal is dismissed. */
        onClose: () => void;
    } = $props();

    let dialog = $state<HTMLDialogElement | null>(null);
    let searchQuery = $state("");

    /** Query is valid? */
    let isFiltered = $derived(!!searchQuery.trim());

    // Tabs: index 0 is always "Emoji", then each sticker pack gets a tab
    let activeTab = $state<number>(0);

    $effect(() => {
        if (dialog && !dialog.open) {
            dialog.showModal();
        }
    });

    function handleBackdropClick(e: MouseEvent): void {
        if (e.target === dialog) {
            close();
        }
    }

    function close(): void {
        dialog?.close();
        onClose();
    }

    /** Called when the user clicks an emoji from the emoji grid. */
    function selectEmoji(emojiChar: string, emojiName: string): void {
        const emoji: AssetEntity = {
            id: crypto.randomUUID(),
            mimeType: "text/plain",
            name: emojiName,
            data: emojiChar,
        };

        onSelect(emoji);
        close();
    }

    emojisLoadPromise
        .then((v) => {
            BUILTIN_EMOJIS = v.default;
        })
        .catch((e) => {
            Logger.error("Failed to load emoji data.", e);
        });

    /** Flattened emoji items for search. */
    let flattenedEmojis = $derived.by(() => {
        const t: EmojiClass[] = [];

        // for EmojiGroup
        for (const eg of BUILTIN_EMOJIS) {
            // for EmojiClass
            for (const ec of eg.emojis) {
                t.push(ec);
            }
        }

        return t;
    });

    function isQueryMatched(e: EmojiClass): boolean {
        return (
            e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.emoji.includes(searchQuery)
        );
    }

    /** Emoji items matching the search query. */
    let filteredEmojis = $derived.by(() => {
        if (!isFiltered) return flattenedEmojis;

        return flattenedEmojis.filter(isQueryMatched);
    });
</script>

{#snippet drawEmojiContainer(
    emojis: EmojiClass[],
    onSelect: (emojiChar: string, emojiName: string) => void
)}
    <div class="grid grid-cols-8 sm:grid-cols-10 gap-1">
        {#each emojis as c (c.slug)}
            <button
                class="btn btn-ghost btn-sm p-0 h-10 w-10 text-xl flex items-center justify-center rounded-lg hover:bg-base-300/50"
                title={c.slug}
                onclick={() => onSelect(c.emoji, c.slug)}
            >
                {c.emoji}
            </button>
        {/each}
    </div>
{/snippet}

{#snippet drawEmojiGrid(filtered: boolean)}
    {#if filtered}
        <!-- Search results -->
        {@render drawEmojiContainer(filteredEmojis, selectEmoji)}

        <!-- If not found, -->
        {#if filteredEmojis.length === 0}
            <p class="text-center text-base-content/40 py-8 text-sm">No emoji found</p>
        {/if}
    {:else}
        <!-- Categorized emoji grid -->
        {#each BUILTIN_EMOJIS as group (group.name)}
            <div class="mb-3">
                <h4
                    class="text-xs font-semibold text-base-content/50 mb-1.5 uppercase tracking-wider"
                >
                    {group.name}
                </h4>
                {@render drawEmojiContainer(group.emojis, selectEmoji)}
            </div>
        {/each}
    {/if}
{/snippet}

<dialog
    bind:this={dialog}
    class="modal"
    onclose={close}
    onclick={handleBackdropClick}
    aria-label="Sticker Picker"
>
    <div
        class="modal-box w-11/12 max-w-lg h-[70vh] p-0 flex flex-col overflow-hidden bg-base-100 text-base-content shadow-2xl"
    >
        <!-- Header -->
        <header
            class="flex items-center justify-between p-3 border-b border-base-300/50 bg-base-200/80 shrink-0"
        >
            <h2 class="font-bold text-base flex items-center gap-2">
                <StickerIcon size={20} /> Stickers
            </h2>
            <button
                class="btn btn-ghost btn-xs btn-square hover:bg-base-300/50"
                onclick={close}
                aria-label="Close"
            >
                <XIcon size={16} />
            </button>
        </header>

        <!-- Search -->
        <div class="px-3 py-2 bg-base-200/40 shrink-0">
            <div class="relative">
                <MagnifyingGlassIcon
                    size={16}
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
                />
                <input
                    type="text"
                    placeholder="Search stickers or emoji..."
                    class="input input-sm input-bordered w-full pl-9 bg-base-100/60 border-base-300/40"
                    bind:value={searchQuery}
                />
            </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-3">
            {#if activeTab === 0}
                <!-- Emoji Grid -->
                {@render drawEmojiGrid(isFiltered)}
            {/if}
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button onclick={close}>close</button>
    </form>
</dialog>
