<script lang="ts">
    import { settings } from "@/lib/stores/settings.svelte";
    import { LLMConfigSchema } from "@/lib/types/IDataModel";
    import { Plus, Info } from "@lucide/svelte";
    import GenerationParameters from "./LLMSetting/GenerationParameters.svelte";
    import type * as z from "zod";
    function addLLMConfig() {
        const newConfig = LLMConfigSchema.parse({
            name: `Model ${settings.value.llmConfigs.length + 1}`,
            provider: "OpenAI",
        } satisfies z.input<typeof LLMConfigSchema>);
        settings.value.llmConfigs.push(newConfig);
    }
</script>

<div class="space-y-6">
    <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold">LLM Configuration</h3>
        <button class="btn btn-sm btn-primary" onclick={addLLMConfig}>
            <Plus size={16} /> Add Model
        </button>
    </div>

    {#if settings.value.llmConfigs.length === 0}
        <div class="alert alert-info">
            <Info size={20} />
            <span>No models configured. Add one to get started.</span>
        </div>
    {/if}

    <div class="space-y-4">
        {#each settings.value.llmConfigs as config, i (config.id)}
            <GenerationParameters bind:config id={i} />
        {/each}
    </div>
</div>
