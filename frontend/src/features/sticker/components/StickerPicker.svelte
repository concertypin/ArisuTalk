<!--
@component StickerPicker
Modal/panel for selecting stickers from packs, or picking emoji characters.
Emits `onSelect` with the chosen Sticker object.
-->
<script lang="ts">
    import { stickerStore } from "@/features/sticker/stores/stickerStore.svelte";
    import type { Sticker } from "@/features/sticker";
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
            id: crypto.randomUUID(),
            name: emojiName,
            emoji: emojiChar,
            source: "emoji",
        };
        onSelect(sticker);
        close();
    }

    /** Set of unique emoji categories shown in the emoji picker tab. */
    const EMOJI_CATEGORIES: Array<{
        label: string;
        emojis: Array<{ char: string; name: string }>;
    }> = [
        {
            label: "Smileys & People",
            emojis: [
                { char: "😀", name: "Grinning Face" },
                { char: "😁", name: "Beaming Face" },
                { char: "😂", name: "Tears of Joy" },
                { char: "🤣", name: "Rolling on Floor" },
                { char: "😃", name: "Big Smile" },
                { char: "😄", name: "Smiling Eyes" },
                { char: "😅", name: "Grinning Sweat" },
                { char: "😆", name: "Squinting Grin" },
                { char: "😉", name: "Winking Face" },
                { char: "😊", name: "Smiling Blush" },
                { char: "😋", name: "Yummy Face" },
                { char: "😎", name: "Cool Sunglasses" },
                { char: "😍", name: "Heart Eyes" },
                { char: "🥰", name: "Smiling Hearts" },
                { char: "😘", name: "Face Blowing Kiss" },
                { char: "🤗", name: "Hugging Face" },
                { char: "🤩", name: "Star-Struck" },
                { char: "🤔", name: "Thinking Face" },
                { char: "🙄", name: "Eye Roll" },
                { char: "😏", name: "Smirking Face" },
                { char: "😣", name: "Persevering" },
                { char: "😮", name: "Face with Open Mouth" },
                { char: "😐", name: "Neutral Face" },
                { char: "😑", name: "Expressionless" },
                { char: "😶", name: "Without Mouth" },
                { char: "😛", name: "Face with Tongue" },
                { char: "😜", name: "Winking Tongue" },
                { char: "😝", name: "Squinting Tongue" },
                { char: "😒", name: "Unamused" },
                { char: "😓", name: "Cold Sweat" },
                { char: "😔", name: "Pensive" },
                { char: "😕", name: "Confused" },
                { char: "🙃", name: "Upside-Down" },
                { char: "😲", name: "Astonished" },
                { char: "😢", name: "Crying Face" },
                { char: "😭", name: "Loudly Crying" },
                { char: "😤", name: "Steaming Face" },
                { char: "😡", name: "Pouting Face" },
                { char: "😠", name: "Angry Face" },
                { char: "🤬", name: "Face with Symbols" },
                { char: "😳", name: "Flushed Face" },
                { char: "🤪", name: "Zany Face" },
                { char: "😵", name: "Dizzy Face" },
                { char: "🥺", name: "Pleading Face" },
                { char: "😴", name: "Sleeping Face" },
                { char: "🤤", name: "Drooling Face" },
                { char: "🥳", name: "Partying Face" },
                { char: "🥶", name: "Cold Face" },
                { char: "🥵", name: "Hot Face" },
                { char: "🤯", name: "Exploding Head" },
            ],
        },
        {
            label: "Gestures & Hands",
            emojis: [
                { char: "👍", name: "Thumbs Up" },
                { char: "👎", name: "Thumbs Down" },
                { char: "👌", name: "OK Hand" },
                { char: "✌️", name: "Victory Hand" },
                { char: "🤞", name: "Crossed Fingers" },
                { char: "🤟", name: "Love-You Gesture" },
                { char: "🤘", name: "Horn Sign" },
                { char: "🤙", name: "Call Me Hand" },
                { char: "👋", name: "Waving Hand" },
                { char: "🤚", name: "Raised Back of Hand" },
                { char: "🖐️", name: "Hand with Fingers Splayed" },
                { char: "✋", name: "Raised Hand" },
                { char: "🖖", name: "Vulcan Salute" },
                { char: "👏", name: "Clapping Hands" },
                { char: "🙌", name: "Raising Hands" },
                { char: "🤝", name: "Handshake" },
                { char: "🙏", name: "Folded Hands" },
                { char: "✊", name: "Raised Fist" },
                { char: "👊", name: "Oncoming Fist" },
                { char: "🤛", name: "Left-Facing Fist" },
                { char: "🤜", name: "Right-Facing Fist" },
                { char: "👆", name: "Pointing Up" },
                { char: "👇", name: "Pointing Down" },
                { char: "👉", name: "Pointing Right" },
                { char: "👈", name: "Pointing Left" },
                { char: "☝️", name: "Index Pointing Up" },
                { char: "💪", name: "Flexed Biceps" },
                { char: "🫶", name: "Heart Hands" },
                { char: "👐", name: "Open Hands" },
                { char: "🤲", name: "Palms Up Together" },
                { char: "💅", name: "Nail Polish" },
                { char: "🤳", name: "Selfie" },
            ],
        },
        {
            label: "Hearts & Emotions",
            emojis: [
                { char: "❤️", name: "Red Heart" },
                { char: "🧡", name: "Orange Heart" },
                { char: "💛", name: "Yellow Heart" },
                { char: "💚", name: "Green Heart" },
                { char: "💙", name: "Blue Heart" },
                { char: "💜", name: "Purple Heart" },
                { char: "🖤", name: "Black Heart" },
                { char: "🤍", name: "White Heart" },
                { char: "🤎", name: "Brown Heart" },
                { char: "💔", name: "Broken Heart" },
                { char: "❣️", name: "Heart Exclamation" },
                { char: "💕", name: "Two Hearts" },
                { char: "💞", name: "Revolving Hearts" },
                { char: "💓", name: "Beating Heart" },
                { char: "💗", name: "Growing Heart" },
                { char: "💖", name: "Sparkling Heart" },
                { char: "💘", name: "Heart with Arrow" },
                { char: "💝", name: "Heart with Ribbon" },
                { char: "💟", name: "Heart Decoration" },
                { char: "✨", name: "Sparkles" },
                { char: "⭐", name: "Star" },
                { char: "🌟", name: "Glowing Star" },
                { char: "💫", name: "Dizzy Star" },
                { char: "🔥", name: "Fire" },
                { char: "💯", name: "Hundred Points" },
                { char: "💢", name: "Anger Symbol" },
                { char: "💬", name: "Speech Balloon" },
                { char: "💭", name: "Thought Balloon" },
                { char: "🎉", name: "Party Popper" },
                { char: "🎊", name: "Confetti Ball" },
                { char: "🎈", name: "Balloon" },
                { char: "🎁", name: "Wrapped Gift" },
            ],
        },
        {
            label: "Animals & Nature",
            emojis: [
                { char: "🐶", name: "Dog Face" },
                { char: "🐱", name: "Cat Face" },
                { char: "🐭", name: "Mouse Face" },
                { char: "🐹", name: "Hamster" },
                { char: "🐰", name: "Rabbit Face" },
                { char: "🦊", name: "Fox" },
                { char: "🐻", name: "Bear" },
                { char: "🐼", name: "Panda" },
                { char: "🐨", name: "Koala" },
                { char: "🐯", name: "Tiger Face" },
                { char: "🦁", name: "Lion" },
                { char: "🐮", name: "Cow Face" },
                { char: "🐷", name: "Pig Face" },
                { char: "🐸", name: "Frog" },
                { char: "🐵", name: "Monkey Face" },
                { char: "🐔", name: "Chicken" },
                { char: "🐧", name: "Penguin" },
                { char: "🐦", name: "Bird" },
                { char: "🐤", name: "Baby Chick" },
                { char: "🦆", name: "Duck" },
                { char: "🦅", name: "Eagle" },
                { char: "🦉", name: "Owl" },
                { char: "🦇", name: "Bat" },
                { char: "🐺", name: "Wolf" },
                { char: "🐴", name: "Horse Face" },
                { char: "🦄", name: "Unicorn" },
                { char: "🐝", name: "Honeybee" },
                { char: "🐛", name: "Bug" },
                { char: "🦋", name: "Butterfly" },
                { char: "🐌", name: "Snail" },
                { char: "🐞", name: "Lady Beetle" },
                { char: "🐢", name: "Turtle" },
                { char: "🐍", name: "Snake" },
                { char: "🐙", name: "Octopus" },
                { char: "🐠", name: "Tropical Fish" },
                { char: "🐟", name: "Fish" },
                { char: "🐬", name: "Dolphin" },
                { char: "🐳", name: "Spouting Whale" },
                { char: "🦋", name: "Butterfly" },
                { char: "🌸", name: "Cherry Blossom" },
                { char: "🌺", name: "Hibiscus" },
                { char: "🌻", name: "Sunflower" },
                { char: "🌹", name: "Rose" },
                { char: "🌷", name: "Tulip" },
                { char: "🌵", name: "Cactus" },
                { char: "🌲", name: "Evergreen" },
                { char: "🌳", name: "Deciduous Tree" },
                { char: "🌴", name: "Palm Tree" },
                { char: "🌈", name: "Rainbow" },
                { char: "🌊", name: "Water Wave" },
                { char: "☀️", name: "Sun" },
                { char: "🌙", name: "Moon" },
                { char: "⭐", name: "Star" },
                { char: "🌟", name: "Glowing Star" },
                { char: "☁️", name: "Cloud" },
                { char: "⛅", name: "Sun Behind Cloud" },
                { char: "🌧️", name: "Rain Cloud" },
                { char: "❄️", name: "Snowflake" },
                { char: "⚡", name: "High Voltage" },
                { char: "🔥", name: "Fire" },
            ],
        },
        {
            label: "Food & Drink",
            emojis: [
                { char: "🍎", name: "Red Apple" },
                { char: "🍐", name: "Pear" },
                { char: "🍊", name: "Tangerine" },
                { char: "🍋", name: "Lemon" },
                { char: "🍌", name: "Banana" },
                { char: "🍉", name: "Watermelon" },
                { char: "🍇", name: "Grapes" },
                { char: "🍓", name: "Strawberry" },
                { char: "🫐", name: "Blueberries" },
                { char: "🍈", name: "Melon" },
                { char: "🍒", name: "Cherries" },
                { char: "🍑", name: "Peach" },
                { char: "🥭", name: "Mango" },
                { char: "🍍", name: "Pineapple" },
                { char: "🥝", name: "Kiwi" },
                { char: "🍅", name: "Tomato" },
                { char: "🥑", name: "Avocado" },
                { char: "🍔", name: "Hamburger" },
                { char: "🍟", name: "French Fries" },
                { char: "🍕", name: "Pizza" },
                { char: "🌭", name: "Hot Dog" },
                { char: "🥪", name: "Sandwich" },
                { char: "🌮", name: "Taco" },
                { char: "🌯", name: "Burrito" },
                { char: "🥗", name: "Green Salad" },
                { char: "🍿", name: "Popcorn" },
                { char: "🧁", name: "Cupcake" },
                { char: "🍰", name: "Shortcake" },
                { char: "🎂", name: "Birthday Cake" },
                { char: "🍦", name: "Soft Ice Cream" },
                { char: "🍩", name: "Doughnut" },
                { char: "🍪", name: "Cookie" },
                { char: "☕", name: "Hot Beverage" },
                { char: "🍵", name: "Teacup" },
                { char: "🥤", name: "Cup with Straw" },
                { char: "🍺", name: "Beer" },
                { char: "🍻", name: "Clinking Beers" },
                { char: "🥂", name: "Clinking Glasses" },
            ],
        },
    ];

    /** Flattened emoji items for search. */
    let allEmojis = $derived(
        EMOJI_CATEGORIES.flatMap((cat) => cat.emojis.map((e) => ({ ...e, category: cat.label })))
    );

    /** Emoji items matching the search query. */
    let filteredEmojis = $derived(
        searchQuery
            ? allEmojis.filter(
                  (e) =>
                      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      e.char.includes(searchQuery)
              )
            : allEmojis
    );

    /** Filtered emoji categories for the grid (only non-empty). */
    let filteredCategories = $derived(searchQuery ? [] : EMOJI_CATEGORIES);

    /** Stickers across all packs, filtered by search. */
    let allPackStickers = $derived(
        stickerStore.packs.flatMap((p) =>
            p.stickers.map((s) => ({ sticker: s, packId: p.id, packName: p.name }))
        )
    );

    /** Filtered pack stickers matching search. */
    let filteredPackStickers = $derived(
        searchQuery
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
                <!-- Emoji Grid -->
                {#if searchQuery}
                    <!-- Search results -->
                    <div class="grid grid-cols-8 sm:grid-cols-10 gap-1">
                        {#each filteredEmojis as emoji}
                            <button
                                class="btn btn-ghost btn-sm p-0 h-10 w-10 text-xl flex items-center justify-center rounded-lg hover:bg-base-300/50"
                                title={emoji.name}
                                onclick={() => selectEmoji(emoji.char, emoji.name)}
                            >
                                {emoji.char}
                            </button>
                        {/each}
                    </div>
                    {#if filteredEmojis.length === 0}
                        <p class="text-center text-base-content/40 py-8 text-sm">No emoji found</p>
                    {/if}
                {:else}
                    <!-- Categorized emoji grid -->
                    {#each filteredCategories as category (category.label)}
                        <div class="mb-3">
                            <h4
                                class="text-xs font-semibold text-base-content/50 mb-1.5 uppercase tracking-wider"
                            >
                                {category.label}
                            </h4>
                            <div class="grid grid-cols-8 sm:grid-cols-10 gap-1">
                                {#each category.emojis as emoji}
                                    <button
                                        class="btn btn-ghost btn-sm p-0 h-10 w-10 text-xl flex items-center justify-center rounded-lg hover:bg-base-300/50"
                                        title={emoji.name}
                                        onclick={() => selectEmoji(emoji.char, emoji.name)}
                                    >
                                        {emoji.char}
                                    </button>
                                {/each}
                            </div>
                        </div>
                    {/each}
                {/if}
            {:else}
                <!-- Sticker Pack Grid -->
                {@const packIndex = activeTab - 1}
                {@const activePack = stickerStore.packs[packIndex]}
                {#if activePack}
                    {#if searchQuery}
                        <div class="grid grid-cols-4 sm:grid-cols-5 gap-2">
                            {#each filteredPackStickers.filter((s) => s.packId === activePack.id) as entry (entry.sticker.id)}
                                {@render drawSticker(entry.sticker)}
                            {/each}
                        </div>
                        {#if filteredPackStickers.length === 0}
                            <p class="text-center text-base-content/40 py-8 text-sm">
                                No stickers found
                            </p>
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
                {/if}
            {/if}
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button onclick={close}>close</button>
    </form>
</dialog>
