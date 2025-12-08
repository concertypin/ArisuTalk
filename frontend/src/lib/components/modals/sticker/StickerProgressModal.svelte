<script lang="ts">
import { t } from "$root/i18n";
import { createEventDispatcher } from "svelte";
import { fade } from "svelte/transition";
import { X, Check, RefreshCw, AlertCircle, Clock } from "lucide-svelte";
import type {
    StickerGenerationProgress,
    StickerEmotion,
} from "$types/character";

export let progress: StickerGenerationProgress | null = null;

const dispatch = createEventDispatcher();

function cancel() {
    dispatch("cancel");
}

function close() {
    dispatch("close");
}

function retry() {
    dispatch("retry");
}

function getStatusBgColor(status: StickerGenerationProgress["status"]) {
    switch (status) {
        case "generating":
            return "bg-blue-50";
        case "completed":
            return "bg-green-50";
        case "error":
            return "bg-red-50";
        case "waiting":
            return "bg-yellow-50";
        default:
            return "bg-gray-50";
    }
}

function getStatusTextColor(status: StickerGenerationProgress["status"]) {
    switch (status) {
        case "generating":
            return "text-blue-800";
        case "completed":
            return "text-green-800";
        case "error":
            return "text-red-800";
        case "waiting":
            return "text-yellow-800";
        default:
            return "text-gray-800";
    }
}

function getStatusText(
    status: StickerGenerationProgress["status"],
    currentEmotion?: StickerEmotion,
) {
    switch (status) {
        case "generating": {
            let emotionKey, emotionDisplayName;
            if (
                typeof currentEmotion === "object" &&
                currentEmotion !== null &&
                "emotion" in currentEmotion
            ) {
                emotionKey = currentEmotion.emotion;
                emotionDisplayName =
                    currentEmotion.title || currentEmotion.emotion;
            } else if (typeof currentEmotion === "string") {
                emotionKey = currentEmotion;
                emotionDisplayName = currentEmotion;
            } else {
                emotionKey = "unknown";
                emotionDisplayName = "Unknown";
            }

            const emotionTranslation =
                typeof currentEmotion === "object" &&
                currentEmotion !== null &&
                currentEmotion.title
                    ? emotionDisplayName
                    : t(`stickerProgress.emotions.${emotionKey}`) ||
                      emotionDisplayName;
            return t("stickerProgress.statuses.generating", {
                emotion: emotionTranslation,
            });
        }
        case "completed":
            return t("stickerProgress.statuses.completed");
        case "error":
            return t("stickerProgress.statuses.error");
        case "waiting":
            return t("stickerProgress.statuses.waiting");
        default:
            return t("stickerProgress.statuses.preparing");
    }
}
</script>

