<script lang="ts">
    import { settings } from "@/lib/stores/settings.svelte";
    import LogLevelSelector from "../ui/LogLevelSelector.svelte";
    import NoopIcon from "@/components/Snippets/NoopIcon.svelte";
    import { versionInfo } from "@/lib/stores/versionInfo.svelte";
    import ArrowSquareOut from "phosphor-svelte/lib/ArrowSquareOutIcon";
    import DownloadSimple from "phosphor-svelte/lib/DownloadSimpleIcon";
    import UploadSimple from "phosphor-svelte/lib/UploadSimpleIcon";
    import {
        exportDataAsBlob,
        parseBackupFile,
        importBackup,
        markSchemaMigrated,
    } from "@/lib/migration/storageMigration";
    import { toastStore } from "@/lib/stores/toast.svelte";
    import { Logger } from "@common/logger/Logger";

    let isExporting = $state(false);
    let isImporting = $state(false);

    async function handleExport() {
        isExporting = true;
        try {
            const blob = await exportDataAsBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `arisutalk-backup-${new Date().toISOString().slice(0, 10)}.aribackup`;
        } catch (e) {
            toastStore.error("Failed to export data");
            Logger.error("Export failed", e);
        } finally {
            isExporting = false;
        }
    }

    function handleImportClick() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".aribackup,.json";
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            isImporting = true;
            try {
                const backup = await parseBackupFile(file);
                await importBackup(backup);
                toastStore.success("Data imported successfully. Please reload the page.");
                markSchemaMigrated();
            } catch (e) {
                toastStore.error("Failed to import data");
                Logger.error("Import failed", e);
            } finally {
                isImporting = false;
            }
        };
        input.click();
    }
</script>

<div class="space-y-6">
    <h3 class="text-lg font-semibold">Advanced Settings</h3>

    <LogLevelSelector />

    <div class="divider"></div>

    <div class="form-control">
        <label class="label cursor-pointer justify-start gap-4" for="adv-debug">
            <span class="label-text">Debug Mode</span>
            <input
                id="adv-debug"
                type="checkbox"
                class="toggle"
                bind:checked={settings.value.advanced.debug}
            />
            <NoopIcon />
        </label>
    </div>
    <div class="form-control">
        <label class="label cursor-pointer justify-start gap-4" for="adv-experimental">
            <span class="label-text">Experimental Features</span>
            <input
                id="adv-experimental"
                type="checkbox"
                class="toggle"
                bind:checked={settings.value.advanced.experimental}
            />
            <NoopIcon />
        </label>
    </div>
</div>

<div class="divider"></div>

<div class="space-y-3">
    <h3 class="text-lg font-semibold">Data Management</h3>
    <p class="text-sm text-base-content/60">
        Export or import your data for backup and migration purposes.
    </p>
    <div class="flex gap-2">
        <button
            type="button"
            class="btn btn-outline btn-sm gap-2"
            onclick={handleExport}
            disabled={isExporting}
        >
            <DownloadSimple size={16} />
            {isExporting ? "Exporting..." : "Export All Data"}
        </button>
        <button
            type="button"
            class="btn btn-outline btn-sm gap-2"
            onclick={handleImportClick}
            disabled={isImporting}
        >
            <UploadSimple size={16} />
            {isImporting ? "Importing..." : "Import Data"}
        </button>
    </div>
</div>

<div class="divider"></div>

<div class="space-y-3">
    <h3 class="text-lg font-semibold">Version Information</h3>
    <div class="flex flex-col gap-2 text-sm text-base-content/80">
        <div class="flex justify-between">
            <span>Version</span>
            <span class="font-mono">{versionInfo.value.version}</span>
        </div>
        <div class="flex justify-between">
            <span>Channel</span>
            <span class="font-mono">{versionInfo.value.channel}</span>
        </div>
        {#if versionInfo.value.commit}
            <div class="flex justify-between">
                <span>Commit</span>
                <span class="font-mono text-xs">{versionInfo.value.commit}</span>
            </div>
        {/if}
        <div class="pt-2">
            <a
                href={versionInfo.value.url}
                target="_blank"
                rel="noopener noreferrer"
                class="link link-primary link-hover inline-flex items-center gap-1"
            >
                GitHub Releases
                <ArrowSquareOut size={14} />
            </a>
        </div>
    </div>
</div>
