<script lang="ts">
    import { settings } from "@/lib/stores/settings.svelte";
    import { LLMConfigSchema } from "@/lib/types/IDataModel";
    import { Plus, Trash2, Info } from "@lucide/svelte";

    function ensureConfigDefaults(config: any) {
        // keep UI safe if some fields are missing in persisted settings
        if (!config.generationParameters) config.generationParameters = {};
        if (config.generationParameters.temperature === undefined)
            config.generationParameters.temperature = 1;
        if (config.generationParameters.maxInputTokens === undefined)
            config.generationParameters.maxInputTokens = 512;
        if (config.generationParameters.maxOutputTokens === undefined)
            config.generationParameters.maxOutputTokens = 512;
    }

    function addLLMConfig() {
        const newConfig = LLMConfigSchema.parse({
            name: `Model ${settings.value.llmConfigs.length + 1}`,
        });
        settings.value.llmConfigs.push(newConfig);
    }

    function removeLLMConfig(index: number) {
        settings.value.llmConfigs.splice(index, 1);
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
            {ensureConfigDefaults(config)}
            <div class="card bg-base-200 shadow-sm border border-base-300">
                <div class="card-body p-4">
                    <div class="flex justify-between items-start mb-4">
                        <div class="form-control w-full max-w-xs">
                            <label class="label" for={"llm-name-" + i}
                                ><span class="label-text">Config Name</span></label
                            >
                            <input
                                id={"llm-name-" + i}
                                type="text"
                                class="input input-sm input-bordered"
                                bind:value={config.name}
                            />
                        </div>
                        <button
                            class="btn btn-ghost btn-xs text-error"
                            onclick={() => removeLLMConfig(i)}
                            title="Remove"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="form-control">
                            <label class="label" for={"llm-provider-" + i}
                                ><span class="label-text">Provider</span></label
                            >
                            <select
                                id={"llm-provider-" + i}
                                class="select select-bordered select-sm"
                                bind:value={config.provider}
                            >
                                <option value="OpenAI">OpenAI</option>
                                <option value="Anthropic">Anthropic</option>
                                <option value="Gemini">Gemini</option>
                                <option value="OpenAI-compatible">OpenAI Compatible</option>
                                <option value="Mock">Mock</option>
                            </select>
                        </div>

                        <div class="form-control">
                            <label class="label" for={"llm-model-" + i}
                                ><span class="label-text">Model</span></label
                            >
                            <!--
                            todo: It should all optional. Refer schema
                            -->
                            <input
                                id={"llm-model-" + i}
                                type="text"
                                class="input input-bordered input-sm"
                                bind:value={config.model}
                                placeholder="gpt-4o, claude-3..."
                            />
                        </div>

                        <div class="form-control md:col-span-2">
                            <label class="label" for={"llm-apikey-" + i}
                                ><span class="label-text">API Key</span></label
                            >
                            <input
                                id={"llm-apikey-" + i}
                                type="password"
                                class="input input-bordered input-sm"
                                bind:value={config.apiKey}
                                placeholder="sk-..."
                            />
                        </div>

                        {#if config.provider === "OpenAI-compatible"}
                            <div class="form-control md:col-span-2">
                                <label class="label" for={"llm-baseurl-" + i}
                                    ><span class="label-text">Base URL</span></label
                                >
                                <input
                                    id={"llm-baseurl-" + i}
                                    type="text"
                                    class="input input-bordered input-sm"
                                    bind:value={config.baseURL}
                                    placeholder="https://api.example.com/v1"
                                />
                            </div>
                        {/if}

                        <div class="form-control">
                            <label class="label" for={"llm-temp-" + i}
                                ><span class="label-text"
                                    >Temperature ({config.generationParameters.temperature})</span
                                ></label
                            >
                            <input
                                id={"llm-temp-" + i}
                                type="range"
                                min="0"
                                max="2"
                                step="0.1"
                                class="range range-xs"
                                bind:value={config.generationParameters.temperature}
                            />
                        </div>

                        <div class="form-control">
                            <label class="label" for={"llm-maxtokens-" + i}
                                ><span class="label-text">Max Tokens</span></label
                            >
                            <input
                                id={"llm-maxtokens-" + i}
                                type="number"
                                class="input input-bordered input-sm"
                                bind:value={config.generationParameters.maxInputTokens}
                            />
                        </div>
                    </div>
                </div>
            </div>
        {/each}
    </div>
</div>
