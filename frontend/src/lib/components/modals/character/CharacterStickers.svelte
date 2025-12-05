<script lang="ts">
    import { t } from "$root/i18n";
    import { get } from "svelte/store";
    import {
        Plus,
        CheckSquare,
        CheckCircle,
        Trash2,
        Edit3,
        Music,
        X,
        Sparkles,
    } from "lucide-svelte";
    import { stickerManager } from "../../../stores/services";
    import { settings } from "../../../stores/settings";
    import { editingCharacter } from "../../../stores/character";
    import StickerProgressModal from "../sticker/StickerProgressModal.svelte";
    import StickerPreviewModal from "../sticker/StickerPreviewModal.svelte";

    export let stickers = [];

    let selectionMode = false;
    let selectedStickers = [];
    let stickerInput;
    let showProgressModal = false;
    let progressData = {};
    let showPreviewModal = false;
    let previewSticker = null;
    let previewIndex = null;

    // --- File Handling (from UserStickerPanel.svelte) ---

    function addStickers() {
        stickerInput.click();
    }

    async function handleFileChange(event) {
        const files = Array.from(event.target.files);
        if (!files.length) return;

        for (const file of files) {
            const allowedTypes = [
                "image/jpeg",
                "image/jpg",
                "image/gif",
                "image/png",
                "image/bmp",
                "image/webp",
                "video/webm",
                "video/mp4",
                "audio/mpeg",
                "audio/mp3",
            ];
            if (!allowedTypes.includes(file.type)) {
                alert(`${file.name}${t("modal.unsupportedFileType.message")}`);
                continue;
            }

            if (file.size > 30 * 1024 * 1024) {
                // 30MB limit
                alert(`${file.name}${t("modal.fileTooLarge.message")}`);
                continue;
            }

            try {
                let dataUrl;
                if (file.type.startsWith("image/")) {
                    dataUrl = await compressImage(file, 1024, 1024, 0.85);
                } else {
                    dataUrl = await toBase64(file);
                }
                const stickerName =
                    file.name.split(".").slice(0, -1).join(".") || file.name;
                const newSticker = {
                    id: `sticker_${Date.now()}_${Math.random()}`,
                    name: stickerName,
                    data: dataUrl,
                    type: file.type,
                    createdAt: Date.now(),
                };
                stickers = [...stickers, newSticker];
            } catch (error) {
                console.error(t("ui.fileProcessingError"), error);
                alert(t("ui.fileProcessingAlert"));
            }
        }
        event.target.value = ""; // Reset file input
    }

    function toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    }

    function compressImage(file, maxWidth, maxHeight, quality) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL(file.type, quality));
            };
            img.onerror = (error) => reject(error);
        });
    }

    // --- Sticker Management ---

    function openPreviewModal(sticker, index) {
        previewSticker = sticker;
        previewIndex = index;
        showPreviewModal = true;
    }

    function handleSaveSticker(event) {
        const { name } = event.detail;
        stickers[previewIndex].name = name;

        stickers = stickers;
        showPreviewModal = false;
    }

    function handleDeleteSticker() {
        stickers = stickers.filter((_, i) => i !== previewIndex);
        showPreviewModal = false;
    }

    function handleCopySticker() {
        navigator.clipboard.writeText(previewSticker.dataUrl);
        alert("Copied to clipboard!");
    }

    function handleDownloadSticker() {
        const link = document.createElement("a");
        link.href = previewSticker.dataUrl;
        link.download = previewSticker.name;
        link.click();
    }

    async function handleRerollSticker(event) {
        // TODO: Implement reroll logic
    }

    // --- Selection Mode ---

    function toggleSelectionMode() {
        selectionMode = !selectionMode;
        if (!selectionMode) {
            selectedStickers = [];
        }
    }

    function selectAll() {
        if (selectedStickers.length === stickers.length) {
            selectedStickers = [];
        } else {
            selectedStickers = stickers.map((s) => s.id);
        }
    }

    function deleteSelected() {
        if (
            confirm(
                t("stickerPreview.confirmRemoveMultiple", {
                    count: selectedStickers.length,
                })
            )
        ) {
            stickers = stickers.filter((s) => !selectedStickers.includes(s.id));
            selectionMode = false;
            selectedStickers = [];
        }
    }

    function calculateSize() {
        if (!stickers || stickers.length === 0) return "0 Bytes";
        const totalBytes = stickers.reduce((acc, sticker) => {
            if (sticker.data) {
                const base64Length = sticker.data.split(",")[1]?.length || 0;
                return acc + base64Length * 0.75;
            }
            return acc;
        }, 0);

        if (totalBytes < 1024) return `${totalBytes.toFixed(0)} Bytes`;
        if (totalBytes < 1024 * 1024)
            return `${(totalBytes / 1024).toFixed(2)} KB`;
        return `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    async function generateStickers() {
        const naiApiKey = get(settings).apiConfigs.novelai?.apiKey;
        if (!naiApiKey) {
            alert(
                "NAI API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요."
            );
            return;
        }

        showProgressModal = true;
        progressData = {
            isVisible: true,
            character: get(editingCharacter),
            emotions: get(settings).naiGenerationList || [],
            currentIndex: 0,
            totalCount: get(settings).naiGenerationList?.length || 0,
            currentEmotion: "",
            status: "preparing",
            error: null,
            generatedStickers: [],
        };

        await get(stickerManager).generateBasicStickerSet(
            get(editingCharacter),
            (progress) => {
                progressData = { ...progressData, ...progress };
            }
        );
    }
</script>

<details class="group border-t border-gray-700/50 pt-4">
    <summary class="flex items-center justify-between cursor-pointer list-none">
        <span class="text-base font-medium text-gray-200"
            >{t("characterModal.sticker")}</span
        >
        <slot name="chevron" />
    </summary>
    <div class="pt-4 space-y-4">
        <div
            class="flex items-center justify-between mb-3 text-xs text-gray-400"
        >
            <span>{t("mainChat.stickerCount", { count: stickers.length })}</span
            >
            <span>{t("characterModal.totalSize")} {calculateSize()}</span>
        </div>

        <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
                <button
                    on:click={addStickers}
                    class="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                >
                    <Plus class="w-4 h-4" />
                    <span>{@html t("characterModal.addSticker")}</span>
                </button>
                <button
                    on:click={generateStickers}
                    class="py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                >
                    <Sparkles class="w-4 h-4" />
                    <span>{t("naiHandlers.emotionListGeneration")}</span>
                </button>
                <input
                    type="file"
                    accept="image/*,video/*,audio/*"
                    bind:this={stickerInput}
                    on:change={handleFileChange}
                    class="hidden"
                    multiple
                />
            </div>
            {#if stickers.length > 0}
                <div class="flex items-center gap-2">
                    <button
                        on:click={toggleSelectionMode}
                        class="py-2 px-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm flex items-center gap-1"
                    >
                        <CheckSquare class="w-4 h-4" />
                        <span class="text-xs"
                            >{selectionMode
                                ? t("characterModal.deselect")
                                : t("characterModal.selectMode")}</span
                        >
                    </button>
                    {#if selectionMode}
                        <button
                            on:click={selectAll}
                            class="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex items-center gap-1"
                        >
                            <CheckCircle class="w-4 h-4" />
                            <span class="text-xs"
                                >{t("characterModal.selectAll")}</span
                            >
                        </button>
                        <button
                            on:click={deleteSelected}
                            class="py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm flex items-center gap-1"
                            disabled={selectedStickers.length === 0}
                        >
                            <Trash2 class="w-4 h-4" />
                            <span class="text-xs"
                                >{t("characterModal.deleteSelected").replace(
                                    "0",
                                    selectedStickers.length
                                )}</span
                            >
                        </button>
                    {/if}
                </div>
            {/if}
        </div>

        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {#if stickers.length === 0}
                <div
                    class="col-span-full text-center text-gray-400 text-sm py-4"
                >
                    <p>{t("characterModal.noStickers")}</p>
                    <button
                        on:click={addStickers}
                        class="mt-2 text-blue-400 hover:text-blue-300 text-xs"
                    >
                        {t("mainChat.addStickerButton")}
                    </button>
                </div>
            {:else}
                {#each stickers as sticker, i (sticker.id)}
                    <div
                        on:click={() => openPreviewModal(sticker, i)}
                        on:keydown={(e) => {
                            if (e.key === "Enter" || e.key === " ")
                                openPreviewModal(sticker, i);
                        }}
                        role="button"
                        tabindex="0"
                        class="sticker-item relative group aspect-square flex items-center justify-center p-1 rounded-lg bg-gray-700/50"
                        aria-label="Open sticker preview for {sticker.name}"
                    >
                        {#if selectionMode}
                            <button
                                class="absolute top-0 left-0 w-full h-full bg-black/30 flex items-center justify-center z-10"
                                on:click|stopPropagation={() => {
                                    const index = selectedStickers.indexOf(
                                        sticker.id
                                    );
                                    if (index > -1) {
                                        selectedStickers.splice(index, 1);
                                        selectedStickers = selectedStickers;
                                    } else {
                                        selectedStickers = [
                                            ...selectedStickers,
                                            sticker.id,
                                        ];
                                    }
                                }}
                                aria-label="Select sticker"
                            >
                                <div
                                    class="w-6 h-6 rounded-full flex items-center justify-center transition-all {selectedStickers.includes(
                                        sticker.id
                                    )
                                        ? 'bg-blue-600'
                                        : 'bg-gray-900/50 border-2 border-white'}"
                                >
                                    {#if selectedStickers.includes(sticker.id)}
                                        <Check class="w-4 h-4 text-white" />
                                    {/if}
                                </div>
                            </button>
                        {/if}

                        {#if sticker.type?.startsWith("video")}
                            <video
                                class="w-full h-full object-contain pointer-events-none"
                                muted
                                loop
                                autoplay
                                src={sticker.data}
                            ></video>
                        {:else if sticker.type?.startsWith("audio")}
                            <div
                                class="w-full h-full flex items-center justify-center pointer-events-none"
                            >
                                <Music class="w-8 h-8 text-gray-400" />
                            </div>
                        {:else}
                            <img
                                src={sticker.data}
                                alt={sticker.name}
                                class="w-full h-full object-contain pointer-events-none"
                            />
                        {/if}
                        <div
                            class="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] p-1 truncate rounded-b-lg pointer-events-none"
                        >
                            {sticker.name}
                        </div>

                        {#if !selectionMode}
                            <div
                                class="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 z-20"
                            >
                                <button
                                    on:click|stopPropagation={(e) =>
                                        openPreviewModal(sticker, i)}
                                    class="p-1 bg-blue-600 hover:bg-blue-700 rounded-full text-white"
                                    title={t("characterModal.editStickerName")}
                                >
                                    <Edit3 class="w-3 h-3" />
                                </button>
                                <button
                                    on:click|stopPropagation={(e) =>
                                        (stickers = stickers.filter(
                                            (s) => s.id !== sticker.id
                                        ))}
                                    class="p-1 bg-red-600 hover:bg-red-700 rounded-full text-white"
                                    title={t("characterModal.deleteSticker")}
                                >
                                    <Trash2 class="w-3 h-3" />
                                </button>
                            </div>
                        {/if}
                    </div>
                {/each}
            {/if}
        </div>
    </div>
</details>

<StickerProgressModal
    bind:progress={progressData}
    on:close={() => (showProgressModal = false)}
    on:cancel={() => get(stickerManager)?.cancelGeneration()}
/>
<StickerPreviewModal
    isOpen={showPreviewModal}
    sticker={previewSticker}
    index={previewIndex}
    on:close={() => (showPreviewModal = false)}
    on:save={handleSaveSticker}
    on:delete={handleDeleteSticker}
    on:copy={handleCopySticker}
    on:download={handleDownloadSticker}
    on:reroll={handleRerollSticker}
/>
