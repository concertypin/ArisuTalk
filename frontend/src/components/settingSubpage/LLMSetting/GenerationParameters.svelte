<script lang="ts">
    import { settings } from "@/lib/stores/settings.svelte";
    import { type LLMConfig } from "@/lib/types/IDataModel";
    import { Trash2 } from "@lucide/svelte";

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
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                target[key] = v ? (target[key] ?? defaultValue) : undefined;
            },
        };
    }
    function removeLLMConfig() {
        settings.value.llmConfigs = settings.value.llmConfigs.filter((_, i) => i !== id);
    }
    const modelProxy = $derived(createFieldProxy(config, "model"));
    const keyProxy = $derived(createFieldProxy(config, "apiKey"));
    const urlProxy = $derived(createFieldProxy(config, "baseURL"));
    const tempProxy = $derived(createFieldProxy(config.generationParameters, "temperature", 1));
    const maxInProxy = $derived(
        createFieldProxy(config.generationParameters, "maxInputTokens", 1024)
    );
</script>

<div class="card bg-base-200 shadow-sm border border-base-300 mb-4">
    <div class="card-body p-4">
        <div class="flex justify-between items-center mb-4">
            <div class="flex items-center gap-2 flex-1 max-w-xs">
                <span class="text-sm font-bold whitespace-nowrap">Config Name</span>
                <input
                    type="text"
                    class="input input-sm input-bordered w-full"
                    bind:value={config.name}
                />
            </div>
            <button class="btn btn-ghost btn-xs text-error" onclick={removeLLMConfig}>
                <Trash2 size={16} />
            </button>
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
                    <option value="Anthropic">Anthropic</option>
                    <option value="Gemini">Gemini</option>
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
        </div>
    </div>
</div>
