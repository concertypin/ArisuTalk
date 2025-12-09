<script lang="ts">
import { t } from "$root/i18n";
import { settingsSnapshots } from "../../../../stores/settings";
import { History, Trash2 } from "lucide-svelte";
import {
	restoreSnapshot,
	deleteSnapshot,
} from "../../../../services/dataService";
</script>

<div class="space-y-2">
    {#each $settingsSnapshots as snapshot (snapshot.timestamp)}
        <div
            class="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg"
        >
            <span class="text-sm text-gray-300"
                >{new Date(snapshot.timestamp).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                })}</span
            >
            <div class="flex items-center gap-2">
                <button
                    on:click={() => restoreSnapshot(snapshot.timestamp)}
                    class="p-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
                    title={t("settings.restore")}
                >
                    <History class="w-4 h-4" />
                </button>
                <button
                    on:click={() => deleteSnapshot(snapshot.timestamp)}
                    class="p-1.5 bg-red-600 hover:bg-red-700 rounded text-white transition-colors"
                    title={t("settings.delete")}
                >
                    <Trash2 class="w-4 h-4" />
                </button>
            </div>
        </div>
    {:else}
        <p class="text-sm text-gray-500 text-center py-2">
            {t("settings.noSnapshots")}
        </p>
    {/each}
</div>
