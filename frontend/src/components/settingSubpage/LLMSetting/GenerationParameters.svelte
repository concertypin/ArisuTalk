<script lang="ts">
    import { settings } from "@/lib/stores/settings.svelte";
    import { type LLMConfig } from "@/lib/types/IDataModel";
    import { Trash2, Check, Power } from "@lucide/svelte";

    type Props = {
        config: LLMConfig;
        id: number;
    };

    let { config = $bindable(), id }: Props = $props();

    /**
     * Creates a proxy object to bind a checkbox to the presence of a field in a target object.
     * When the checkbox is checked, the field is set to a default value if it was
     * undefined. When unchecked, the field is set to undefined.
     * @param target The target object containing the field.
     * @param key The key of the field to bind.
     * @param defaultValue The default value to set when the checkbox is checked.
     * @return A proxy object with a 'checked' property for binding.
     */
    // It needs to be any because the target object is dynamic.
    // It's better to typing it, but idk how to do that in this case.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function createFieldProxy(target: Record<string, any>, key: string, defaultValue: any = "") {
        return {
            get checked() {
                return target[key] !== undefined;
            },
            set checked(v: boolean) {
                // target[key] is any, so we need to disable the linting here

                target[key] = v ? (target[key] ?? defaultValue) : undefined;
            },
        };
    }
    function removeLLMConfig() {
        settings.value.llmConfigs = settings.value.llmConfigs.filter((_, i) => i !== id);
        // If this was the active config, clear it
        if (settings.value.activeLLMConfigId === config.id) {
            settings.value.activeLLMConfigId = null;
        }
    }
    function setAsActive() {
        settings.value.activeLLMConfigId = config.id;
    }

    let isActive = $derived(settings.value.activeLLMConfigId === config.id);

    const modelProxy = $derived(createFieldProxy(config, "model"));
    const keyProxy = $derived(createFieldProxy(config, "apiKey"));
    const urlProxy = $derived(createFieldProxy(config, "baseURL"));
    const tempProxy = $derived(createFieldProxy(config.generationParameters, "temperature", 1));
    const maxInProxy = $derived(
        createFieldProxy(config.generationParameters, "maxInputTokens", 1024)
    );
    const maxOutProxy = $derived(
        createFieldProxy(config.generationParameters, "maxOutputTokens", 1024)
    );
    const topPProxy = $derived(createFieldProxy(config.generationParameters, "topP", 0.95));
    const topKProxy = $derived(createFieldProxy(config.generationParameters, "topK", 40));
    const freqPenProxy = $derived(
        createFieldProxy(config.generationParameters, "frequencyPenalty", 0)
    );
    const presPenProxy = $derived(
        createFieldProxy(config.generationParameters, "presencePenalty", 0)
    );
</script>

