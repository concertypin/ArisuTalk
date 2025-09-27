<script>
  import { t } from '../../../i18n.js';
  import { settings } from '../../stores/settings';
  import { PROVIDERS, PROVIDER_MODELS } from '../../../constants/providers.ts';
  import { Key, Link, Cpu, Settings as SettingsIcon, Plus, Trash2, ChevronDown } from 'lucide-svelte';

  export let provider;

  let config = $settings.apiConfigs[provider] || {};
  let customModelInput = '';

  $: provider, (config = $settings.apiConfigs[provider] || {});

  const models = PROVIDER_MODELS[provider] || [];
  const customModels = config.customModels || [];

  function handleConfigChange(key, value) {
      const newConfig = { ...$settings.apiConfigs[provider], [key]: value };
      const newApiConfigs = { ...$settings.apiConfigs, [provider]: newConfig };
      settings.update(s => ({ ...s, apiConfigs: newApiConfigs }));
  }
  
  function addCustomModel() {
      if (!customModelInput.trim()) return;
      const newCustomModels = [...(config.customModels || []), customModelInput.trim()];
      handleConfigChange('customModels', newCustomModels);
      customModelInput = '';
  }

  function removeCustomModel(index) {
      const newCustomModels = config.customModels.filter((_, i) => i !== index);
      handleConfigChange('customModels', newCustomModels);
  }

</script>

<div class="space-y-4">
    <!-- API Key -->
    <div>
        <label for="api-key-{provider}" class="flex items-center text-sm font-medium text-gray-300 mb-2">
            <Key class="w-4 h-4 mr-2" />{t("settings.apiKey")}
        </label>
        <input
            id="api-key-{provider}"
            type="password"
            value={config.apiKey || ''}
            on:input={(e) => handleConfigChange('apiKey', e.target.value)}
            placeholder={t("settings.apiKeyPlaceholder")}
            class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-sm"
        />
    </div>

    {#if provider === PROVIDERS.CUSTOM_OPENAI}
        <div>
            <label for="base-url-{provider}" class="flex items-center text-sm font-medium text-gray-300 mb-2">
                <Link class="w-4 h-4 mr-2" />Base URL
            </label>
            <input
                id="base-url-{provider}"
                type="text"
                value={config.baseUrl || ''}
                on:input={(e) => handleConfigChange('baseUrl', e.target.value)}
                placeholder="https://api.openai.com/v1"
                class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-sm"
            />
        </div>
    {/if}

    <!-- Model Selection -->
    <div>
        <label for="model-select-{provider}" class="flex items-center text-sm font-medium text-gray-300 mb-2">
            <Cpu class="w-4 h-4 mr-2" />{t("settings.model")}
        </label>

        {#if models.length > 0}
            <div class="grid grid-cols-1 gap-2 mb-3">
                {#each models as model}
                    <button
                        type="button"
                        class="model-select-btn px-3 py-2 text-left text-sm rounded-lg transition-colors {config.model === model ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
                        on:click={() => handleConfigChange('model', model)}
                    >
                        {model}
                    </button>
                {/each}
            </div>
        {/if}

        <div class="flex gap-2">
            <input
                id="model-select-{provider}"
                type="text"
                bind:value={customModelInput}
                placeholder={t("settings.customModel")}
                class="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm"
            />
            <button
                type="button"
                on:click={addCustomModel}
                class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-1"
            >
                <Plus class="w-4 h-4" />{t("settings.addModel")}
            </button>
        </div>

        {#if customModels.length > 0}
            <div class="mt-3 space-y-1">
                <div class="text-xs text-gray-400">{t("settings.customModels")}</div>
                {#each customModels as model, index}
                    <div class="flex items-center gap-2">
                        <button
                            type="button"
                            class="model-select-btn flex-1 px-3 py-2 text-left text-sm rounded-lg transition-colors {config.model === model ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
                            on:click={() => handleConfigChange('model', model)}
                        >
                            {model}
                        </button>
                        <button
                            type="button"
                            class="remove-custom-model-btn px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                            on:click={() => removeCustomModel(index)}
                        >
                            <Trash2 class="w-3 h-3" />
                        </button>
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    <!-- Advanced Settings -->
    <details class="group mt-4">
        <summary class="flex items-center justify-between cursor-pointer list-none p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/40 transition-colors">
            <h4 class="text-sm font-medium text-gray-300 flex items-center">
                <SettingsIcon class="w-4 h-4 mr-2" />{t("settings.advancedSettings")}
            </h4>
            <ChevronDown class="w-4 h-4 text-gray-400 transition-transform duration-300 group-open:rotate-180" />
        </summary>
        <div class="space-y-4 mt-2 p-4 bg-gray-700/30 rounded-xl">
            <!-- Max Tokens -->
            <div>
                <label for="max-tokens-{provider}" class="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
                    <span>{t("settings.maxTokens")}</span>
                    <span class="text-blue-400 font-mono text-xs">{config.maxTokens || (provider === 'gemini' ? 4096 : 4096)}</span>
                </label>
                <input
                    id="max-tokens-{provider}"
                    type="range"
                    min="512"
                    max="8192"
                    step="256"
                    value={config.maxTokens || (provider === 'gemini' ? 4096 : 4096)}
                    on:input={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
                    class="w-full"
                />
            </div>

            <!-- Temperature -->
            <div>
                <label for="temperature-{provider}" class="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
                    <span>{t("settings.temperature")}</span>
                    <span class="text-blue-400 font-mono text-xs">{config.temperature !== undefined ? config.temperature : (provider === 'gemini' ? 1.25 : 0.8)}</span>
                </label>
                <input
                    id="temperature-{provider}"
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={config.temperature !== undefined ? config.temperature : (provider === 'gemini' ? 1.25 : 0.8)}
                    on:input={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                    class="w-full"
                />
            </div>

            <!-- Profile Generation Settings -->
            <div class="border-t border-gray-600 pt-4 mt-4">
                <h5 class="text-xs font-medium text-gray-400 mb-3">{t("settings.profileGenerationSettings")}</h5>
                <div class="space-y-3">
                    <!-- Profile Max Tokens -->
                    <div>
                        <label for="profile-max-tokens-{provider}" class="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
                            <span>{t("settings.profileMaxTokens")}</span>
                            <span class="text-blue-400 font-mono text-xs">{config.profileMaxTokens || 1024}</span>
                        </label>
                        <input
                            id="profile-max-tokens-{provider}"
                            type="range"
                            min="256"
                            max="2048"
                            step="128"
                            value={config.profileMaxTokens || 1024}
                            on:input={(e) => handleConfigChange('profileMaxTokens', parseInt(e.target.value))}
                            class="w-full"
                        />
                    </div>

                    <!-- Profile Temperature -->
                    <div>
                        <label for="profile-temperature-{provider}" class="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
                            <span>{t("settings.profileTemperature")}</span>
                            <span class="text-blue-400 font-mono text-xs">{config.profileTemperature !== undefined ? config.profileTemperature : 1.2}</span>
                        </label>
                        <input
                            id="profile-temperature-{provider}"
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={config.profileTemperature !== undefined ? config.profileTemperature : 1.2}
                            on:input={(e) => handleConfigChange('profileTemperature', parseFloat(e.target.value))}
                            class="w-full"
                        />
                    </div>
                </div>
            </div>
        </div>
    </details>
</div>