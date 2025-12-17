<script lang="ts">
    import { settings } from "@/lib/stores/settings.svelte";
</script>

<div class="space-y-6">
    <h3 class="text-lg font-semibold">Prompt Settings</h3>
    <fieldset class="fieldset w-full">
        <legend class="fieldset-legend">System Prompt</legend>
        <textarea
            id="prompt-system"
            class="textarea h-32 w-full"
            bind:value={settings.value.prompt.generationPrompt}
            placeholder="You are a helpful assistant..."
        ></textarea>
        <div class="label">
            <span class="label-text-alt">This is the default system prompt used for new chats.</span
            >
        </div>
    </fieldset>
</div>
