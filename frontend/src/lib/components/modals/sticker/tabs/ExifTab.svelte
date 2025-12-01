<script>
import { t } from "$root/i18n";
import { ChevronRight } from "lucide-svelte";

export let exifData = null;
</script>

{#if !exifData}
    <div class="text-center py-8">
        <i
            data-lucide="loader"
            class="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin"
        ></i>
        <p class="text-gray-400">{t("stickerPreview.loadingExif")}</p>
    </div>
{:else if !exifData.basic && !exifData.nai && !exifData.raw}
    <div class="text-center py-8">
        <i data-lucide="info" class="w-8 h-8 text-gray-400 mx-auto mb-2"></i>
        <p class="text-gray-400">{t("stickerPreview.noExifData")}</p>
    </div>
{:else}
    <div class="space-y-4">
        {#if exifData.nai && Object.keys(exifData.nai).length > 0}
            <div>
                <h4 class="text-sm font-medium text-white mb-2">
                    {t("stickerPreview.naiInfo")}
                </h4>
                <div class="bg-gray-700 rounded-lg p-3 space-y-3 text-xs">
                    {#if exifData.nai.prompt}
                        <div>
                            <span class="text-gray-300 block mb-1"
                                >{t("stickerPreview.prompt")}:</span
                            >
                            <div
                                class="bg-gray-600 rounded p-2 text-white text-xs max-h-32 overflow-y-auto"
                            >
                                {exifData.nai.prompt}
                            </div>
                        </div>
                    {/if}
                    {#if exifData.nai.negativePrompt}
                        <div>
                            <span class="text-gray-300 block mb-1"
                                >{t("stickerPreview.negativePrompt")}:</span
                            >
                            <div
                                class="bg-gray-600 rounded p-2 text-white text-xs max-h-24 overflow-y-auto"
                            >
                                {exifData.nai.negativePrompt}
                            </div>
                        </div>
                    {/if}
                    {#each Object.entries(exifData.nai).filter(([key]) => !["prompt", "negativePrompt"].includes(key)) as [key, value]}
                        <div class="flex justify-between">
                            <span class="text-gray-300">{key}:</span>
                            <span class="text-white">{value}</span>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}

        {#if exifData.raw && Object.keys(exifData.raw).length > 0}
            <div>
                <details class="group">
                    <summary
                        class="cursor-pointer text-sm font-medium text-white mb-2 flex items-center"
                    >
                        <ChevronRight
                            class="w-4 h-4 mr-1 transition-transform group-open:rotate-90"
                        />
                        {t("stickerPreview.allMetadata")}
                    </summary>
                    <div
                        class="bg-gray-700 rounded-lg p-3 mt-2 space-y-2 text-xs max-h-96 overflow-y-auto"
                    >
                        {#each Object.entries(exifData.raw) as [key, value]}
                            <div
                                class="border-b border-gray-600 pb-2 last:border-b-0"
                            >
                                <div class="text-gray-300 font-medium mb-1">
                                    {key}:
                                </div>
                                <div
                                    class="text-white break-all whitespace-pre-wrap"
                                >
                                    {String(value)}
                                </div>
                            </div>
                        {/each}
                    </div>
                </details>
            </div>
        {/if}
    </div>
{/if}
