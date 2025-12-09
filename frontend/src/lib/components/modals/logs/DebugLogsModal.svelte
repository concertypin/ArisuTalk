<script lang="ts">
import { t } from "$root/i18n";
import { BarChart3, Download, FileX, Trash2, X } from "lucide-svelte";
import { onDestroy, onMount } from "svelte";
import { fade } from "svelte/transition";

import { clearDebugLogs, exportDebugLogs } from "../../../services/logService";
import { debugLogs } from "../../../stores/logs";
import { settings } from "../../../stores/settings";
import { isDebugLogModalVisible } from "../../../stores/ui";
import SimpleLog from "./SimpleLog.svelte";
import StructuredLog from "./StructuredLog.svelte";

const maxLogs = 1000;

function handleClearLogs() {
    if (
        confirm(
            t("debugLogs.clearAllConfirm", {
                defaultValue: "Are you sure you want to clear all debug logs?",
            }),
        )
    ) {
        clearDebugLogs();
    }
}

function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
        isDebugLogModalVisible.set(false);
    }
}

onMount(() => {
    window.addEventListener("keydown", handleKeydown);
});

onDestroy(() => {
    window.removeEventListener("keydown", handleKeydown);
});
</script>

{#if $isDebugLogModalVisible}
    <div
        transition:fade={{ duration: 200 }}
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
        <div
            role="dialog"
            aria-modal="true"
            tabindex="0"
            aria-labelledby="debug-logs-title"
            class="bg-gray-800 rounded-lg w-full max-w-6xl h-[90vh] flex flex-col"
            on:click|stopPropagation
            on:keydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                }
            }}
        >
            <!-- Header -->
            <div class="p-6 border-b border-gray-600">
                <div
                    class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
                >
                    <div>
                        <h2
                            id="debug-logs-title"
                            class="text-xl font-bold text-white flex items-center gap-2"
                        >
                            <BarChart3 class="w-5 h-5" />
                            {t("debugLogs.systemDebugLogs")}
                        </h2>
                        <p class="text-gray-400 text-sm mt-1">
                            {t("debugLogs.totalLogItems")}
                            {$debugLogs.length}/{maxLogs}{t(
                                "debugLogs.maxLogItems"
                            )} |
                            {t("debugLogs.logCollectionStatus")}
                            {$settings.enableDebugLogs
                                ? t("debugLogs.enabled")
                                : t("debugLogs.disabled")}
                        </p>
                    </div>
                    <div
                        class="flex flex-wrap justify-end gap-2 w-full sm:w-auto sm:flex-nowrap"
                    >
                        {#if $debugLogs.length > 0}
                            <button
                                on:click={exportDebugLogs}
                                class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 text-sm"
                            >
                                <Download class="w-4 h-4" />
                                {t("debugLogs.export")}
                            </button>
                            <button
                                on:click={handleClearLogs}
                                class="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-2 text-sm"
                            >
                                <Trash2 class="w-4 h-4" />
                                {t("debugLogs.clearAll")}
                            </button>
                        {/if}
                        <button
                            on:click={() => isDebugLogModalVisible.set(false)}
                            class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm"
                        >
                            {t("debugLogs.close")}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-hidden">
                {#if $debugLogs.length === 0}
                    <div
                        class="flex flex-col items-center justify-center h-full text-gray-400"
                    >
                        <FileX class="w-16 h-16 mb-4" />
                        <h3 class="text-lg font-medium mb-2">
                            {t("debugLogs.noLogs")}
                        </h3>
                        <p class="text-sm text-center">
                            {@html $settings.enableDebugLogs
                                ? t("debugLogs.noLogsCollected")
                                : t("debugLogs.logsDisabled")}
                        </p>
                    </div>
                {:else}
                    <div class="p-6 h-full overflow-auto">
                        <div class="space-y-4">
                            {#each $debugLogs
                                .slice()
                                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) as log (log.id)}
                                {#if log.type === "structured"}
                                    <StructuredLog {log} />
                                {:else}
                                    <SimpleLog {log} />
                                {/if}
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}
