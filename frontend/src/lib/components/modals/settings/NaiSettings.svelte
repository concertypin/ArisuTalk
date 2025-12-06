<script lang="ts">
    import { t } from "$root/i18n";
    import { createEventDispatcher } from "svelte";
    import {
        ArrowLeft,
        Image,
        Cpu,
        UserPlus,
        Settings,
        Edit,
        Smile,
        Download,
        BarChart3,
        HelpCircle,
        Eye,
        EyeOff,
        Plus,
        Check,
        X,
        RefreshCw,
        Users,
        Trash2,
    } from "lucide-svelte";
    import { settings } from "$stores/settings";
    import {
        DEFAULT_EMOTIONS,
        NOVELAI_MODELS,
        NOVELAI_SAMPLERS,
        NOVELAI_NOISE_SCHEDULES,
    } from "$constants/novelaiConfig";
    import { NovelAIClient } from "$root/lib/api/novelai";

    const dispatch = createEventDispatcher();

    if (!$settings.naiSettings) {
        ($settings as any).naiSettings = {};
    }

    let apiKeyVisible = false;
    let maskedApiKey =
        "●".repeat(8) + ($settings.naiSettings?.apiKey?.slice(-4) || "");

    let minDelaySeconds = ($settings.naiSettings?.minDelay ?? 20000) / 1000;
    let maxAdditionalDelaySeconds =
        ($settings.naiSettings?.maxAdditionalDelay ?? 10000) / 1000;

    $: $settings.naiSettings.minDelay = minDelaySeconds * 1000;
    $: $settings.naiSettings.maxAdditionalDelay =
        maxAdditionalDelaySeconds * 1000;

    let isEditingNaiList = false;

    let newNaiItem: { title: string; emotion: string; action: string } = { title: "", emotion: "", action: "" };

    function addNaiItem() {
        if (!newNaiItem.title.trim()) return;
        if (!$settings.naiSettings.naiGenerationList) {
            $settings.naiSettings.naiGenerationList = [];
        }
        $settings.naiSettings.naiGenerationList = [
            ...$settings.naiSettings.naiGenerationList,
            { ...newNaiItem },
        ];
        newNaiItem = { title: "", emotion: "", action: "" };
    }

    function deleteNaiItem(index: number) {
        if ($settings.naiSettings.naiGenerationList) {
            $settings.naiSettings.naiGenerationList.splice(index, 1);
            $settings.naiSettings.naiGenerationList =
                $settings.naiSettings.naiGenerationList;
        }
    }

    function saveNaiList() {
        isEditingNaiList = false;
    }

    function resetNaiList() {
        $settings.naiSettings.naiGenerationList = [...DEFAULT_EMOTIONS];
    }

    function generateAllStickers() {
        console.log("generateAllStickers");
    }
</script>

