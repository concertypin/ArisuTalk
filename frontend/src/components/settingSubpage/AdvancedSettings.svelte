<script lang="ts">
    import { settings } from "@/lib/stores/settings.svelte";
    import LogLevelSelector from "@/components/ui/LogLevelSelector.svelte";
    import NoopIcon from "@/components/Snippets/NoopIcon.svelte";
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
