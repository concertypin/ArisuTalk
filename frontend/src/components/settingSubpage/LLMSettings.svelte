<svelte:options runes={true} />

<script lang="ts">
    import { settings } from "@/lib/stores/settings.svelte";
    import { LLMConfigSchema } from "@/lib/types/IDataModel";
    import Plus from "phosphor-svelte/lib/PlusIcon";
    import Info from "phosphor-svelte/lib/InfoIcon";
    import GenerationParameters from "./LLMSetting/GenerationParameters.svelte";
    import { apply } from "@arisutalk/character-spec/utils";

    function addLLMConfig() {
        const newConfig = apply(LLMConfigSchema, {
            name: `Model ${settings.value.llmConfigs.length + 1}`,
            provider: "OpenAI",
        });
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
            <GenerationParameters bind:config={settings.value.llmConfigs[i]} id={i} />
        {/each}
    </div>
</div>