<div class="card bg-base-200 shadow-sm border border-base-300 mb-4" class:border-primary={isActive}>
    <div class="card-body p-4">
        <div class="flex justify-between items-center mb-4 gap-2">
            <div class="flex items-center gap-2 flex-1 max-w-xs">
                <input
                    type="text"
                    class="input input-sm input-bordered w-full font-bold"
                    bind:value={config.name}
                />
                {#if isActive}
                    <span class="badge badge-primary badge-sm">Active</span>
                {/if}
            </div>
            <div class="flex items-center gap-1">
                <label class="swap swap-rotate btn btn-ghost btn-xs" title="Enable/Disable">
                    <input type="checkbox" bind:checked={config.enabled} />
                    <Power size={16} class="swap-on text-success" />
                    <Power size={16} class="swap-off text-base-content/30" />
                </label>
                <button
                    class="btn btn-ghost btn-xs"
                    onclick={setAsActive}
                    disabled={isActive || !config.enabled}
                    title="Use this config"
                >
                    <Check size={16} class={isActive ? "text-primary" : ""} />
                </button>
                <button class="btn btn-ghost btn-xs text-error" onclick={removeLLMConfig}>
                    <Trash2 size={16} />
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            <div class="form-control">
                <label class="label p-1" for={"provider-" + id}
                    ><span class="label-text">Provider</span></label
                >
                <select
                    id={"provider-" + id}
                    class="select select-bordered select-sm"
                    bind:value={config.provider}
                >
                    <option value="OpenAI">OpenAI</option>
                    <option value="OpenAI-compatible">OpenAI-compatible</option>
                    <option value="Anthropic">Anthropic</option>
                    <option value="Gemini">Gemini</option>
                    <option value="OpenRouter">OpenRouter</option>
                    <option value="Mock">Mock</option>
                </select>
            </div>

            <div class="form-control">
                <label class="label p-1" for={"model-" + id}>
                    <span class="label-text">Model</span>
                    <input
                        type="checkbox"
                        class="checkbox checkbox-xs checkbox-primary"
                        bind:checked={modelProxy.checked}
                    />
                </label>
                <input
                    id={"model-" + id}
                    type="text"
                    class="input input-sm input-bordered"
                    bind:value={config.model}
                    disabled={!modelProxy.checked}
                    placeholder="claude-4.5-opus-20251101"
                />
            </div>

            <div class="form-control md:col-span-2">
                <label class="label p-1" for={"key-" + id}>
                    <span class="label-text">API Key</span>
                    <input
                        type="checkbox"
                        class="checkbox checkbox-xs checkbox-primary"
                        bind:checked={keyProxy.checked}
                    />
                </label>
                <input
                    id={"key-" + id}
                    type="password"
                    class="input input-sm input-bordered"
                    bind:value={config.apiKey}
                    disabled={!keyProxy.checked}
                    placeholder="sk-..."
                />
            </div>

            <div class="form-control md:col-span-2">
                <label class="label p-1" for={"url-" + id}>
                    <span class="label-text">Base URL</span>
                    <input
                        type="checkbox"
                        class="checkbox checkbox-xs checkbox-primary"
                        bind:checked={urlProxy.checked}
                    />
                </label>
                <input
                    id={"url-" + id}
                    type="text"
                    class="input input-sm input-bordered"
                    bind:value={config.baseURL}
                    disabled={!urlProxy.checked}
                    placeholder="https://..."
                />
            </div>

            <div class="form-control">
                <label class="label p-1">
                    <span class="label-text"
                        >Temperature ({config.generationParameters.temperature ?? "Off"})</span
                    >
                    <input
                        type="checkbox"
                        class="checkbox checkbox-xs checkbox-primary"
                        bind:checked={tempProxy.checked}
                    />
                </label>
                {#if tempProxy.checked}
                    <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.05"
                        class="range range-xs range-primary mt-2"
                        bind:value={config.generationParameters.temperature}
                    />
                {:else}
                    <div class="h-6 bg-base-300 rounded-full w-full opacity-50"></div>
                {/if}
            </div>

            <div class="form-control">
                <label class="label p-1">
                    <span class="label-text">Max Input Tokens</span>
                    <input
                        type="checkbox"
                        class="checkbox checkbox-xs checkbox-primary"
                        bind:checked={maxInProxy.checked}
                    />
                </label>
                <input
                    type="number"
                    class="input input-sm input-bordered"
                    bind:value={config.generationParameters.maxInputTokens}
                    disabled={!maxInProxy.checked}
                    placeholder="1024"
                />
            </div>

            <div class="form-control">
                <label class="label p-1">
                    <span class="label-text">Max Output Tokens</span>
                    <input
                        type="checkbox"
                        class="checkbox checkbox-xs checkbox-primary"
                        bind:checked={maxOutProxy.checked}
                    />
                </label>
                <input
                    type="number"
                    class="input input-sm input-bordered"
                    bind:value={config.generationParameters.maxOutputTokens}
                    disabled={!maxOutProxy.checked}
                    placeholder="1024"
                />
            </div>
        </div>

        <!-- Advanced Parameters Section -->
        <details class="collapse collapse-arrow bg-base-300 mt-4">
            <summary class="collapse-title text-sm font-medium">Advanced Parameters</summary>
            <div class="collapse-content">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 pt-2">
                    <div class="form-control">
                        <label class="label p-1">
                            <span class="label-text"
                                >Top P ({config.generationParameters.topP ?? "Off"})</span
                            >
                            <input
                                type="checkbox"
                                class="checkbox checkbox-xs checkbox-primary"
                                bind:checked={topPProxy.checked}
                            />
                        </label>
                        {#if topPProxy.checked}
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                class="range range-xs range-primary mt-2"
                                bind:value={config.generationParameters.topP}
                            />
                        {:else}
                            <div class="h-6 bg-base-300 rounded-full w-full opacity-50"></div>
                        {/if}
                    </div>

                    <div class="form-control">
                        <label class="label p-1">
                            <span class="label-text">Top K</span>
                            <input
                                type="checkbox"
                                class="checkbox checkbox-xs checkbox-primary"
                                bind:checked={topKProxy.checked}
                            />
                        </label>
                        <input
                            type="number"
                            class="input input-sm input-bordered"
                            bind:value={config.generationParameters.topK}
                            disabled={!topKProxy.checked}
                            placeholder="40"
                        />
                    </div>

                    <div class="form-control">
                        <label class="label p-1">
                            <span class="label-text"
                                >Frequency Penalty ({config.generationParameters.frequencyPenalty ??
                                    "Off"})</span
                            >
                            <input
                                type="checkbox"
                                class="checkbox checkbox-xs checkbox-primary"
                                bind:checked={freqPenProxy.checked}
                            />
                        </label>
                        {#if freqPenProxy.checked}
                            <input
                                type="range"
                                min="-2"
                                max="2"
                                step="0.1"
                                class="range range-xs range-primary mt-2"
                                bind:value={config.generationParameters.frequencyPenalty}
                            />
                        {:else}
                            <div class="h-6 bg-base-300 rounded-full w-full opacity-50"></div>
                        {/if}
                    </div>

                    <div class="form-control">
                        <label class="label p-1">
                            <span class="label-text"
                                >Presence Penalty ({config.generationParameters.presencePenalty ??
                                    "Off"})</span
                            >
                            <input
                                type="checkbox"
                                class="checkbox checkbox-xs checkbox-primary"
                                bind:checked={presPenProxy.checked}
                            />
                        </label>
                        {#if presPenProxy.checked}
                            <input
                                type="range"
                                min="-2"
                                max="2"
                                step="0.1"
                                class="range range-xs range-primary mt-2"
                                bind:value={config.generationParameters.presencePenalty}
                            />
                        {:else}
                            <div class="h-6 bg-base-300 rounded-full w-full opacity-50"></div>
                        {/if}
                    </div>
                </div>
            </div>
        </details>
    </div>
</div>
