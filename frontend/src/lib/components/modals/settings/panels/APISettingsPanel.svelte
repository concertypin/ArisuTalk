<script lang="ts">
    import { t } from "$root/i18n";
    import { Edit, FilePenLine, Globe, Settings } from "lucide-svelte";

    import { settings } from "../../../../stores/settings";
    import { isPromptModalVisible } from "../../../../stores/ui";
    import ProviderSettings from "../../../settings/ProviderSettings.svelte";

    let provider = $settings.apiProvider || "gemini";

    function handleProviderChange(e: Event) {
        provider = (e.target as HTMLSelectElement).value;
        settings.update((s) => ({ ...s, apiProvider: provider }));
    }

    function getProviderDisplayName(p: string) {
        const displayNames: Record<string, string> = {
            gemini: "Google Gemini",
            claude: "Anthropic Claude",
            openai: "OpenAI ChatGPT",
            grok: "xAI Grok",
            openrouter: "OpenRouter",
            custom_openai: "Custom OpenAI",
        };
        return displayNames[p] || p;
    }
</script>

<div class="space-y-6">
    <!-- API Provider Selection -->
    <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
            <Globe class="w-5 h-5 mr-3 text-blue-400" />
            {t("settings.aiProvider")}
        </h4>
        <select
            bind:value={provider}
            on:change={handleProviderChange}
            class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
        >
            <option value="gemini">Google Gemini</option>
            <option value="claude">Anthropic Claude</option>
            <option value="openai">OpenAI ChatGPT</option>
            <option value="grok">xAI Grok</option>
            <option value="openrouter">OpenRouter</option>
            <option value="custom_openai">Custom OpenAI</option>
        </select>
    </div>

    <!-- Current Provider Settings -->
    <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
            <Settings class="w-5 h-5 mr-3 text-blue-400" />
            {getProviderDisplayName(provider)}
            {t("settings.providerSettings")}
        </h4>
        <ProviderSettings {provider} />
    </div>

    <!-- Prompt Management -->
    <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
            <FilePenLine class="w-5 h-5 mr-3 text-blue-400" />
            {t("settings.promptManagement")}
        </h4>
        <p class="text-gray-300 text-sm mb-4">{t("settings.promptInfo")}</p>
        <button
            on:click={() => isPromptModalVisible.set(true)}
            class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
        >
            <Edit class="w-4 h-4" />
            {t("settings.editPrompt")}
        </button>
    </div>
</div>