{#if progress && progress.isVisible}
    <div
        transition:fade={{ duration: 200 }}
        class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center"
    >
        <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium text-gray-900">
                    {t("stickerProgress.title", {
                        name:
                            progress.character?.name ||
                            t("stickerProgress.defaultCharacter"),
                    })}
                </h3>
                <div>
                    {#if progress.status === "generating"}
                        <button
                            on:click={cancel}
                            class="text-red-400 hover:text-red-600 p-1"
                            title={t("stickerProgress.cancel")}
                        >
                            <X class="w-6 h-6" />
                        </button>
                    {/if}
                    {#if progress.status === "completed" || progress.status === "error"}
                        <button
                            on:click={close}
                            class="text-gray-400 hover:text-gray-600 p-1"
                        >
                            <X class="w-6 h-6" />
                        </button>
                    {/if}
                </div>
            </div>

            <div class="mb-4">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sm font-medium text-gray-700"
                        >{t("stickerProgress.overallProgress")}</span
                    >
                    <span class="text-sm text-gray-500"
                        >{progress.currentIndex}/{progress.totalCount}</span
                    >
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div
                        class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style="width: {Math.round(
                            (progress.currentIndex / progress.totalCount) * 100
                        )}%"
                    ></div>
                </div>
            </div>

            <div
                class="mb-4 p-3 rounded-lg {getStatusBgColor(progress.status)}"
            >
                <div class="flex items-center">
                    {#if progress.status === "generating"}
                        <RefreshCw
                            class="w-5 h-5 animate-spin {getStatusTextColor(
                                progress.status
                            )}"
                        />
                    {:else if progress.status === "completed"}
                        <Check
                            class="w-5 h-5 {getStatusTextColor(
                                progress.status
                            )}"
                        />
                    {:else if progress.status === "error"}
                        <AlertCircle
                            class="w-5 h-5 {getStatusTextColor(
                                progress.status
                            )}"
                        />
                    {:else if progress.status === "waiting"}
                        <Clock
                            class="w-5 h-5 {getStatusTextColor(
                                progress.status
                            )}"
                        />
                    {/if}
                    <div class="ml-3">
                        <p
                            class="text-sm font-medium {getStatusTextColor(
                                progress.status
                            )}"
                        >
                            {getStatusText(
                                progress.status,
                                progress.currentEmotion
                            )}
                        </p>
                        {#if progress.error}
                            <p class="text-xs text-red-600 mt-1">
                                {progress.error}
                            </p>
                        {/if}
                    </div>
                </div>
            </div>

            <div class="mb-4">
                <h4 class="text-sm font-medium text-gray-700 mb-2">
                    {t("stickerProgress.emotionsToGenerate")}
                </h4>
                <div class="grid grid-cols-5 gap-2">
                    {#each progress.emotions as emotion, index}
                        {@const isCompleted = progress.generatedStickers.some(
                            (s) =>
                                s.emotion ===
                                (typeof emotion === "string"
                                    ? emotion
                                    : emotion.emotion)
                        )}
                        {@const isCurrent = index === progress.currentIndex - 1}
                        {@const isError = progress.failedEmotions?.includes(
                            typeof emotion === "string"
                                ? emotion
                                : emotion.emotion
                        )}
                        <div class="text-center">
                            <div
                                class="w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center text-xs font-medium
                {isError
                                    ? 'bg-red-100 text-red-700'
                                    : isCompleted
                                      ? 'bg-green-100 text-green-700'
                                      : isCurrent
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-500'}"
                            >
                                {isError
                                    ? "✗"
                                    : isCompleted
                                      ? "✓"
                                      : isCurrent
                                        ? "⟳"
                                        : "○"}
                            </div>
                            <span class="text-xs text-gray-600"
                                >{typeof emotion === "object" && emotion.title
                                    ? emotion.title
                                    : t(
                                          `stickerProgress.emotions.${typeof emotion === "string" ? emotion : emotion.emotion}`
                                      ) ||
                                      (typeof emotion === "string"
                                          ? emotion
                                          : emotion.emotion)}</span
                            >
                        </div>
                    {/each}
                </div>
            </div>

            {#if progress.generatedStickers.length > 0}
                <div class="mb-4">
                    <h4 class="text-sm font-medium text-gray-700 mb-2">
                        {t("stickerProgress.completedStickers")}
                    </h4>
                    <div class="flex flex-wrap gap-2">
                        {#each progress.generatedStickers.slice(-3) as sticker}
                            <div class="relative">
                                <img
                                    src={sticker.dataUrl}
                                    alt={sticker.name}
                                    class="w-12 h-12 rounded object-cover"
                                />
                                <div
                                    class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
                                >
                                    <Check class="w-2 h-2 text-white" />
                                </div>
                            </div>
                        {/each}
                        {#if progress.generatedStickers.length > 3}
                            <div
                                class="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500"
                            >
                                +{progress.generatedStickers.length - 3}
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}

            {#if progress.status === "waiting" && progress.waitTime}
                <div class="bg-yellow-50 p-3 rounded-lg">
                    <p class="text-sm text-yellow-800">
                        {t("stickerProgress.waitingMessage", {
                            seconds: String(Math.ceil(progress.waitTime / 1000)),
                        })}
                    </p>
                </div>
            {/if}

            {#if progress.status === "completed" || progress.status === "error"}
                <div class="flex justify-end space-x-3">
                    {#if progress.status === "error" && progress.canRetry}
                        <button
                            on:click={retry}
                            class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                        >
                            {t("stickerProgress.retry")}
                        </button>
                    {/if}
                    <button
                        on:click={close}
                        class="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400"
                    >
                        {progress.status === "completed"
                            ? t("stickerProgress.completed")
                            : t("stickerProgress.close")}
                    </button>
                </div>
            {/if}
        </div>
    </div>
{/if}