<div class="flex flex-col h-full">
    <header
        class="flex-shrink-0 px-4 py-4 bg-gray-900/80 flex items-center gap-2"
        style="backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);"
    >
        <button
            on:click={() => dispatch("back")}
            class="p-2 rounded-full hover:bg-gray-700"
        >
            <ArrowLeft class="h-6 w-6 text-gray-300" />
        </button>
        <div>
            <h2 class="font-semibold text-white text-xl">
                {t("settings.naiSettings")}
            </h2>
            <p class="text-sm text-gray-400">{t("naiSettings.subtitle")}</p>
        </div>
    </header>

    <div class="flex-1 overflow-y-auto p-4 space-y-6">
        <!-- NAI API Settings -->
        <div class="bg-gray-800 rounded-xl p-4">
            <h4 class="text-md font-semibold text-white mb-3 flex items-center">
                <Image class="w-5 h-5 mr-3 text-purple-400" />
                {t("naiSettings.apiSettingsTitle")}
            </h4>
            <div class="space-y-3">
                <div>
                    <label
                        for="nai-api-key-mobile"
                        class="block text-xs font-medium text-gray-300 mb-1"
                    >
                        {t("naiSettings.apiKey")}
                    </label>
                    <div class="flex gap-2">
                        <input
                            id="nai-api-key-mobile"
                            bind:value={$settings.naiSettings.apiKey}
                            type={apiKeyVisible ? "text" : "password"}
                            placeholder={t("naiSettings.apiKeyPlaceholder")}
                            class="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-purple-500/50 text-sm"
                        />
                        <button
                            on:click={() => (apiKeyVisible = !apiKeyVisible)}
                            type="button"
                            class="p-2 rounded-full bg-gray-900 hover:bg-gray-700 text-gray-300 transition-colors"
                            title={t("naiSettings.apiKeyToggle")}
                        >
                            {#if apiKeyVisible}
                                <EyeOff class="w-4 h-4" />
                            {:else}
                                <Eye class="w-4 h-4" />
                            {/if}
                        </button>
                    </div>
                    {#if $settings.naiSettings.apiKey}
                        <div class="text-xs text-green-400 mt-1">
                            {t("naiSettings.apiKeySet", {
                                maskedKey: maskedApiKey,
                            })}
                        </div>
                    {:else}
                        <div class="text-xs text-red-400 mt-1">
                            {t("naiSettings.apiKeyRequired")}
                        </div>
                    {/if}
                    <div class="text-xs text-gray-400 mt-2">
                        <a
                            href="https://novelai.net/account"
                            target="_blank"
                            class="text-purple-400 hover:text-purple-300"
                        >
                            {t("naiSettings.apiKeyHelp")}
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Model and Generation Settings -->
        <div class="bg-gray-800 rounded-xl p-4">
            <h4 class="text-md font-semibold text-white mb-3 flex items-center">
                <Cpu class="w-5 h-5 mr-3 text-green-400" />
                {t("naiSettings.modelSettingsTitle")}
            </h4>
            <div class="space-y-3">
                <div>
                    <label
                        for="nai-model-mobile"
                        class="block text-xs font-medium text-gray-300 mb-1"
                        >{t("naiSettings.model")}</label
                    >
                    <select
                        id="nai-model-mobile"
                        bind:value={$settings.naiSettings.model}
                        class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-green-500/50 text-sm"
                    >
                        {#each Object.entries(NOVELAI_MODELS) as [modelId, modelInfo]}
                            <option value={modelId}
                                >{modelInfo.name} ({modelInfo.version})</option
                            >
                        {/each}
                    </select>
                </div>
                <div>
                    <label
                        for="nai-image-size-mobile"
                        class="block text-xs font-medium text-gray-300 mb-1"
                        >{t("naiSettings.imageSize")}</label
                    >
                    <select
                        id="nai-image-size-mobile"
                        bind:value={$settings.naiSettings.preferredSize}
                        class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-green-500/50 text-sm"
                    >
                        <option value="square"
                            >{t("naiSettings.imageSizeSquare")}</option
                        >
                        <option value="portrait"
                            >{t("naiSettings.imageSizePortrait")}</option
                        >
                        <option value="landscape"
                            >{t("naiSettings.imageSizeLandscape")}</option
                        >
                    </select>
                    <div class="text-xs text-gray-400 mt-1">
                        {t("naiSettings.imageSizeHelp")}
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label
                            for="nai-min-delay-mobile"
                            class="block text-xs font-medium text-gray-300 mb-1"
                            >{t("naiSettings.minDelayTime")}</label
                        >
                        <input
                            id="nai-min-delay-mobile"
                            bind:value={minDelaySeconds}
                            type="number"
                            min="10"
                            max="60"
                            class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-green-500/50 text-sm"
                        />
                    </div>
                    <div>
                        <label
                            for="nai-max-additional-delay-mobile"
                            class="block text-xs font-medium text-gray-300 mb-1"
                            >{t("naiSettings.maxAdditionalTime")}</label
                        >
                        <input
                            id="nai-max-additional-delay-mobile"
                            bind:value={maxAdditionalDelaySeconds}
                            type="number"
                            min="0"
                            max="30"
                            class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-green-500/50 text-sm"
                        />
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label
                            for="nai-steps-mobile"
                            class="block text-xs font-medium text-gray-300 mb-1"
                            >{t("naiSettings.steps")}</label
                        >
                        <input
                            id="nai-steps-mobile"
                            bind:value={$settings.naiSettings.steps}
                            type="range"
                            min="1"
                            max="50"
                            class="w-full"
                        />
                        <div class="text-center text-xs text-gray-400 mt-1">
                            {$settings.naiSettings.steps}
                        </div>
                    </div>
                    <div>
                        <label
                            for="nai-scale-mobile"
                            class="block text-xs font-medium text-gray-300 mb-1"
                            >{t("naiSettings.scale")}</label
                        >
                        <input
                            id="nai-scale-mobile"
                            bind:value={$settings.naiSettings.scale}
                            type="range"
                            min="1"
                            max="30"
                            step="0.5"
                            class="w-full"
                        />
                        <div class="text-center text-xs text-gray-400 mt-1">
                            {$settings.naiSettings.scale}
                        </div>
                    </div>
                </div>
                <div>
                    <label
                        for="nai-sampler-mobile"
                        class="block text-xs font-medium text-gray-300 mb-1"
                        >{t("naiSettings.sampler")}</label
                    >
                    <select
                        id="nai-sampler-mobile"
                        bind:value={$settings.naiSettings.sampler}
                        class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-green-500/50 text-sm"
                    >
                        {#each NOVELAI_SAMPLERS as samplerOption}
                            <option value={samplerOption}
                                >{samplerOption
                                    .replace(/_/g, " ")
                                    .toUpperCase()}</option
                            >
                        {/each}
                    </select>
                </div>
                <div>
                    <label
                        for="nai-noise-schedule-mobile"
                        class="block text-xs font-medium text-gray-300 mb-1"
                        >{t("naiSettings.noiseSchedule")}</label
                    >
                    <select
                        id="nai-noise-schedule-mobile"
                        bind:value={$settings.naiSettings.noise_schedule}
                        class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-green-500/50 text-sm"
                    >
                        {#each NOVELAI_NOISE_SCHEDULES as schedule}
                            <option value={schedule}
                                >{schedule.charAt(0).toUpperCase() +
                                    schedule.slice(1)}</option
                            >
                        {/each}
                    </select>
                </div>
            </div>
        </div>

        <!-- Character and Image Settings -->
        <div class="bg-gray-800 rounded-xl p-4">
            <h4 class="text-md font-semibold text-white mb-3 flex items-center">
                <UserPlus class="w-5 h-5 mr-3 text-pink-400" />
                {t("naiSettings.characterImageSettingsTitle")}
            </h4>
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <div>
                        <label
                            for="nai-use-character-prompts-mobile"
                            class="text-sm font-medium text-gray-300"
                            >{t("naiSettings.useCharacterPrompts")}</label
                        >
                        <p class="text-xs text-gray-400 mt-1">
                            {t("naiSettings.useCharacterPromptsHelp")}
                        </p>
                    </div>
                    <label
                        class="relative inline-flex items-center cursor-pointer"
                    >
                        <input
                            id="nai-use-character-prompts-mobile"
                            bind:checked={
                                $settings.naiSettings.useCharacterPrompts
                            }
                            type="checkbox"
                            class="sr-only peer"
                        />
                        <div
                            class="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"
                        ></div>
                    </label>
                </div>
                <div class="flex items-center justify-between">
                    <div>
                        <label
                            for="nai-vibe-transfer-mobile"
                            class="text-sm font-medium text-gray-300"
                            >{t("naiSettings.vibeTransfer")}</label
                        >
                        <p class="text-xs text-gray-400 mt-1">
                            {t("naiSettings.vibeTransferHelp")}
                        </p>
                    </div>
                    <label
                        class="relative inline-flex items-center cursor-pointer"
                    >
                        <input
                            id="nai-vibe-transfer-mobile"
                            bind:checked={
                                $settings.naiSettings.vibeTransferEnabled
                            }
                            type="checkbox"
                            class="sr-only peer"
                        />
                        <div
                            class="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"
                        ></div>
                    </label>
                </div>
                {#if $settings.naiSettings.vibeTransferEnabled}
                    <div class="space-y-3 pt-3 border-t border-gray-700">
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label
                                    for="nai-vibe-strength-mobile"
                                    class="block text-xs font-medium text-gray-300 mb-1"
                                    >{t("naiSettings.vibeStrength")}</label
                                >
                                <input
                                    id="nai-vibe-strength-mobile"
                                    bind:value={
                                        $settings.naiSettings
                                            .vibeTransferStrength
                                    }
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    class="w-full"
                                />
                                <div
                                    class="text-center text-xs text-gray-400 mt-1"
                                >
                                    {$settings.naiSettings.vibeTransferStrength}
                                </div>
                            </div>
                            <div>
                                <label
                                    for="nai-vibe-info-extracted-mobile"
                                    class="block text-xs font-medium text-gray-300 mb-1"
                                    >{t("naiSettings.vibeInfoExtracted")}</label
                                >
                                <input
                                    id="nai-vibe-info-extracted-mobile"
                                    bind:value={
                                        $settings.naiSettings
                                            .vibeTransferInformationExtracted
                                    }
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    class="w-full"
                                />
                                <div
                                    class="text-center text-xs text-gray-400 mt-1"
                                >
                                    {$settings.naiSettings
                                        .vibeTransferInformationExtracted}
                                </div>
                            </div>
                        </div>
                        <div>
                            <label
                                for="nai-vibe-image-upload-mobile"
                                class="block text-xs font-medium text-gray-300 mb-1"
                                >{t("naiSettings.vibeImageUpload")}</label
                            >
                            <input
                                id="nai-vibe-image-upload-mobile"
                                type="file"
                                accept="image/*"
                                class="w-full text-xs text-gray-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-700 file:text-gray-300 hover:file:bg-gray-600"
                            />
                        </div>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Advanced Settings -->
        <div class="bg-gray-800 rounded-xl p-4">
            <h4 class="text-md font-semibold text-white mb-3 flex items-center">
                <Settings class="w-5 h-5 mr-3 text-yellow-400" />
                {t("naiSettings.advancedSettingsTitle")}
            </h4>
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <label class="flex items-center space-x-2 cursor-pointer">
                        <input
                            bind:checked={$settings.naiSettings.sm}
                            type="checkbox"
                            class="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                        />
                        <span class="text-xs font-medium text-gray-300"
                            >{t("naiSettings.smeaEnable")}</span
                        >
                    </label>
                    <label class="flex items-center space-x-2 cursor-pointer">
                        <input
                            bind:checked={$settings.naiSettings.sm_dyn}
                            type="checkbox"
                            class="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                        />
                        <span class="text-xs font-medium text-gray-300"
                            >{t("naiSettings.smeaDynEnable")}</span
                        >
                    </label>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label
                            for="nai-cfg-rescale-mobile"
                            class="block text-xs font-medium text-gray-300 mb-1"
                            >{t("naiSettings.cfgRescale")}</label
                        >
                        <input
                            id="nai-cfg-rescale-mobile"
                            bind:value={$settings.naiSettings.cfg_rescale}
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            class="w-full"
                        />
                        <div class="text-center text-xs text-gray-400 mt-1">
                            {$settings.naiSettings.cfg_rescale}
                        </div>
                    </div>
                    <div>
                        <label
                            for="nai-uncond-scale-mobile"
                            class="block text-xs font-medium text-gray-300 mb-1"
                            >{t("naiSettings.uncondScale")}</label
                        >
                        <input
                            id="nai-uncond-scale-mobile"
                            bind:value={$settings.naiSettings.uncond_scale}
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            class="w-full"
                        />
                        <div class="text-center text-xs text-gray-400 mt-1">
                            {$settings.naiSettings.uncond_scale}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Custom Prompts -->
        <div class="bg-gray-800 rounded-xl p-4">
            <h4 class="text-md font-semibold text-white mb-3 flex items-center">
                <Edit class="w-5 h-5 mr-3 text-purple-400" />
                {t("naiSettings.customPromptsTitle")}
            </h4>
            <div class="space-y-3">
                <div>
                    <label
                        for="nai-custom-positive-mobile"
                        class="block text-xs font-medium text-gray-300 mb-1"
                        >{t("naiSettings.customPositive")}</label
                    >
                    <textarea
                        id="nai-custom-positive-mobile"
                        bind:value={$settings.naiSettings.customPositivePrompt}
                        placeholder={t("naiSettings.customPositivePlaceholder")}
                        class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-purple-500/50 resize-none text-sm"
                        rows="3"
                    ></textarea>
                </div>
                <div>
                    <label
                        for="nai-custom-negative-mobile"
                        class="block text-xs font-medium text-gray-300 mb-1"
                        >{t("naiSettings.customNegative")}</label
                    >
                    <textarea
                        id="nai-custom-negative-mobile"
                        bind:value={$settings.naiSettings.customNegativePrompt}
                        placeholder={t("naiSettings.customNegativePlaceholder")}
                        class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-purple-500/50 resize-none text-sm"
                        rows="3"
                    ></textarea>
                </div>
            </div>
        </div>

        <!-- NAI Generation List -->
        <div class="bg-gray-800 rounded-xl p-4">
            <h4
                class="text-md font-semibold text-white mb-3 flex items-center justify-between"
            >
                <div class="flex items-center">
                    <Smile class="w-5 h-5 mr-3 text-blue-400" />
                    {t("naiSettings.naiGenerationListTitle")}
                </div>
                <button
                    on:click={() => (isEditingNaiList = !isEditingNaiList)}
                    class="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-1"
                >
                    <Edit class="w-3 h-3" />
                    {isEditingNaiList ? t("g.cancel") : t("g.edit")}
                </button>
            </h4>
            {#if !isEditingNaiList}
                <div class="grid grid-cols-2 gap-2 mb-2">
                    {#each $settings.naiSettings.naiGenerationList || DEFAULT_EMOTIONS as item}
                    {@const titleKey = 'titleKey' in item ? item.titleKey : undefined}
                    {@const fullKey = titleKey
                        ? `naiSettings.emotion.${titleKey}`
                            : null}
                    {@const title = 'title' in item ? (item.title || '') : ''}
                    {@const displayText = fullKey ? t(fullKey) : title}
                        <div
                            class="bg-gray-700/50 rounded-md px-2 py-1 text-center"
                        >
                            <span class="text-xs text-gray-300"
                                >{displayText}</span
                            >
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="space-y-3">
                    <div class="space-y-2 max-h-32 overflow-y-auto">
                        {#each $settings.naiSettings.naiGenerationList as item, index}
                            {@const titleKey = 'titleKey' in item ? item.titleKey : undefined}
                            {@const fullKey = titleKey
                                ? `naiSettings.emotion.${titleKey}`
                                : null}
                            {@const title = 'title' in item ? (item.title || '') : ''}
                            {@const displayText = fullKey
                                ? t(fullKey)
                                : title}
                            <div
                                class="flex items-center gap-2 bg-gray-700/50 p-2 rounded-lg"
                            >
                                <span
                                    class="flex-1 text-xs text-gray-300 truncate"
                                    >{displayText}</span
                                >
                                <button
                                    on:click={() => deleteNaiItem(index)}
                                    class="p-1.5 bg-red-600/80 hover:bg-red-700 rounded-md"
                                >
                                    <Trash2 class="w-3 h-3 text-white" />
                                </button>
                            </div>
                        {/each}
                    </div>
                    <div class="flex gap-2 pt-2 border-t border-gray-700">
                        <button
                            on:click={saveNaiList}
                            class="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 text-xs"
                        >
                            <Check class="w-4 h-4" />{t("g.save")}
                        </button>
                        <button
                            on:click={resetNaiList}
                            class="py-2 px-3 bg-red-600/80 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-2 text-xs"
                        >
                            <RefreshCw class="w-4 h-4" />{t("g.reset")}
                        </button>
                    </div>
                </div>
            {/if}
            <p class="text-xs text-gray-400 mt-2">
                {t("naiSettings.emotionStickersHelp")}
            </p>
        </div>

        <!-- Batch Generation -->
        <div class="bg-gray-800 rounded-xl p-4">
            <h4 class="text-md font-semibold text-white mb-3 flex items-center">
                <Download class="w-5 h-5 mr-3 text-green-400" />
                {t("naiSettings.batchGenerationTitle")}
            </h4>
            <button
                on:click={generateAllStickers}
                class="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                disabled={!$settings.naiSettings.apiKey}
            >
                <Users class="w-4 h-4" />
                {t("naiSettings.generateAllCharacters")}
            </button>
            {#if !$settings.naiSettings.apiKey}
                <p class="text-xs text-yellow-400 text-center mt-2">
                    {t("naiSettings.batchGenerationDisabled")}
                </p>
            {:else}
                <p class="text-xs text-gray-400 text-center mt-2">
                    {t("naiSettings.batchGenerationHelp")}
                </p>
            {/if}
        </div>

        <!-- Help Guide -->
        <div class="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
            <h4
                class="text-md font-semibold text-blue-300 mb-2 flex items-center"
            >
                <HelpCircle class="w-5 h-5 mr-3" />
                {t("naiSettings.helpTitle")}
            </h4>
            <div class="space-y-1 text-xs text-blue-200/80">
                <p>• {t("naiSettings.helpApiKey")}</p>
                <p>• {t("naiSettings.helpImageSizes")}</p>
                <p>• {t("naiSettings.helpDelay")}</p>
                <p>• {t("naiSettings.helpAutoGeneration")}</p>
            </div>
        </div>
    </div>
</div>
