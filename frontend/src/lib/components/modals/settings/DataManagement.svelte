<script lang="ts">
import { t } from "$root/i18n";
import { createEventDispatcher } from "svelte";
import {
    ArrowLeft,
    HardDrive,
    Download,
    Upload,
    Info,
    FileText,
    Camera,
    History,
    AlertTriangle,
    Trash2,
} from "lucide-svelte";
import { settings, settingsSnapshots } from "../../../stores/settings";
import {
    backupData,
    restoreData,
    resetAllData,
} from "../../../services/dataService";
import { prompts } from "../../../stores/prompts";
import SnapshotList from "./panels/SnapshotList.svelte";

const dispatch = createEventDispatcher();
let restoreFileInput: HTMLInputElement;

async function handleRestoreFile(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const fileContent = await file.text();
    restoreData(fileContent);
    target.value = "";
}
</script>

<div class="flex flex-col h-full">
    <header
        class="flex-shrink-0 px-4 py-4 bg-gray-900/80 flex items-center gap-2"
        style="backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);"
    >
        <button
            on:click={() => dispatch("back")}
            class="p-2 rounded-full hover:bg-gray-700"
        >
            <ArrowLeft class="h-6 w-6 text-gray-300" />
        </button>
        <div>
            <h2 class="font-semibold text-white text-xl">
                {t("settings.dataManagement")}
            </h2>
            <p class="text-sm text-gray-400">{t("settings.dataSubtitle")}</p>
        </div>
    </header>

    <div class="flex-1 overflow-y-auto p-4 space-y-6">
        <!-- Backup & Restore -->
        <div class="bg-gray-800 rounded-xl p-4">
            <h4 class="text-md font-semibold text-white mb-3 flex items-center">
                <HardDrive class="w-5 h-5 mr-3 text-blue-400" />
                {t("settings.backupRestore")}
            </h4>
            <div class="space-y-3">
                <button
                    on:click={backupData}
                    class="w-full p-3 rounded-lg bg-green-600/80 hover:bg-green-600 text-white flex items-center justify-center gap-2 text-sm"
                >
                    <Download class="w-4 h-4" />
                    <span>{t("settings.backupData")}</span>
                </button>
                <button
                    on:click={() => restoreFileInput.click()}
                    class="w-full p-3 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white flex items-center justify-center gap-2 text-sm"
                >
                    <Upload class="w-4 h-4" />
                    <span>{t("settings.restoreData")}</span>
                </button>
                <div class="bg-gray-700/50 rounded-lg p-2">
                    <p class="text-xs text-gray-300/80 flex items-start">
                        <Info class="w-3 h-3 inline mr-1.5 shrink-0 mt-0.5" />
                        <span>{t("settings.backupInfo")}</span>
                    </p>
                </div>
            </div>
        </div>

        <!-- Prompt Backup & Restore -->
        <div class="bg-gray-800 rounded-xl p-4">
            <h4 class="text-md font-semibold text-white mb-3 flex items-center">
                <FileText class="w-5 h-5 mr-3 text-purple-400" />
                {t("settings.promptBackupRestore")}
            </h4>
            <div class="space-y-3">
                <button
                    on:click={prompts.backup}
                    class="w-full p-3 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white flex items-center justify-center gap-2 text-sm"
                >
                    <Download class="w-4 h-4" />
                    <span>{t("settings.promptBackup")}</span>
                </button>
                <button
                    on:click={prompts.restore}
                    class="w-full p-3 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white flex items-center justify-center gap-2 text-sm"
                >
                    <Upload class="w-4 h-4" />
                    <span>{t("settings.promptRestore")}</span>
                </button>
            </div>
        </div>

        <!-- Snapshots -->
        <div class="bg-gray-800 rounded-xl p-4">
            <h4 class="text-md font-semibold text-white mb-3 flex items-center">
                <Camera class="w-5 h-5 mr-3 text-blue-400" />
                {t("settings.snapshots")}
            </h4>
            <div class="space-y-3">
                <div
                    class="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                >
                    <div class="flex-1 pr-4">
                        <div class="flex items-center mb-1">
                            <History class="w-4 h-4 mr-2 text-blue-400" />
                            <span class="text-sm font-medium text-white"
                                >{t("settings.autoSnapshots")}</span
                            >
                        </div>
                        <p class="text-xs text-gray-400">
                            {t("settings.autoSnapshotsInfo")}
                        </p>
                    </div>
                    <label
                        class="relative inline-block w-10 h-5 cursor-pointer"
                    >
                        <input
                            type="checkbox"
                            bind:checked={$settings.snapshotsEnabled}
                            class="sr-only peer"
                        />
                        <div
                            class="w-10 h-5 bg-gray-600 rounded-full peer-checked:bg-blue-600"
                        ></div>
                        <div
                            class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"
                        ></div>
                    </label>
                </div>
                {#if $settings.snapshotsEnabled}
                    <div class="bg-gray-700/50 rounded-lg p-3">
                        <h6 class="text-sm font-medium text-gray-300 mb-2">
                            {t("settings.savedSnapshots")}
                        </h6>
                        <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
                            <SnapshotList />
                        </div>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Danger Zone -->
        <div class="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
            <h4
                class="text-md font-semibold text-red-400 mb-3 flex items-center"
            >
                <AlertTriangle class="w-5 h-5 mr-3" />
                {t("settings.dangerZone")}
            </h4>
            <div class="space-y-3">
                <div>
                    <h5 class="font-medium text-red-300">
                        {t("settings.resetAllData")}
                    </h5>
                    <p class="text-xs text-gray-400 mt-1">
                        {t("settings.resetAllDataInfo")}
                    </p>
                    <p class="text-xs text-red-400/80 font-medium mt-2">
                        {t("settings.resetWarning")}
                    </p>
                </div>
                <button
                    on:click={resetAllData}
                    class="w-full p-3 rounded-lg bg-red-600 hover:bg-red-500 text-white flex items-center justify-center gap-2 text-sm"
                >
                    <Trash2 class="w-4 h-4" />
                    <span>{t("settings.resetAllData")}</span>
                </button>
            </div>
        </div>
    </div>
</div>

<input
    bind:this={restoreFileInput}
    on:change={handleRestoreFile}
    type="file"
    id="restore-file-input-mobile"
    accept=".json"
    style="display: none;"
/>
<input
    type="file"
    id="restore-prompts-input-mobile"
    accept=".json"
    style="display: none;"
/>
