<script lang="ts">
    import {
        NOVELAI_MODELS,
        NOVELAI_NOISE_SCHEDULES,
        NOVELAI_SAMPLERS,
    } from "$constants/novelaiConfig";
    import { DEFAULT_EMOTIONS } from "$root/defaults";
    import { t } from "$root/i18n";
    import { characters } from "$stores/character";
    import { settings } from "$stores/settings";
    import type { NAIGenerationItem } from "$types/nai";
    import {
        BarChart3,
        Check,
        Cpu,
        Download,
        Edit,
        Eye,
        EyeOff,
        HelpCircle,
        Image,
        Loader2,
        Plus,
        RefreshCw,
        Settings,
        Smile,
        Trash2,
        UserPlus,
        Users,
        X,
    } from "lucide-svelte";
    import { onMount } from "svelte";

    // Ensure naiSettings exists (runtime check for legacy data)
    if (!$settings.naiSettings) {
        ($settings as any).naiSettings = {
            apiKey: "",
            model: "nai-diffusion-3",
            preferredSize: "square",
            steps: 28,
            scale: 5,
            sampler: "k_euler",
            minDelay: 2000,
            maxAdditionalDelay: 5000,
            autoGenerate: false,
        };
    }

    let apiKeyVisible = false;
    let maskedApiKey =
        "●".repeat(8) + ($settings.naiSettings?.apiKey?.slice(-4) || "");

    let minDelaySeconds = ($settings.naiSettings?.minDelay || 0) / 1000;
    let maxAdditionalDelaySeconds =
        ($settings.naiSettings?.maxAdditionalDelay || 0) / 1000;

    $: $settings.naiSettings.minDelay = minDelaySeconds * 1000;
    $: $settings.naiSettings.maxAdditionalDelay =
        maxAdditionalDelaySeconds * 1000;

    let isEditingNaiList = false;

    let newNaiItem: { title: string; emotion: string; action: string } = {
        title: "",
        emotion: "",
        action: "",
    };

    let totalGenerated = 0;
    let charactersWithGenerated = 0;
    let totalStickers = 0;
    let generationRate = "0";
    let characterStats: { name: string; count: number }[] = [];

    $: {
        let generated = 0;
        let withGenerated = 0;
        let total = 0;
        let stats: { name: string; count: number }[] = [];

        $characters.forEach((character) => {
            if (character.stickers && character.stickers.length > 0) {
                total += character.stickers.length;
                // Assuming 'generated' property exists on Sticker, possibly added by generation logic
                const generatedStickers = character.stickers.filter(
                    (s) => s.generated
                );
                const generatedCount = generatedStickers.length;
                generated += generatedCount;
                if (generatedCount > 0) {
                    withGenerated++;
                    stats.push({ name: character.name, count: generatedCount });
                }
            }
        });

        totalGenerated = generated;
        charactersWithGenerated = withGenerated;
        totalStickers = total;
        generationRate =
            total > 0 ? ((generated / total) * 100).toFixed(1) : "0";
        characterStats = stats.sort((a, b) => b.count - a.count);
    }

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
        $settings.naiSettings.naiGenerationList = [
            ...DEFAULT_EMOTIONS,
        ] as unknown as NAIGenerationItem[];
    }

    function generateAllStickers() {
        console.log("generateAllStickers");
    }
</script>

