<script lang="ts">
    import { settings } from "@/lib/stores/settings.svelte";
</script>

<div class="space-y-6">
    <h3 class="text-lg font-semibold">General Settings</h3>
    <fieldset class="fieldset w-full max-w-md">
        <legend class="fieldset-legend">Theme</legend>
        <select id="general-theme" class="select w-full" bind:value={settings.value.theme}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
        </select>
    </fieldset>
</div>
