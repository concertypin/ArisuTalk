<!--
@component StickerPackManager
Modal dialog for creating, editing, and deleting sticker packs,
importing emoji or uploading custom images, and reordering stickers.
-->
<script lang="ts">
    import { Logger } from "@common/logger/Logger";
    import { stickerStore } from "@/features/sticker/stores/stickerStore.svelte";
    import type { Sticker, StickerPack } from "@/features/sticker";
    import StickerIcon from "phosphor-svelte/lib/StickerIcon";
    import ImageIcon from "phosphor-svelte/lib/ImageIcon";
    import EmojiIcon from "phosphor-svelte/lib/SmileyIcon";
    import TrashIcon from "phosphor-svelte/lib/TrashIcon";
    import PlusIcon from "phosphor-svelte/lib/PlusIcon";
    import XIcon from "phosphor-svelte/lib/XIcon";
    import CaretUpIcon from "phosphor-svelte/lib/CaretUpIcon";
    import CaretDownIcon from "phosphor-svelte/lib/CaretDownIcon";

    interface Props {
        onClose: () => void;
    }

    let { onClose }: Props = $props();

    // --- Dialog refs ---
    let dialog = $state<HTMLDialogElement | null>(null);
    let importEmojiDialog = $state<HTMLDialogElement | null>(null);

    $effect(() => {
        if (dialog && !dialog.open) {
            dialog.showModal();
        }
    });

    // --- Pack editing state ---
    let selectedPackId = $state<string | null>(null);
    let isCreating = $state(false);
    let editName = $state("");
    let editDescription = $state("");

    // --- Import emoji state ---
    let importTargetPackId = $state<string | null>(null);
    let emojiSearchQuery = $state("");

    // --- Selected pack ---
    let selectedPack = $derived(
        selectedPackId ? stickerStore.packs.find((p) => p.id === selectedPackId) : null
    );

    function handleBackdropClick(e: MouseEvent): void {
        if (e.target === dialog) {
            close();
        }
    }

    function close(): void {
        dialog?.close();
        onClose();
    }

    // --- Pack CRUD ---

    function startCreate(): void {
        isCreating = true;
        selectedPackId = null;
        editName = "";
        editDescription = "";
    }

    function cancelCreate(): void {
        isCreating = false;
        editName = "";
        editDescription = "";
    }

    async function confirmCreate(): Promise<void> {
        const name = editName.trim();
        if (!name) return;
        const now = new Date().toISOString();
        const pack: StickerPack = {
            id: crypto.randomUUID(),
            name,
            description: editDescription.trim() || undefined,
            stickers: [],
            createdAt: now,
            updatedAt: now,
        };
        await stickerStore.createPack(pack);
        selectedPackId = pack.id;
        isCreating = false;
        editName = "";
        editDescription = "";
    }

    async function deletePack(id: string): Promise<void> {
        if (!confirm("Delete this sticker pack? This cannot be undone.")) return;
        await stickerStore.deletePack(id);
        if (selectedPackId === id) {
            selectedPackId = stickerStore.packs.length > 0 ? stickerStore.packs[0].id : null;
        }
    }

    function selectPack(id: string): void {
        isCreating = false;
        selectedPackId = id;
        const pack = stickerStore.packs.find((p) => p.id === id);
        if (pack) {
            editName = pack.name;
            editDescription = pack.description || "";
        }
    }

    async function savePackDetails(): Promise<void> {
        if (!selectedPack) return;
        const name = editName.trim();
        if (!name) return;
        selectedPack.name = name;
        selectedPack.description = editDescription.trim() || undefined;
        selectedPack.updatedAt = new Date().toISOString();
        await stickerStore.updatePack(selectedPack);
    }

    // --- Sticker operations ---

    async function deleteSticker(packId: string, stickerId: string): Promise<void> {
        await stickerStore.removeSticker(packId, stickerId);
    }

    async function moveSticker(packId: string, fromIdx: number, toIdx: number): Promise<void> {
        const pack = stickerStore.packs.find((p) => p.id === packId);
        if (!pack) return;
        if (toIdx < 0 || toIdx >= pack.stickers.length) return;
        const stickers = [...pack.stickers];
        const [moved] = stickers.splice(fromIdx, 1);
        stickers.splice(toIdx, 0, moved);
        await stickerStore.reorderStickers(packId, stickers);
    }

    // --- Upload image sticker ---

    async function handleUploadImage(packId: string): Promise<void> {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/png,image/gif,image/jpeg,image/webp";
        input.multiple = false;
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            try {
                const base64 = await fileToBase64(file);
                const sticker: Sticker = {
                    id: crypto.randomUUID(),
                    name: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
                    // Store as data URI for local use
                    imageUrl: base64,
                    data: base64,
                    source: "upload",
                };
                await stickerStore.addSticker(packId, sticker);
            } catch (err) {
                Logger.error("Failed to upload sticker image:", err);
            }
        };
        input.click();
    }

    function fileToBase64(file: File): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result;
                if (typeof result === "string") {
                    resolve(result);
                } else {
                    reject(new Error("Failed to read file as data URL"));
                }
            };
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(file);
        });
    }

    // --- Import emoji as sticker ---

    function openEmojiImport(packId: string): void {
        importTargetPackId = packId;
        emojiSearchQuery = "";
        // Show the emoji import sub-dialog
        importEmojiDialog?.showModal();
    }

    async function importEmoji(emojiChar: string, emojiName: string): Promise<void> {
        if (!importTargetPackId) return;
        const sticker: Sticker = {
            id: crypto.randomUUID(),
            name: emojiName,
            emoji: emojiChar,
            source: "emoji",
        };
        await stickerStore.addSticker(importTargetPackId, sticker);
        // Keep the dialog open for more imports
    }

    function closeEmojiImport(): void {
        importEmojiDialog?.close();
        importTargetPackId = null;
        emojiSearchQuery = "";
    }

    // --- Emoji data for import ---
    const IMPORT_EMOJIS: Array<{ char: string; name: string }> = [
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
        { char: "😮", name: "Face with Open Mouth" },
        { char: "😛", name: "Face with Tongue" },
        { char: "😝", name: "Squinting Tongue" },
        { char: "😒", name: "Unamused" },
        { char: "😢", name: "Crying Face" },
        { char: "😭", name: "Loudly Crying" },
        { char: "😤", name: "Steaming Face" },
        { char: "😡", name: "Pouting Face" },
        { char: "🥺", name: "Pleading Face" },
        { char: "😴", name: "Sleeping Face" },
        { char: "🤤", name: "Drooling Face" },
        { char: "👍", name: "Thumbs Up" },
        { char: "👎", name: "Thumbs Down" },
        { char: "👌", name: "OK Hand" },
        { char: "✌️", name: "Victory Hand" },
        { char: "🤞", name: "Crossed Fingers" },
        { char: "🤟", name: "Love-You Gesture" },
        { char: "🤘", name: "Horn Sign" },
        { char: "🤙", name: "Call Me Hand" },
        { char: "👋", name: "Waving Hand" },
        { char: "✋", name: "Raised Hand" },
        { char: "👏", name: "Clapping Hands" },
        { char: "🙌", name: "Raising Hands" },
        { char: "🤝", name: "Handshake" },
        { char: "🙏", name: "Folded Hands" },
        { char: "💪", name: "Flexed Biceps" },
        { char: "❤️", name: "Red Heart" },
        { char: "🧡", name: "Orange Heart" },
        { char: "💛", name: "Yellow Heart" },
        { char: "💚", name: "Green Heart" },
        { char: "💙", name: "Blue Heart" },
        { char: "💜", name: "Purple Heart" },
        { char: "🖤", name: "Black Heart" },
        { char: "💔", name: "Broken Heart" },
        { char: "💕", name: "Two Hearts" },
        { char: "💞", name: "Revolving Hearts" },
        { char: "💓", name: "Beating Heart" },
        { char: "💗", name: "Growing Heart" },
        { char: "💖", name: "Sparkling Heart" },
        { char: "💘", name: "Heart with Arrow" },
        { char: "💝", name: "Heart with Ribbon" },
        { char: "✨", name: "Sparkles" },
        { char: "⭐", name: "Star" },
        { char: "🌟", name: "Glowing Star" },
        { char: "🔥", name: "Fire" },
        { char: "💯", name: "Hundred Points" },
        { char: "💬", name: "Speech Balloon" },
        { char: "💭", name: "Thought Balloon" },
        { char: "🎉", name: "Party Popper" },
        { char: "🎊", name: "Confetti Ball" },
        { char: "🎈", name: "Balloon" },
        { char: "🎁", name: "Wrapped Gift" },
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
        { char: "🦆", name: "Duck" },
        { char: "🦉", name: "Owl" },
        { char: "🐺", name: "Wolf" },
        { char: "🦄", name: "Unicorn" },
        { char: "🐝", name: "Honeybee" },
        { char: "🦋", name: "Butterfly" },
        { char: "🐢", name: "Turtle" },
        { char: "🐍", name: "Snake" },
        { char: "🐙", name: "Octopus" },
        { char: "🐬", name: "Dolphin" },
        { char: "🐳", name: "Spouting Whale" },
        { char: "🌸", name: "Cherry Blossom" },
        { char: "🌺", name: "Hibiscus" },
        { char: "🌻", name: "Sunflower" },
        { char: "🌹", name: "Rose" },
        { char: "🌷", name: "Tulip" },
        { char: "🌈", name: "Rainbow" },
        { char: "🌊", name: "Water Wave" },
        { char: "☀️", name: "Sun" },
        { char: "🌙", name: "Moon" },
        { char: "⭐", name: "Star" },
        { char: "☁️", name: "Cloud" },
        { char: "⛅", name: "Sun Behind Cloud" },
        { char: "❄️", name: "Snowflake" },
        { char: "⚡", name: "High Voltage" },
        { char: "🍎", name: "Red Apple" },
        { char: "🍊", name: "Tangerine" },
        { char: "🍋", name: "Lemon" },
        { char: "🍌", name: "Banana" },
        { char: "🍓", name: "Strawberry" },
        { char: "🍑", name: "Peach" },
        { char: "🍔", name: "Hamburger" },
        { char: "🍕", name: "Pizza" },
        { char: "🍦", name: "Soft Ice Cream" },
        { char: "🍩", name: "Doughnut" },
        { char: "🍪", name: "Cookie" },
        { char: "☕", name: "Hot Beverage" },
        { char: "🍵", name: "Teacup" },
    ];

    let filteredImportEmojis = $derived(
        emojiSearchQuery
            ? IMPORT_EMOJIS.filter(
                  (e) =>
                      e.name.toLowerCase().includes(emojiSearchQuery.toLowerCase()) ||
                      e.char.includes(emojiSearchQuery)
              )
            : IMPORT_EMOJIS
    );
