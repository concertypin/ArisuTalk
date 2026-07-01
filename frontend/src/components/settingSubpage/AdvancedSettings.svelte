<script lang="ts">
    import { settings } from "@/lib/stores/settings.svelte";
    import LogLevelSelector from "../ui/LogLevelSelector.svelte";
    import NoopIcon from "@/components/Snippets/NoopIcon.svelte";
    import { versionInfo } from "@/lib/stores/versionInfo.svelte";
    import ArrowSquareOut from "phosphor-svelte/lib/ArrowSquareOutIcon";
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
