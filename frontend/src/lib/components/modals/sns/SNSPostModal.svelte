<script>
import { onMount, onDestroy } from "svelte";
import { t } from "$root/i18n";
import { createEventDispatcher } from "svelte";
import { fade } from "svelte/transition";
import { X, Image, Plus } from "lucide-svelte";
import { characters } from "../../../stores/character";

export let isOpen = false;
export let editingPost = null;

const dispatch = createEventDispatcher();

let character = null;
let postContent = "";
let tags = [];
let accessLevel = "main-public";
let importance = 5;
let stickerId = null;
let showStickerPanel = false;

$: {
    if (editingPost) {
        character = $characters.find((c) => c.id === editingPost.characterId);
        postContent = editingPost.content || "";
        tags = editingPost.tags || [];
        accessLevel =
            editingPost.accessLevel ||
            (editingPost.isSecret ? "secret-public" : "main-public");
        importance = editingPost.importance || 5;
        stickerId = editingPost.stickerId || null;
    }
}

function closeModal() {
    dispatch("close");
}

function savePost() {
    const post = {
        ...editingPost,
        content: postContent,
        tags,
        accessLevel,
        importance,
        stickerId,
    };
    dispatch("save", post);
    closeModal();
}

function getStickerUrl(id) {
    if (!character || !character.stickers) return "";
    const sticker = character.stickers.find((s) => s.id == id);
    return sticker ? sticker.data || sticker.dataUrl : "";
}

function handleKeydown(event) {
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

{#if isOpen && editingPost && character}
    <div
        transition:fade={{ duration: 200 }}
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
        <div
            role="dialog"
            aria-modal="true"
            tabindex="0"
            aria-labelledby="sns-post-modal-title"
            class="bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
            on:click|stopPropagation
            on:keydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                }
            }}
        >
            <div class="flex justify-between items-center mb-4">
                <h2
                    id="sns-post-modal-title"
                    class="text-lg font-semibold text-white"
                >
                    {editingPost.isNew
                        ? t("sns.createPost")
                        : t("sns.editPost")}
                </h2>
                <button
                    on:click={closeModal}
                    class="text-gray-400 hover:text-white"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>

            <div class="mb-4">
                <div class="flex items-center gap-3 mb-3">
                    {#if character.avatar}
                        <img
                            src={character.avatar}
                            alt={character.name}
                            class="w-10 h-10 rounded-full object-cover"
                        />
                    {:else}
                        <div
                            class="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center"
                        >
                            <i
                                data-lucide="instagram"
                                class="w-6 h-6 text-gray-400"
                            ></i>
                        </div>
                    {/if}
                    <div>
                        <span class="text-white font-medium"
                            >{character.name}</span
                        >
                        <div class="text-xs text-gray-400">
                            {editingPost.isSecret
                                ? t("sns.secretAccountWarning")
                                : ""}
                        </div>
                    </div>
                </div>

                {#if stickerId}
                    <div class="mb-4 bg-gray-700 rounded-lg p-4">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm text-gray-300"
                                >{t("sns.selectedSticker")}</span
                            >
                            <button
                                on:click={() => (stickerId = null)}
                                class="text-red-400 hover:text-red-300 text-sm"
                            >
                                {t("common.remove")}
                            </button>
                        </div>
                        <div class="bg-gray-600 rounded p-3">
                            <img
                                src={getStickerUrl(stickerId)}
                                alt="Selected sticker"
                                class="max-w-full max-h-32 mx-auto object-contain"
                            />
                        </div>
                    </div>
                {/if}

                <div class="mb-3">
                    <button
                        on:click={() => (showStickerPanel = !showStickerPanel)}
                        class="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
                    >
                        <Image class="w-4 h-4 inline mr-2" />
                        {stickerId
                            ? t("sns.changeSticker")
                            : t("sns.selectSticker")}
                    </button>
                </div>

                {#if showStickerPanel}
                    <div
                        class="mb-4 bg-gray-700 rounded-lg p-3 max-h-48 overflow-y-auto"
                    >
                        <div class="grid grid-cols-4 gap-2">
                            {#if character.stickers && character.stickers.length > 0}
                                {#each character.stickers as sticker (sticker.id)}
                                    <button
                                        on:click={() => {
                                            stickerId = sticker.id;
                                            showStickerPanel = false;
                                        }}
                                        class="p-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
                                    >
                                        <img
                                            src={sticker.data ||
                                                sticker.dataUrl}
                                            alt={sticker.name}
                                            class="w-full h-16 object-contain"
                                        />
                                        <div
                                            class="text-xs text-gray-400 mt-1 truncate"
                                        >
                                            {sticker.name || ""}
                                        </div>
                                    </button>
                                {/each}
                            {:else}
                                <div
                                    class="col-span-4 text-center text-gray-400 py-4"
                                >
                                    {t("sns.noStickers")}
                                </div>
                            {/if}
                        </div>
                    </div>
                {/if}

                <textarea
                    bind:value={postContent}
                    class="w-full bg-gray-700 text-white rounded-lg p-3 resize-none h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t("sns.postPlaceholder")}
                ></textarea>

                <div class="mt-3">
                    <label
                        for="sns-tags"
                        class="text-sm text-gray-400 mb-1 block"
                        >{t("sns.tags")}</label
                    >
                    <input type="text" id="sns-tags" class="hidden" />
                    <!-- Placeholder for tag input -->
                    <!-- Tag input logic here -->
                </div>

                <div class="mt-3">
                    <label
                        for="sns-access-level"
                        class="text-sm text-gray-400 mb-1 block"
                        >{t("sns.accessLevel")}</label
                    >
                    <select
                        id="sns-access-level"
                        bind:value={accessLevel}
                        class="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {#if editingPost.isSecret}
                            <option value="secret-public"
                                >{t("sns.secretPublic")} - {t(
                                    "sns.secretPublicDesc"
                                )}</option
                            >
                            <option value="secret-private"
                                >{t("sns.secretPrivate")} - {t(
                                    "sns.secretPrivateDesc"
                                )}</option
                            >
                        {:else}
                            <option value="main-public"
                                >{t("sns.mainPublic")} - {t(
                                    "sns.mainPublicDesc"
                                )}</option
                            >
                            <option value="main-private"
                                >{t("sns.mainPrivate")} - {t(
                                    "sns.mainPrivateDesc"
                                )}</option
                            >
                        {/if}
                    </select>
                </div>

                <div class="mt-3">
                    <label
                        for="sns-importance"
                        class="text-sm text-gray-400 mb-1 block"
                        >{t("sns.importance")}: <span>{importance}</span></label
                    >
                    <input
                        id="sns-importance"
                        bind:value={importance}
                        type="range"
                        min="1"
                        max="10"
                        class="w-full"
                    />
                </div>
            </div>

            <div class="flex gap-3 justify-end">
                <button
                    on:click={closeModal}
                    class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                    {t("common.cancel")}
                </button>
                <button
                    on:click={savePost}
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                >
                    {editingPost.isNew ? t("common.create") : t("common.save")}
                </button>
            </div>
        </div>
    </div>
{/if}
