<script>
import { createEventDispatcher } from "svelte";
import { t } from "$root/i18n";

export let sticker = null;

let stickerName = sticker?.name || "";

const dispatch = createEventDispatcher();

function save() {
    dispatch("save", { name: stickerName });
}

function formatStickerSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
</script>

{#if sticker}
    <div class="space-y-4">
        <div class="mb-6">
            {#if sticker.type?.startsWith("audio")}
                <div
                    class="w-full h-64 bg-gray-600 rounded-lg flex flex-col items-center justify-center"
                >
                    <i data-lucide="music" class="w-16 h-16 text-gray-300 mb-4"
                    ></i>
                    <audio controls class="w-full max-w-xs">
                        <source src={sticker.dataUrl} type={sticker.type} />
                    </audio>
                </div>
            {:else if sticker.type?.startsWith("video")}
                <div class="flex justify-center">
                    <video controls class="max-w-full max-h-64 rounded-lg">
                        <source src={sticker.dataUrl} type={sticker.type} />
                        <track kind="captions" />
                    </video>
                </div>
            {:else}
                <div class="flex justify-center">
                    <img
                        src={sticker.dataUrl}
                        alt={sticker.name}
                        class="max-w-full max-h-64 rounded-lg object-contain"
                    />
                </div>
            {/if}
        </div>

        <div>
            <label
                for="sticker-name"
                class="block text-sm font-medium text-gray-300 mb-2"
            >
                {t("stickerPreview.stickerName")}
            </label>
            <input
                id="sticker-name"
                bind:value={stickerName}
                type="text"
                class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm"
                placeholder={t("stickerPreview.enterStickerName")}
            />
        </div>

        <div class="text-xs text-gray-400 space-y-1">
            <div>
                {t("stickerPreview.fileType")}: {sticker.type || "Unknown"}
            </div>
            {#if sticker.size}
                <div>
                    {t("stickerPreview.fileSize")}: {formatStickerSize(
                        sticker.size
                    )}
                </div>
            {/if}
            {#if sticker.createdAt}
                <div>
                    {t("stickerPreview.dateAdded")}: {new Date(
                        sticker.createdAt
                    ).toLocaleString()}
                </div>
            {/if}
        </div>

        <div class="flex gap-3 mt-6">
            <button
                on:click={save}
                class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
                {t("common.save")}
            </button>
        </div>
    </div>
{/if}
