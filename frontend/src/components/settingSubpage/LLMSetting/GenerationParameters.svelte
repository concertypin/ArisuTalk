<script lang="ts">
    import { settings } from "@/lib/stores/settings.svelte";
    import { type LLMConfig } from "@/lib/types/IDataModel";
    import Trash from "phosphor-svelte/lib/TrashIcon";
    import Check from "phosphor-svelte/lib/CheckIcon";
    import Power from "phosphor-svelte/lib/PowerIcon";

    type Props = {
        config: LLMConfig;
        id: number;
    };

    let { config = $bindable(), id }: Props = $props();

    /**
     * Local reactive shadow of the config prop. All template bindings target
     * this shadow so Svelte's reactive tracking works for nested properties
     * (avoiding the `binding_property_non_reactive` compile-time warning).
     *
     * Two `$effect` blocks keep `localConfig` in lock-step with `config`:
     *  - The first effect mirrors UI edits back to the parent prop.
     *  - The second effect (defensive) syncs any external mutation of the
     *    parent prop into the local shadow. In production the keyed `{#each}`
     *    in `LLMSettings.svelte` already remounts on array replacement, so
     *    this effect rarely fires — but it ensures correctness if a caller
     *    mutates the prop in place.
     *
     * Each effect reads + writes individual primitive fields rather than
     * replacing whole objects, so Svelte 5's `===` equality check prevents
     * the two effects from triggering each other in a loop.
     */
    let localConfig = $state(structuredClone($state.snapshot(config)));

    // Local → parent: persists UI edits back to the parent prop.
    $effect(() => {
        config.name = localConfig.name;
        config.enabled = localConfig.enabled;
        config.provider = localConfig.provider;

        if (localConfig.model !== undefined) config.model = localConfig.model;
        else delete config.model;
        if (localConfig.apiKey !== undefined) config.apiKey = localConfig.apiKey;
        else delete config.apiKey;
        if (localConfig.baseURL !== undefined) config.baseURL = localConfig.baseURL;
        else delete config.baseURL;

        config.generationParameters.temperature = localConfig.generationParameters.temperature;
        config.generationParameters.maxInputTokens =
            localConfig.generationParameters.maxInputTokens;
        config.generationParameters.maxOutputTokens =
            localConfig.generationParameters.maxOutputTokens;
        config.generationParameters.topP = localConfig.generationParameters.topP;
        config.generationParameters.topK = localConfig.generationParameters.topK;
        config.generationParameters.frequencyPenalty =
            localConfig.generationParameters.frequencyPenalty;
        config.generationParameters.presencePenalty =
            localConfig.generationParameters.presencePenalty;
    });

    // Parent → local: catches external mutations of the parent prop.
    $effect(() => {
        localConfig.name = config.name;
        localConfig.enabled = config.enabled;
        localConfig.provider = config.provider;
        localConfig.model = config.model;
        localConfig.apiKey = config.apiKey;
        localConfig.baseURL = config.baseURL;

        localConfig.generationParameters.temperature = config.generationParameters.temperature;
        localConfig.generationParameters.maxInputTokens =
            config.generationParameters.maxInputTokens;
        localConfig.generationParameters.maxOutputTokens =
            config.generationParameters.maxOutputTokens;
        localConfig.generationParameters.topP = config.generationParameters.topP;
        localConfig.generationParameters.topK = config.generationParameters.topK;
        localConfig.generationParameters.frequencyPenalty =
            config.generationParameters.frequencyPenalty;
        localConfig.generationParameters.presencePenalty =
            config.generationParameters.presencePenalty;
    });

    /**
     * Creates a proxy object to bind a checkbox to the presence of a field in a target object.
     * When the checkbox is checked, the field is set to a default value if it was
     * undefined. When unchecked, the field is set to undefined.
     * @param target The target object containing the field.
     * @param key The key of the field to bind.
     * @param defaultValue The default value to set when the checkbox is checked.
     * @return A proxy object with a 'checked' property for binding.
     */
    function createFieldProxy<T extends Record<string, unknown>, K extends keyof T>(
        target: T,
        key: K,
        defaultValue: T[K]
    ) {
        return {
            get checked() {
                return target[key] !== undefined;
            },
            set checked(v: boolean) {
                if (v) {
                    target[key] = target[key] ?? defaultValue;
                } else {
                    delete target[key];
                }
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

    const modelProxy = $derived(createFieldProxy(localConfig, "model", ""));
    const keyProxy = $derived(createFieldProxy(localConfig, "apiKey", ""));
    const urlProxy = $derived(createFieldProxy(localConfig, "baseURL", ""));
    const tempProxy = $derived(
        createFieldProxy(localConfig.generationParameters, "temperature", 1)
    );
    const maxInProxy = $derived(
        createFieldProxy(localConfig.generationParameters, "maxInputTokens", 1024)
    );
    const maxOutProxy = $derived(
        createFieldProxy(localConfig.generationParameters, "maxOutputTokens", 1024)
    );
    const topPProxy = $derived(createFieldProxy(localConfig.generationParameters, "topP", 0.95));
    const topKProxy = $derived(createFieldProxy(localConfig.generationParameters, "topK", 40));
    const freqPenProxy = $derived(
        createFieldProxy(localConfig.generationParameters, "frequencyPenalty", 0)
    );
    const presPenProxy = $derived(
        createFieldProxy(localConfig.generationParameters, "presencePenalty", 0)
    );
</script>

<div class="card bg-base-200 shadow-sm border border-base-300 mb-4" class:border-primary={isActive}>
    <div class="card-body p-4">
        <div class="flex justify-between items-center mb-4 gap-2">
            <div class="flex items-center gap-2 flex-1 max-w-xs">
                <input
                    type="text"
                    class="input input-sm input-bordered w-full font-bold"
                    bind:value={localConfig.name}
                />
                {#if isActive}
                    <span class="badge badge-primary badge-sm">Active</span>
                {/if}
            </div>
            <div class="flex items-center gap-1">
                <label class="swap swap-rotate btn btn-ghost btn-xs" title="Enable/Disable">
                    <input
                        type="checkbox"
                        bind:checked={localConfig.enabled}
                        aria-label="Toggle enabled"
                    />
                    <Power size={16} class="swap-on text-success" />
                    <Power size={16} class="swap-off text-base-content/30" />
                </label>
                <button
                    class="btn btn-ghost btn-xs"
                    onclick={setAsActive}
                    disabled={isActive || !localConfig.enabled}
                    title="Use this config"
                    aria-label="Use this config"
                >
                    <Check size={16} class={isActive ? "text-primary" : ""} />
                </button>
                <button
                    class="btn btn-ghost btn-xs text-error"
                    onclick={removeLLMConfig}
                    aria-label="Delete config"
                >
                    <Trash size={16} />
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
                    bind:value={localConfig.provider}
                >
                    <option value="OpenAI">OpenAI</option>
                    <option value="OpenAI-compatible">OpenAI-compatible</option>
                    <option value="Anthropic">Anthropic</option>
                    <option value="Gemini">Gemini</option>
                    <option value="Grok">Grok</option>
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
                    bind:value={localConfig.model}
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
                    bind:value={localConfig.apiKey}
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
                    bind:value={localConfig.baseURL}
                    disabled={!urlProxy.checked}
                    placeholder="https://..."
                />
            </div>

            <div class="form-control">
                <label class="label p-1">
                    <span class="label-text"
                        >Temperature ({localConfig.generationParameters.temperature ?? "Off"})</span
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
                        bind:value={localConfig.generationParameters.temperature}
                        aria-label="Temperature value"
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
                    bind:value={localConfig.generationParameters.maxInputTokens}
                    disabled={!maxInProxy.checked}
                    placeholder="1024"
                    aria-label="Max Input Tokens value"
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
                    bind:value={localConfig.generationParameters.maxOutputTokens}
                    disabled={!maxOutProxy.checked}
                    placeholder="1024"
                    aria-label="Max Output Tokens value"
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
                                >Top P ({localConfig.generationParameters.topP ?? "Off"})</span
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
                                bind:value={localConfig.generationParameters.topP}
                                aria-label="Top P value"
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
                            bind:value={localConfig.generationParameters.topK}
                            disabled={!topKProxy.checked}
                            placeholder="40"
                            aria-label="Top K value"
                        />
                    </div>

                    <div class="form-control">
                        <label class="label p-1">
                            <span class="label-text"
                                >Frequency Penalty ({localConfig.generationParameters
                                    .frequencyPenalty ?? "Off"})</span
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
                                bind:value={localConfig.generationParameters.frequencyPenalty}
                                aria-label="Frequency Penalty value"
                            />
                        {:else}
                            <div class="h-6 bg-base-300 rounded-full w-full opacity-50"></div>
                        {/if}
                    </div>

                    <div class="form-control">
                        <label class="label p-1">
                            <span class="label-text"
                                >Presence Penalty ({localConfig.generationParameters
                                    .presencePenalty ?? "Off"})</span
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
                                bind:value={localConfig.generationParameters.presencePenalty}
                                aria-label="Presence Penalty value"
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