<div class="space-y-6">
    <!-- NAI API Settings -->
    <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
            <Image class="w-5 h-5 mr-3 text-purple-400" />
            {t("naiSettings.apiSettingsTitle")}
        </h4>

        <div class="space-y-4">
            <div>
                <label
                    for="nai-api-key"
                    class="block text-sm font-medium text-gray-300 mb-2"
                >
                    {t("naiSettings.apiKey")}
                </label>
                <div class="flex gap-2">
                    <input
                        id="nai-api-key"
                        bind:value={$settings.naiSettings.apiKey}
                        type={apiKeyVisible ? "text" : "password"}
                        placeholder={t("naiSettings.apiKeyPlaceholder")}
                        class="flex-1 px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-purple-500/50 transition-all duration-200"
                    />
                    <button
                        on:click={() => (apiKeyVisible = !apiKeyVisible)}
                        type="button"
                        class="px-3 py-3 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                        title={t("naiSettings.apiKeyToggle")}
                    >
                        {#if apiKeyVisible}
                            <EyeOff class="w-4 h-4 pointer-events-none" />
                        {:else}
                            <Eye class="w-4 h-4 pointer-events-none" />
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
    <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
            <Cpu class="w-5 h-5 mr-3 text-green-400" />
            {t("naiSettings.modelSettingsTitle")}
        </h4>

        <div class="space-y-4">
            <div>
                <label
                    for="nai-model"
                    class="block text-sm font-medium text-gray-300 mb-2"
                >
                    {t("naiSettings.model")}
                </label>
                <select
                    id="nai-model"
                    bind:value={$settings.naiSettings.model}
                    class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-green-500/50"
                >
                    {#each Object.entries(NOVELAI_MODELS) as [modelId, modelInfo]}
                        <option value={modelId}>
                            {modelInfo.name} ({modelInfo.version})
                        </option>
                    {/each}
                </select>
                <div class="text-xs text-gray-400 mt-1">
                    {t("naiSettings.modelHelp")}
                </div>
            </div>

            <div>
                <label
                    for="nai-image-size"
                    class="block text-sm font-medium text-gray-300 mb-2"
                >
                    {t("naiSettings.imageSize")}
                </label>
                <select
                    id="nai-image-size"
                    bind:value={$settings.naiSettings.preferredSize}
                    class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-green-500/50"
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

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label
                        for="nai-min-delay"
                        class="block text-sm font-medium text-gray-300 mb-2"
                    >
                        {t("naiSettings.minDelayTime")}
                    </label>
                    <input
                        id="nai-min-delay"
                        bind:value={minDelaySeconds}
                        type="number"
                        min="10"
                        max="60"
                        class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-green-500/50"
                    />
                    <div class="text-xs text-gray-400 mt-1">
                        {t("naiSettings.minDelayHelp")}
                    </div>
                </div>

                <div>
                    <label
                        for="nai-max-additional-delay"
                        class="block text-sm font-medium text-gray-300 mb-2"
                    >
                        {t("naiSettings.maxAdditionalTime")}
                    </label>
                    <input
                        id="nai-max-additional-delay"
                        bind:value={maxAdditionalDelaySeconds}
                        type="number"
                        min="0"
                        max="30"
                        class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-green-500/50"
                    />
                    <div class="text-xs text-gray-400 mt-1">
                        {t("naiSettings.maxAdditionalHelp")}
                    </div>
                </div>
            </div>

            <div class="border-t border-gray-600 pt-4"></div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label
                        for="nai-steps"
                        class="block text-sm font-medium text-gray-300 mb-2"
                    >
                        {t("naiSettings.steps")}
                    </label>
                    <input
                        id="nai-steps"
                        bind:value={$settings.naiSettings.steps}
                        type="range"
                        min="1"
                        max="50"
                        class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div
                        class="flex justify-between text-xs text-gray-400 mt-1"
                    >
                        <span>1</span>
                        <span>{$settings.naiSettings.steps}</span>
                        <span>50</span>
                    </div>
                </div>

                <div>
                    <label
                        for="nai-scale"
                        class="block text-sm font-medium text-gray-300 mb-2"
                    >
                        {t("naiSettings.scale")}
                    </label>
                    <input
                        id="nai-scale"
                        bind:value={$settings.naiSettings.scale}
                        type="range"
                        min="1"
                        max="30"
                        step="0.5"
                        class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div
                        class="flex justify-between text-xs text-gray-400 mt-1"
                    >
                        <span>1.0</span>
                        <span>{$settings.naiSettings.scale}</span>
                        <span>30.0</span>
                    </div>
                </div>
            </div>

            <div>
                <label
                    for="nai-sampler"
                    class="block text-sm font-medium text-gray-300 mb-2"
                >
                    {t("naiSettings.sampler")}
                </label>
                <select
                    id="nai-sampler"
                    bind:value={$settings.naiSettings.sampler}
                    class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-green-500/50"
                >
                    {#each NOVELAI_SAMPLERS as samplerOption}
                        <option value={samplerOption}>
                            {samplerOption.replace(/_/g, " ").toUpperCase()}
                        </option>
                    {/each}
                </select>
            </div>

            <div>
                <label
                    for="nai-noise-schedule"
                    class="block text-sm font-medium text-gray-300 mb-2"
                >
                    {t("naiSettings.noiseSchedule")}
                </label>
                <select
                    id="nai-noise-schedule"
                    bind:value={$settings.naiSettings.noise_schedule}
                    class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-green-500/50"
                >
                    {#each NOVELAI_NOISE_SCHEDULES as schedule}
                        <option value={schedule}>
                            {schedule.charAt(0).toUpperCase() +
                                schedule.slice(1)}
                        </option>
                    {/each}
                </select>
            </div>
        </div>
    </div>

    <!-- Character and Image Settings -->
    <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
            <UserPlus class="w-5 h-5 mr-3 text-pink-400" />
            {t("naiSettings.characterImageSettingsTitle")}
        </h4>

        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <div>
                    <label
                        for="nai-use-character-prompts"
                        class="text-sm font-medium text-gray-300"
                    >
                        {t("naiSettings.useCharacterPrompts")}
                    </label>
                    <p class="text-xs text-gray-400 mt-1">
                        {t("naiSettings.useCharacterPromptsHelp")}
                    </p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input
                        id="nai-use-character-prompts"
                        bind:checked={$settings.naiSettings.useCharacterPrompts}
                        type="checkbox"
                        class="sr-only peer"
                    />
                    <div
                        class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pink-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"
                    ></div>
                </label>
            </div>

            <div class="flex items-center justify-between">
                <div>
                    <label
                        for="nai-vibe-transfer"
                        class="text-sm font-medium text-gray-300"
                    >
                        {t("naiSettings.vibeTransfer")}
                    </label>
                    <p class="text-xs text-gray-400 mt-1">
                        {t("naiSettings.vibeTransferHelp")}
                    </p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input
                        id="nai-vibe-transfer"
                        bind:checked={$settings.naiSettings.vibeTransferEnabled}
                        type="checkbox"
                        class="sr-only peer"
                    />
                    <div
                        class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pink-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"
                    ></div>
                </label>
            </div>

            {#if $settings.naiSettings.vibeTransferEnabled}
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label
                            for="nai-vibe-strength"
                            class="block text-sm font-medium text-gray-300 mb-2"
                        >
                            {t("naiSettings.vibeStrength")}
                        </label>
                        <input
                            id="nai-vibe-strength"
                            bind:value={
                                $settings.naiSettings.vibeTransferStrength
                            }
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div class="text-xs text-gray-400 mt-1 text-center">
                            <span
                                >{$settings.naiSettings
                                    .vibeTransferStrength}</span
                            >
                        </div>
                    </div>

                    <div>
                        <label
                            for="nai-vibe-info-extracted"
                            class="block text-sm font-medium text-gray-300 mb-2"
                        >
                            {t("naiSettings.vibeInfoExtracted")}
                        </label>
                        <input
                            id="nai-vibe-info-extracted"
                            bind:value={
                                $settings.naiSettings
                                    .vibeTransferInformationExtracted
                            }
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div class="text-xs text-gray-400 mt-1 text-center">
                            <span
                                >{$settings.naiSettings
                                    .vibeTransferInformationExtracted}</span
                            >
                        </div>
                    </div>
                </div>

                <div>
                    <label
                        for="nai-vibe-image-upload"
                        class="block text-sm font-medium text-gray-300 mb-2"
                    >
                        {t("naiSettings.vibeImageUpload")}
                    </label>
                    <input
                        id="nai-vibe-image-upload"
                        type="file"
                        accept="image/*"
                        class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-pink-500/50 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-600 file:text-white hover:file:bg-gray-500"
                    />
                    <div class="text-xs text-gray-400 mt-1">
                        {t("naiSettings.vibeImageHelp")}
                    </div>
                </div>
            {/if}
        </div>
    </div>

    <!-- Advanced Settings -->
    <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
            <Settings class="w-5 h-5 mr-3 text-yellow-400" />
            {t("naiSettings.advancedSettingsTitle")}
        </h4>

        <div class="space-y-4">
            <!-- SMEA Settings (v3 models only) -->
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <input
                        id="nai-smea-enable"
                        bind:checked={$settings.naiSettings.sm}
                        type="checkbox"
                        class="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                    />
                    <label
                        for="nai-smea-enable"
                        class="flex items-center space-x-2 cursor-pointer"
                    >
                        <span class="text-sm font-medium text-gray-300">
                            {t("naiSettings.smeaEnable")}
                        </span>
                    </label>
                    <div class="text-xs text-gray-400 mt-1 ml-6">
                        {t("naiSettings.smeaHelp")}
                    </div>
                </div>

                <div>
                    <input
                        id="nai-smea-dyn-enable"
                        bind:checked={$settings.naiSettings.sm_dyn}
                        type="checkbox"
                        class="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                    />
                    <label
                        for="nai-smea-dyn-enable"
                        class="flex items-center space-x-2 cursor-pointer"
                    >
                        <span class="text-sm font-medium text-gray-300">
                            {t("naiSettings.smeaDynEnable")}
                        </span>
                    </label>
                    <div class="text-xs text-gray-400 mt-1 ml-6">
                        {t("naiSettings.smeaDynHelp")}
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label
                        for="nai-cfg-rescale"
                        class="block text-sm font-medium text-gray-300 mb-2"
                    >
                        {t("naiSettings.cfgRescale")}
                    </label>
                    <input
                        id="nai-cfg-rescale"
                        bind:value={$settings.naiSettings.cfg_rescale}
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div class="text-xs text-gray-400 mt-1 text-center">
                        <span>{$settings.naiSettings.cfg_rescale}</span>
                    </div>
                </div>

                <div>
                    <label
                        for="nai-uncond-scale"
                        class="block text-sm font-medium text-gray-300 mb-2"
                    >
                        {t("naiSettings.uncondScale")}
                    </label>
                    <input
                        id="nai-uncond-scale"
                        bind:value={$settings.naiSettings.uncond_scale}
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div class="text-xs text-gray-400 mt-1 text-center">
                        <span>{$settings.naiSettings.uncond_scale}</span>
                    </div>
                </div>
            </div>

            <div class="flex items-center justify-between">
                <div>
                    <label
                        for="nai-dynamic-thresholding"
                        class="text-sm font-medium text-gray-300"
                    >
                        {t("naiSettings.dynamicThresholding")}
                    </label>
                    <p class="text-xs text-gray-400 mt-1">
                        {t("naiSettings.dynamicThresholdingHelp")}
                    </p>
                </div>
                <input
                    id="nai-dynamic-thresholding"
                    bind:checked={$settings.naiSettings.dynamic_thresholding}
                    type="checkbox"
                    class="sr-only peer"
                />
                <label
                    for="nai-dynamic-thresholding"
                    class="relative inline-flex items-center cursor-pointer"
                >
                    <div
                        class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"
                    ></div>
                </label>
            </div>

            {#if $settings.naiSettings.dynamic_thresholding}
                <div
                    class="grid grid-cols-2 gap-4 pl-4 border-l-2 border-yellow-500/30"
                >
                    <div>
                        <label
                            for="nai-dt-percentile"
                            class="block text-sm font-medium text-gray-300 mb-2"
                        >
                            {t("naiSettings.dtPercentile")}
                        </label>
                        <input
                            id="nai-dt-percentile"
                            bind:value={
                                $settings.naiSettings
                                    .dynamic_thresholding_percentile
                            }
                            type="range"
                            min="0.9"
                            max="1"
                            step="0.001"
                            class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div class="text-xs text-gray-400 mt-1 text-center">
                            <span
                                >{$settings.naiSettings
                                    .dynamic_thresholding_percentile}</span
                            >
                        </div>
                    </div>

                    <div>
                        <label
                            for="nai-dt-mimic-scale"
                            class="block text-sm font-medium text-gray-300 mb-2"
                        >
                            {t("naiSettings.dtMimicScale")}
                        </label>
                        <input
                            id="nai-dt-mimic-scale"
                            bind:value={
                                $settings.naiSettings
                                    .dynamic_thresholding_mimic_scale
                            }
                            type="range"
                            min="1"
                            max="20"
                            step="0.5"
                            class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div class="text-xs text-gray-400 mt-1 text-center">
                            <span
                                >{$settings.naiSettings
                                    .dynamic_thresholding_mimic_scale}</span
                            >
                        </div>
                    </div>
                </div>
            {/if}

            <div class="flex flex-wrap gap-4">
                <input
                    id="nai-legacy"
                    bind:checked={$settings.naiSettings.legacy}
                    type="checkbox"
                    class="mr-2 rounded border-gray-600 text-yellow-600 focus:ring-yellow-500"
                />
                <label
                    for="nai-legacy"
                    class="flex items-center cursor-pointer"
                >
                    <span class="text-sm text-gray-300"
                        >{t("naiSettings.legacyMode")}</span
                    >
                </label>

                <input
                    id="nai-add-original-image"
                    bind:checked={$settings.naiSettings.add_original_image}
                    type="checkbox"
                    class="mr-2 rounded border-gray-600 text-yellow-600 focus:ring-yellow-500"
                />
                <label
                    for="nai-add-original-image"
                    class="flex items-center cursor-pointer"
                >
                    <span class="text-sm text-gray-300"
                        >{t("naiSettings.addOriginalImage")}</span
                    >
                </label>
            </div>
        </div>
    </div>

    <!-- NAI 일괄 생성 목록 -->
    <div class="bg-gray-700/30 rounded-xl p-6">
        <h4
            class="text-lg font-semibold text-white mb-4 flex items-center justify-between"
        >
            <div class="flex items-center">
                <Smile class="w-5 h-5 mr-3 text-blue-400" />
                {t("naiSettings.naiGenerationListTitle")}
            </div>
            <button
                on:click={() => (isEditingNaiList = !isEditingNaiList)}
                class="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1"
            >
                <Edit class="w-3 h-3" />
                {t("naiHandlers.editNaiGenerationList")}
            </button>
        </h4>

        <!-- 현재 목록 표시 -->
        {#if !isEditingNaiList}
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {#each $settings.naiSettings.naiGenerationList || DEFAULT_EMOTIONS as item}
                    {@const titleKey =
                        "titleKey" in item ? item.titleKey : undefined}
                    {@const fullKey = titleKey
                        ? `naiSettings.emotion.${titleKey}`
                        : null}
                    {@const title = "title" in item ? item.title || "" : ""}
                    {@const displayText = fullKey ? t(fullKey) : title}
                    <div
                        class="bg-gray-600/50 rounded-lg px-3 py-2 text-center"
                    >
                        <span class="text-xs text-gray-300">{displayText}</span>
                    </div>
                {/each}
            </div>
        {/if}

        <!-- 편집 UI -->
        {#if isEditingNaiList}
            <div class="space-y-4">
                <!-- 현재 목록 편집 -->
                <div>
                    <h5 class="block text-sm font-medium text-gray-300 mb-2">
                        {t("naiHandlers.currentList")}
                    </h5>
                    <div class="space-y-2 max-h-32 overflow-y-auto">
                        {#each $settings.naiSettings.naiGenerationList || [] as item, index}
                            {@const titleKey =
                                "titleKey" in item ? item.titleKey : undefined}
                            {@const fullKey = titleKey
                                ? `naiSettings.emotion.${titleKey}`
                                : null}
                            {@const title =
                                "title" in item ? item.title || "" : ""}
                            {@const displayText = fullKey ? t(fullKey) : title}
                            <div
                                class="flex items-center gap-2 bg-gray-600/30 p-2 rounded-lg"
                            >
                                <span
                                    class="flex-1 text-sm text-gray-300 truncate"
                                    >{displayText}</span
                                >
                                <button
                                    on:click={() => deleteNaiItem(index)}
                                    class="p-1.5 bg-red-600 hover:bg-red-700 rounded-md"
                                    aria-label={t("naiHandlers.deleteItem", {
                                        item: displayText,
                                    })}
                                >
                                    <Trash2 class="w-3 h-3 text-white" />
                                </button>
                            </div>
                        {/each}
                    </div>
                </div>

                <!-- 새 항목 추가 -->
                <div class="space-y-3">
                    <div>
                        <label
                            for="nai-new-item-title"
                            class="block text-sm font-medium text-gray-300 mb-2"
                        >
                            {t("naiHandlers.itemTitleLabel")}
                        </label>
                        <input
                            id="nai-new-item-title"
                            bind:value={newNaiItem.title}
                            type="text"
                            placeholder={t("naiHandlers.itemTitlePlaceholder")}
                            class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm"
                        />
                        <div class="text-xs text-gray-400 mt-1">
                            {t("naiHandlers.itemTitleHelp")}
                        </div>
                    </div>

                    <div>
                        <label
                            for="nai-new-item-emotion"
                            class="block text-sm font-medium text-gray-300 mb-2"
                        >
                            {t("naiHandlers.emotionLabel")}
                        </label>
                        <input
                            id="nai-new-item-emotion"
                            bind:value={newNaiItem.emotion}
                            type="text"
                            placeholder={t("naiHandlers.emotionPlaceholder")}
                            class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm"
                        />
                        <div class="text-xs text-gray-400 mt-1">
                            {t("naiHandlers.emotionHelp")}
                        </div>
                    </div>

                    <div>
                        <label
                            for="nai-new-item-action"
                            class="block text-sm font-medium text-gray-300 mb-2"
                        >
                            {t("naiHandlers.actionSituationLabel")}
                        </label>
                        <textarea
                            id="nai-new-item-action"
                            bind:value={newNaiItem.action}
                            rows="3"
                            placeholder={t(
                                "naiHandlers.actionSituationPlaceholder"
                            )}
                            class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm resize-none"
                        ></textarea>
                        <div class="text-xs text-gray-400 mt-1">
                            {t("naiHandlers.actionSituationHelp")}
                        </div>
                    </div>

                    <button
                        on:click={addNaiItem}
                        class="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus class="w-4 h-4" />
                        {t("naiHandlers.addNaiGenerationItem")}
                    </button>
                </div>

                <!-- 버튼 영역 -->
                <div class="flex gap-2 pt-4 border-t border-gray-600">
                    <button
                        on:click={saveNaiList}
                        class="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <Check class="w-4 h-4" />
                        {t("naiHandlers.saveList")}
                    </button>
                    <button
                        on:click={() => (isEditingNaiList = false)}
                        class="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <X class="w-4 h-4" />
                        {t("naiHandlers.cancel")}
                    </button>
                    <button
                        on:click={resetNaiList}
                        class="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCw class="w-4 h-4" />
                        {t("naiHandlers.resetToDefault")}
                    </button>
                </div>
            </div>
        {/if}

        <div class="text-xs text-gray-400 mt-4">
            {t("naiSettings.emotionStickersHelp")}
        </div>
    </div>

    <!-- Batch Generation -->
    <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
            <Download class="w-5 h-5 mr-3 text-green-400" />
            {t("naiSettings.batchGenerationTitle")}
        </h4>

        <div class="space-y-4">
            <div>
                <button
                    on:click={generateAllStickers}
                    class="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!$settings.naiSettings.apiKey}
                >
                    <Users class="w-4 h-4" />
                    {t("naiSettings.generateAllCharacters")}
                </button>
            </div>

            {#if !$settings.naiSettings.apiKey}
                <div class="text-xs text-yellow-400 text-center">
                    {t("naiSettings.batchGenerationDisabled")}
                </div>
            {:else}
                <div class="text-xs text-gray-400 text-center">
                    {t("naiSettings.batchGenerationHelp")}
                </div>
            {/if}
        </div>
    </div>

    <!-- Generation Statistics -->
    <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
            <BarChart3 class="w-5 h-5 mr-3 text-orange-400" />
            {t("naiSettings.statsTitle")}
        </h4>
        <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-600/30 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-white">
                    {totalGenerated}
                </div>
                <div class="text-xs text-gray-400">
                    {t("naiSettings.generatedStickers")}
                </div>
            </div>
            <div class="bg-gray-600/30 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-white">
                    {charactersWithGenerated}
                </div>
                <div class="text-xs text-gray-400">
                    {t("naiSettings.generatedCharacters")}
                </div>
            </div>
            <div class="bg-gray-600/30 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-white">{totalStickers}</div>
                <div class="text-xs text-gray-400">
                    {t("naiSettings.totalStickers")}
                </div>
            </div>
            <div class="bg-gray-600/30 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-white">
                    {generationRate}%
                </div>
                <div class="text-xs text-gray-400">
                    {t("naiSettings.generationRate")}
                </div>
            </div>
        </div>

        {#if totalGenerated > 0}
            <div class="mt-4">
                <h5 class="text-sm font-medium text-gray-300 mb-2">
                    {t("naiSettings.characterStats")}
                </h5>
                <div class="space-y-1 max-h-32 overflow-y-auto">
                    {#each characterStats as stat}
                        <div class="flex justify-between text-xs">
                            <span class="text-gray-300">{stat.name}</span>
                            <span class="text-gray-400"
                                >{t("naiSettings.stickerCount", {
                                    count: String(stat.count),
                                })}</span
                            >
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    </div>

    <!-- Help Guide -->
    <div class="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-blue-300 mb-3 flex items-center">
            <HelpCircle class="w-5 h-5 mr-3" />
            {t("naiSettings.helpTitle")}
        </h4>
        <div class="space-y-2 text-sm text-blue-200">
            <p>{t("naiSettings.helpApiKey")}</p>
            <p>{t("naiSettings.helpImageSizes")}</p>
            <p>{t("naiSettings.helpDelay")}</p>
            <p>{t("naiSettings.helpAutoGeneration")}</p>
            <p>{t("naiSettings.helpBatchGeneration")}</p>
        </div>
    </div>
</div>
