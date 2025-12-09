<script lang="ts">
    import { getLanguage, setLanguage, t } from "$root/i18n";
    import {
        ArrowLeft,
        Check,
        Clock,
        Globe,
        Info,
        Moon,
        Palette,
        Type,
        Zap,
    } from "lucide-svelte";
    import { createEventDispatcher } from "svelte";

    import { settings } from "../../../stores/settings";

    const dispatch = createEventDispatcher();
    let currentLanguage = getLanguage();

    function handleLanguageChange(lang: string) {
        if (currentLanguage === lang) return;
        setLanguage(lang as "en" | "ko");
        alert(t("system.languageChangeMessage"));
        setTimeout(() => window.location.reload(), 300);
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
                {t("settings.appearanceSettings")}
            </h2>
            <p class="text-sm text-gray-400">
                {t("settings.appearanceSubtitle")}
            </p>
        </div>
    </header>

    <div class="flex-1 overflow-y-auto p-4 space-y-6">
        <!-- UI Size -->
        <div class="bg-gray-800 rounded-xl p-4">
            <h4 class="text-md font-semibold text-white mb-3 flex items-center">
                <Type class="w-5 h-5 mr-3 text-blue-400" />
                {t("settings.interfaceSize")}
            </h4>
            <div class="space-y-3">
                <div class="relative">
                    <label
                        for="font-scale-slider-mobile"
                        class="flex items-center justify-between text-sm font-medium text-gray-300 mb-2"
                    >
                        <span>{t("settings.uiScale")}</span>
                        <span class="text-blue-400 font-mono text-sm"
                            >{Math.round($settings.fontScale * 100)}%</span
                        >
                    </label>
                    <input
                        id="font-scale-slider-mobile"
                        type="range"
                        min="0.8"
                        max="1.4"
                        step="0.1"
                        bind:value={$settings.fontScale}
                        class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div
                        class="w-full flex justify-between text-xs text-gray-400 mt-1"
                    >
                        <span>80%</span>
                        <span>100%</span>
                        <span>140%</span>
                    </div>
                </div>
                <div class="bg-gray-700/50 rounded-lg p-2">
                    <p class="text-xs text-gray-300/80 flex items-start">
                        <Info class="w-3 h-3 inline mr-1.5 shrink-0 mt-0.5" />
                        <span>{t("settings.uiScaleInfo")}</span>
                    </p>
                </div>
            </div>
        </div>

        <!-- Language -->
        <div class="bg-gray-800 rounded-xl p-4">
            <h4 class="text-md font-semibold text-white mb-3 flex items-center">
                <Globe class="w-5 h-5 mr-3 text-blue-400" />
                {t("settings.language")}
            </h4>
            <div class="space-y-3">
                <button
                    on:click={() => handleLanguageChange("ko")}
                    class="w-full p-3 rounded-lg border transition-all duration-200 flex items-center gap-3 {currentLanguage ===
                    'ko'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}"
                >
                    <div class="text-xl">🇰🇷</div>
                    <div class="text-left flex-1">
                        <div class="font-medium text-sm">
                            {t("settings.languageKorean")}
                        </div>
                        <div class="text-xs opacity-75">한국어</div>
                    </div>
                    {#if currentLanguage === "ko"}<Check
                            class="w-5 h-5 text-blue-400"
                        />{/if}
                </button>
                <button
                    on:click={() => handleLanguageChange("en")}
                    class="w-full p-3 rounded-lg border transition-all duration-200 flex items-center gap-3 {currentLanguage ===
                    'en'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}"
                >
                    <div class="text-xl">🇺🇸</div>
                    <div class="text-left flex-1">
                        <div class="font-medium text-sm">
                            {t("settings.languageEnglish")}
                        </div>
                        <div class="text-xs opacity-75">English</div>
                    </div>
                    {#if currentLanguage === "en"}<Check
                            class="w-5 h-5 text-blue-400"
                        />{/if}
                </button>
                <div class="bg-gray-700/50 rounded-lg p-2">
                    <p class="text-xs text-gray-300/80 flex items-start">
                        <Info class="w-3 h-3 inline mr-1.5 shrink-0 mt-0.5" />
                        <span>{t("settings.languageInfo")}</span>
                    </p>
                </div>
            </div>
        </div>

        <!-- Theme -->
        <div class="bg-gray-800 rounded-xl p-4">
            <h4 class="text-md font-semibold text-white mb-3 flex items-center">
                <Palette class="w-5 h-5 mr-3 text-blue-400" />
                {t("settings.themeSettings")}
            </h4>
            <div class="bg-gray-700/50 rounded-lg p-4 text-center">
                <Moon class="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p class="text-gray-300 text-sm font-medium">
                    {t("settings.darkTheme")}
                </p>
                <p class="text-xs text-gray-400 mt-1">
                    {t("settings.currentTheme")}
                </p>
            </div>
        </div>

        <!-- Animation -->
        <div class="bg-gray-800 rounded-xl p-4">
            <h4 class="text-md font-semibold text-white mb-3 flex items-center">
                <Zap class="w-5 h-5 mr-3 text-blue-400" />
                {t("settings.animationSettings")}
            </h4>
            <div
                class="bg-gray-700/30 rounded-lg p-3 border border-gray-600/50"
            >
                <p
                    class="text-xs text-gray-400 text-center flex items-center justify-center gap-2"
                >
                    <Clock class="w-3 h-3" />
                    <span>{t("settings.animationComingSoon")}</span>
                </p>
            </div>
        </div>
    </div>
</div>
