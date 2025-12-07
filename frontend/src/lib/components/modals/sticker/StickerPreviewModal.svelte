<script lang="ts">
    import { createEventDispatcher, onMount, onDestroy } from "svelte";
    import { fade } from "svelte/transition";
    import { X, Image, Hash, Download, Copy, RefreshCw } from "lucide-svelte";
    import { t } from "$root/i18n";
    import PreviewTab from "./tabs/PreviewTab.svelte";
    import RerollTab from "./tabs/RerollTab.svelte";
    import ActionsTab from "./tabs/ActionsTab.svelte";
    import type { Sticker } from "$types/character";

    export let isOpen = false;
    export let sticker: Sticker | null = null;
    export let index: number | null = null;

    let activeTab = "preview";

    const dispatch = createEventDispatcher();

    function closeModal() {
        dispatch("close");
    }

    function handleSave(event: CustomEvent) {
        dispatch("save", event.detail);
    }

    function handleDelete() {
        dispatch("delete");
    }

    function handleCopy() {
        dispatch("copy");
    }

    function handleDownload() {
        dispatch("download");
    }

    function handleReroll(event: CustomEvent) {
        dispatch("reroll", event.detail);
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Escape") {
            closeModal();
        }
    }

    onMount(() => {
        window.addEventListener("keydown", handleKeydown);
    });

    onDestroy(() => {
        window.removeEventListener("keydown", handleKeydown);
    });
</script>

{#if isOpen && sticker}
    <div
        transition:fade={{ duration: 200 }}
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 w-full h-full"
    >
        <div
            role="dialog"
            aria-modal="true"
            tabindex="0"
            aria-labelledby="sticker-preview-title"
            class="bg-gray-800 rounded-2xl w-full max-w-4xl mx-4 flex flex-col max-h-[90vh]"
            on:click|stopPropagation
            on:keydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                }
            }}
        >
            <div
                class="flex items-center justify-between p-6 border-b border-gray-700 shrink-0"
            >
                <h3
                    id="sticker-preview-title"
                    class="text-lg font-semibold text-white"
                >
                    {t("stickerPreview.title")}
                </h3>
                <button
                    on:click={closeModal}
                    class="p-1 hover:bg-gray-700 rounded-full"
                    ><X class="w-5 h-5" /></button
                >
            </div>

            <div class="flex flex-1 min-h-0">
                <!-- Left Panel: Tabs -->
                <div
                    class="w-56 border-r border-gray-700 bg-gray-800/50 p-4 flex flex-col gap-2"
                >
                    <button
                        on:click={() => (activeTab = "preview")}
                        class="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 {activeTab ===
                        'preview'
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-700'}"
                    >
                        <Image class="w-4 h-4" />
                        {t("stickerPreview.preview")}
                    </button>
                    <button
                        on:click={() => (activeTab = "reroll")}
                        class="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 {activeTab ===
                        'reroll'
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-700'}"
                        disabled={!sticker.generated}
                    >
                        <RefreshCw class="w-4 h-4" />
                        {t("stickerPreview.reroll")}
                    </button>
                    <button
                        on:click={() => (activeTab = "actions")}
                        class="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 {activeTab ===
                        'actions'
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-700'}"
                    >
                        <Download class="w-4 h-4" />
                        {t("stickerPreview.actions")}
                    </button>
                </div>

                <!-- Right Panel: Content -->
                <div class="flex-1 p-6 overflow-y-auto">
                    {#if activeTab === "preview"}
                        <PreviewTab {sticker} on:save={handleSave} />
                    {:else if activeTab === "reroll"}
                        <RerollTab {sticker} on:reroll={handleReroll} />
                    {:else if activeTab === "actions"}
                        <ActionsTab
                            on:delete={handleDelete}
                            on:copy={handleCopy}
                            on:download={handleDownload}
                        />
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}