</script>

<!-- Main Packs Manager Dialog -->
<dialog
    bind:this={dialog}
    class="modal"
    onclose={close}
    onclick={handleBackdropClick}
    aria-label="Sticker Pack Manager"
>
    <div
        class="modal-box w-11/12 max-w-3xl h-[80vh] p-0 flex flex-col overflow-hidden bg-base-100 text-base-content shadow-2xl"
    >
        <!-- Header -->
        <header
            class="flex items-center justify-between p-4 border-b border-base-300/50 bg-base-200/80 shrink-0"
        >
            <h2 class="font-bold text-lg flex items-center gap-2">
                <StickerIcon size={22} /> Sticker Pack Manager
            </h2>
            <button
                class="btn btn-ghost btn-sm btn-square hover:bg-base-300/50"
                onclick={close}
                aria-label="Close"
            >
                <XIcon size={20} />
            </button>
        </header>

        <div class="flex flex-1 overflow-hidden">
            <!-- Sidebar — pack list -->
            <aside
                class="w-56 bg-base-200/60 p-3 overflow-y-auto border-r border-base-300/50 flex flex-col gap-2 shrink-0"
            >
                <button class="btn btn-primary btn-sm gap-1.5" onclick={startCreate}>
                    <PlusIcon size={16} /> New Pack
                </button>
                {#each stickerStore.packs as pack (pack.id)}
                    <div
                        class="flex items-center gap-1 p-1.5 rounded-lg cursor-pointer transition-colors {selectedPackId ===
                        pack.id
                            ? 'bg-base-300/60'
                            : 'hover:bg-base-300/30'}"
                        onclick={() => selectPack(pack.id)}
                        role="button"
                        tabindex="0"
                        onkeydown={(e) => {
                            if (e.key === "Enter" || e.key === " ") selectPack(pack.id);
                        }}
                    >
                        <StickerIcon size={16} class="shrink-0 text-base-content/50" />
                        <span class="flex-1 text-sm truncate">{pack.name}</span>
                        <button
                            class="btn btn-ghost btn-xs btn-square text-error/60 hover:text-error hover:bg-error/10"
                            onclick={(e) => {
                                e.stopPropagation();
                                void deletePack(pack.id);
                            }}
                            aria-label="Delete {pack.name}"
                            title="Delete pack"
                        >
                            <TrashIcon size={14} />
                        </button>
                    </div>
                {/each}

                {#if stickerStore.packs.length === 0 && !isCreating}
                    <p class="text-xs text-base-content/40 text-center mt-4">
                        No packs yet. Click "New Pack" to start.
                    </p>
                {/if}
            </aside>

            <!-- Main content -->
            <main class="flex-1 p-4 overflow-y-auto bg-base-100">
                {#if isCreating}
                    <!-- Create new pack form -->
                    <div class="max-w-sm">
                        <h3 class="font-semibold text-base mb-3">Create New Pack</h3>
                        <div class="form-control mb-3">
                            <label class="label py-1">
                                <span class="label-text text-sm">Pack Name</span>
                                <input
                                    type="text"
                                    class="input input-bordered input-sm"
                                    placeholder="e.g. Cute Reactions"
                                    bind:value={editName}
                                />
                            </label>
                        </div>
                        <div class="form-control mb-4">
                            <label class="label py-1">
                                <span class="label-text text-sm">Description (optional)</span>
                                <input
                                    type="text"
                                    class="input input-bordered input-sm"
                                    placeholder="What's this pack about?"
                                    bind:value={editDescription}
                                />
                            </label>
                        </div>
                        <div class="flex gap-2">
                            <button
                                class="btn btn-primary btn-sm"
                                disabled={!editName.trim()}
                                onclick={() => void confirmCreate()}
                            >
                                <PlusIcon size={16} /> Create
                            </button>
                            <button class="btn btn-ghost btn-sm" onclick={cancelCreate}
                                >Cancel</button
                            >
                        </div>
                    </div>
                {:else if selectedPack}
                    <!-- Pack details & sticker grid -->
                    <div class="flex items-center gap-3 mb-4">
                        <div class="flex-1">
                            <div class="form-control">
                                <input
                                    type="text"
                                    class="input input-bordered input-sm font-semibold"
                                    bind:value={editName}
                                    placeholder="Pack name"
                                />
                            </div>
                            <div class="form-control mt-1">
                                <input
                                    type="text"
                                    class="input input-bordered input-xs"
                                    bind:value={editDescription}
                                    placeholder="Description (optional)"
                                />
                            </div>
                        </div>
                        <button
                            class="btn btn-primary btn-sm gap-1"
                            onclick={() => void savePackDetails()}
                            title="Save pack details"
                        >
                            <StickerIcon size={14} /> Save
                        </button>
                    </div>

                    <!-- Action buttons -->
                    <div class="flex gap-2 mb-4 flex-wrap">
                        <button
                            class="btn btn-outline btn-sm gap-1"
                            onclick={() => openEmojiImport(selectedPack.id)}
                        >
                            <EmojiIcon size={16} /> Import Emoji
                        </button>
                        <button
                            class="btn btn-outline btn-sm gap-1"
                            onclick={() => void handleUploadImage(selectedPack.id)}
                        >
                            <ImageIcon size={16} /> Upload Image
                        </button>
                    </div>

                    <!-- Sticker grid -->
                    {#if selectedPack.stickers.length === 0}
                        <div
                            class="flex flex-col items-center justify-center py-12 text-base-content/40"
                        >
                            <StickerIcon size={40} class="mb-2 opacity-30" />
                            <p class="text-sm">No stickers yet</p>
                            <p class="text-xs mt-1">
                                Import emoji or upload images to get started.
                            </p>
                        </div>
                    {:else}
                        <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                            {#each selectedPack.stickers as sticker, i (sticker.id)}
                                <div
                                    class="relative group flex flex-col items-center gap-1 p-2 rounded-lg border border-base-300/40 bg-base-200/30 hover:bg-base-300/30 transition-colors"
                                >
                                    <!-- Reorder buttons -->
                                    {#if selectedPack.stickers.length > 1}
                                        <div
                                            class="absolute top-0.5 left-0.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <button
                                                class="btn btn-ghost btn-xs btn-square p-0 w-4 h-4 min-h-0"
                                                disabled={i === 0}
                                                onclick={() =>
                                                    void moveSticker(selectedPack.id, i, i - 1)}
                                                aria-label="Move up"
                                            >
                                                <CaretUpIcon size={10} />
                                            </button>
                                            <button
                                                class="btn btn-ghost btn-xs btn-square p-0 w-4 h-4 min-h-0"
                                                disabled={i === selectedPack.stickers.length - 1}
                                                onclick={() =>
                                                    void moveSticker(selectedPack.id, i, i + 1)}
                                                aria-label="Move down"
                                            >
                                                <CaretDownIcon size={10} />
                                            </button>
                                        </div>
                                    {/if}

                                    <!-- Delete button -->
                                    <button
                                        class="absolute top-0.5 right-0.5 btn btn-ghost btn-xs btn-square p-0 w-4 h-4 min-h-0 text-error/60 hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                                        onclick={() =>
                                            void deleteSticker(selectedPack.id, sticker.id)}
                                        aria-label="Delete sticker"
                                    >
                                        <XIcon size={10} />
                                    </button>

                                    <!-- Sticker preview -->
                                    {#if sticker.emoji}
                                        <span class="text-2xl">{sticker.emoji}</span>
                                    {:else if sticker.imageUrl}
                                        <img
                                            src={sticker.imageUrl}
                                            alt={sticker.name}
                                            class="w-10 h-10 object-contain rounded"
                                        />
                                    {:else}
                                        <span
                                            class="w-10 h-10 flex items-center justify-center text-base-content/30 text-xs"
                                        >
                                            ?
                                        </span>
                                    {/if}

                                    <span
                                        class="text-[10px] text-base-content/50 truncate w-full text-center leading-tight"
                                    >
                                        {sticker.name}
                                    </span>
                                </div>
                            {/each}
                        </div>
                    {/if}
                {:else}
                    <div
                        class="flex flex-col items-center justify-center h-full text-base-content/40"
                    >
                        <StickerIcon size={48} class="mb-3 opacity-30" />
                        <p class="text-sm">Select a pack or create a new one</p>
                    </div>
                {/if}
            </main>
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button onclick={close}>close</button>
    </form>
</dialog>

<!-- Emoji Import sub-dialog -->
<dialog bind:this={importEmojiDialog} class="modal" aria-label="Import Emoji">
    <div
        class="modal-box w-11/12 max-w-md h-[60vh] p-0 flex flex-col overflow-hidden bg-base-100 text-base-content shadow-2xl"
    >
        <header
            class="flex items-center justify-between p-3 border-b border-base-300/50 bg-base-200/80 shrink-0"
        >
            <h3 class="font-semibold text-sm flex items-center gap-2">
                <EmojiIcon size={18} /> Import Emoji to Pack
            </h3>
            <button
                class="btn btn-ghost btn-xs btn-square hover:bg-base-300/50"
                onclick={closeEmojiImport}
                aria-label="Close"
            >
                <XIcon size={14} />
            </button>
        </header>

        <!-- Search -->
        <div class="px-3 py-2 bg-base-200/40 shrink-0">
            <input
                type="text"
                placeholder="Search emoji..."
                class="input input-sm input-bordered w-full bg-base-100/60"
                bind:value={emojiSearchQuery}
            />
        </div>

        <!-- Emoji grid -->
        <div class="flex-1 overflow-y-auto p-3">
            <div class="grid grid-cols-8 sm:grid-cols-10 gap-1">
                {#each filteredImportEmojis as emoji (emoji.char)}
                    <button
                        class="btn btn-ghost btn-sm p-0 h-10 w-10 text-xl flex items-center justify-center rounded-lg hover:bg-base-300/50"
                        title={`Click to import "${emoji.name}"`}
                        onclick={() => void importEmoji(emoji.char, emoji.name)}
                    >
                        {emoji.char}
                    </button>
                {/each}
            </div>
            {#if filteredImportEmojis.length === 0}
                <p class="text-center text-base-content/40 py-8 text-sm">No emoji found</p>
            {/if}
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button onclick={closeEmojiImport}>close</button>
    </form>
</dialog>
