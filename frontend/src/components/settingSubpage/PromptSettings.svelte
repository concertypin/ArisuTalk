<script lang="ts">
    import { settings } from "@/lib/stores/settings.svelte";
    import BookOpen from "phosphor-svelte/lib/BookOpenIcon";
    import PromptTemplateManager from "@/features/promptTemplate/components/PromptTemplateManager.svelte";

    let showTemplateManager = $state(false);

    function onApplyTemplate(prompts: { system: string; generation: string; lore?: string }) {
        settings.value.prompt.generationPrompt =
            prompts.generation || settings.value.prompt.generationPrompt;
        void settings.save();
    }
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

    {#if showTemplateManager}
        <div class="border-t border-base-300 pt-4">
            <PromptTemplateManager
                onApply={onApplyTemplate}
                currentPrompts={{
                    system: "",
                    generation: settings.value.prompt.generationPrompt,
                    lore: "",
                }}
            />
        </div>
    {/if}

    <button
        type="button"
        class="btn btn-ghost btn-sm"
        onclick={() => (showTemplateManager = !showTemplateManager)}
    >
        <BookOpen size={16} />
        {showTemplateManager ? "Hide Templates" : "Load Template"}
    </button>
</div>
