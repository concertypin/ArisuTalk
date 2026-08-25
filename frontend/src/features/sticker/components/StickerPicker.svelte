<script module lang="ts">
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

    let BUILTIN_EMOJIS: EmojiGroup[];

    async function loadBuiltinEmojis() {
        if (BUILTIN_EMOJIS) return BUILTIN_EMOJIS;

        const module = await import("unicode-emoji-json/data-by-group.json");
        BUILTIN_EMOJIS = module.default;

        return BUILTIN_EMOJIS;
    }
</script>

<!--
@component StickerPicker
Modal/panel for selecting stickers from packs, or picking emoji characters.
Emits `onSelect` with the chosen Sticker object.
-->
<script lang="ts">
    import { stickerStore } from "@/features/sticker/stores/stickerStore.svelte";
    import type { Sticker, StickerPack } from "@/features/sticker";
    import StickerIcon from "phosphor-svelte/lib/StickerIcon";
    import EmojiIcon from "phosphor-svelte/lib/SmileyIcon";
    import XIcon from "phosphor-svelte/lib/XIcon";
    import MagnifyingGlassIcon from "phosphor-svelte/lib/MagnifyingGlassIcon";

    interface Props {
        /** Callback invoked when a sticker or emoji is selected. */
        onSelect: (sticker: Sticker & { packId?: string }) => void;
        /** Called when the modal is dismissed. */
        onClose: () => void;
    }

    let { onSelect, onClose }: Props = $props();

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

    /** Called when the user selects a sticker from a pack. */
    function selectPackSticker(sticker: Sticker, packId: string): void {
        onSelect({ ...sticker, packId });
        close();
    }

    /** Called when the user clicks an emoji from the emoji grid. */
    function selectEmoji(emojiChar: string, emojiName: string): void {
        const sticker: Sticker = {
            id: crypto.randomUUID(), // WHAT?
            name: emojiName,
            emoji: emojiChar,
            source: "emoji",
        };
        onSelect(sticker);
        close();
    }

    /** Raw, Unfiltered Data */
    type EmojiData = { char: string; name: string };

    let groupedEmojis: EmojiGroup[] = $state([]);

    $effect(() => {
        loadBuiltinEmojis().then((data) => (groupedEmojis = data));
    });

    /** Flattened emoji items for search. */
    let flattenedEmojis = $derived.by(() => {
        const t: EmojiClass[] = [];

        // for EmojiGroup
        for (const eg of groupedEmojis) {
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

    /** Stickers across all packs, filtered by search. */
    let allPackStickers = $derived(
        stickerStore.packs.flatMap((p) =>
            p.stickers.map((s) => ({ sticker: s, packId: p.id, packName: p.name }))
        )
    );

    /** Filtered pack stickers matching search. */
    let filteredPackStickers = $derived(
        isFiltered
            ? allPackStickers.filter(
                  (s) =>
                      s.sticker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.sticker.emoji?.includes(searchQuery)
              )
            : allPackStickers
    );
</script>

{#snippet drawSticker(sticker: Sticker)}
    {#if sticker.emoji}
        <span class="text-3xl">{sticker.emoji}</span>
    {:else if sticker.imageUrl}
        <img src={sticker.imageUrl} alt={sticker.name} class="w-12 h-12 object-contain rounded" />
    {:else}
        <span class="w-12 h-12 flex items-center justify-center text-base-content/30 text-xs">
            No preview
        </span>
    {/if}
{/snippet}

{#snippet drawEmojiContainer(
    emojis: EmojiClass[],
    onSelect: (emojiChar: string, emojiName: string) => void
)}
    <div class="grid grid-cols-8 sm:grid-cols-10 gap-1">
        {#each emojis as c}
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
        {#each groupedEmojis as group (group.name)}
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

{#snippet drawStickerPackGrid(filtered: boolean, activePack: StickerPack)}
    {#if filtered}
        <div class="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {#each filteredPackStickers.filter((s) => s.packId === activePack.id) as entry (entry.sticker.id)}
                {@render drawSticker(entry.sticker)}
            {/each}
        </div>
        {#if filteredPackStickers.length === 0}
            <p class="text-center text-base-content/40 py-8 text-sm">No stickers found</p>
        {/if}
    {:else}
        <div class="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {#each activePack.stickers as sticker (sticker.id)}
                <button
                    class="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-base-300/40 transition-colors"
                    title={sticker.name}
                    onclick={() => selectPackSticker(sticker, activePack.id)}
                >
                    {@render drawSticker(sticker)}
                    <span
                        class="text-[10px] text-base-content/60 truncate w-full text-center leading-tight"
                    >
                        {sticker.name}
                    </span>
                </button>
            {/each}
        </div>
        {#if activePack.stickers.length === 0}
            <p class="text-center text-base-content/40 py-8 text-sm">
                This pack is empty — add stickers in the manager.
            </p>
        {/if}
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

        <!-- Tabs -->
        <div
            class="flex gap-1 px-3 pt-2 pb-1 overflow-x-auto bg-base-200/30 border-b border-base-300/30 shrink-0"
        >
            <!-- Emoji tab (always present) -->
            <button
                class="btn btn-xs {activeTab === 0 ? 'btn-primary' : 'btn-ghost'} gap-1.5 shrink-0"
                onclick={() => (activeTab = 0)}
            >
                <EmojiIcon size={14} /> Emoji
            </button>

            <!-- Sticker pack tabs -->
            {#each stickerStore.packs as pack, i (pack.id)}
                {#if pack.stickers.length > 0}
                    <button
                        class="btn btn-xs {activeTab === i + 1
                            ? 'btn-primary'
                            : 'btn-ghost'} gap-1.5 shrink-0"
                        onclick={() => (activeTab = i + 1)}
                    >
                        <StickerIcon size={14} />
                        {pack.name}
                    </button>
                {/if}
            {/each}
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-3">
            {#if activeTab === 0}
                <!-- FIXME: This will not be able to find the emoji whose name is the blank character. -->
                <!-- Emoji Grid -->
                {@render drawEmojiGrid(isFiltered)}
            {:else}
                <!-- Sticker Pack Grid -->
                {@const packIndex = activeTab - 1}
                {@const activePack = stickerStore.packs[packIndex]}

                {#if activePack}
                    {@render drawStickerPackGrid(isFiltered, activePack)}
                {/if}
            {/if}
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button onclick={close}>close</button>
    </form>
</dialog>
