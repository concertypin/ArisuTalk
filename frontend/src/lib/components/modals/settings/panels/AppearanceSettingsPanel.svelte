<script lang="ts">
    import { getLanguage, setLanguage, t } from "$root/i18n";
    import {
        Clock,
        Globe,
        Info,
        Moon,
        Palette,
        Type,
        Zap,
    } from "lucide-svelte";

    import { settings } from "../../../../stores/settings";

    let currentLanguage = getLanguage();

    function handleLanguageChange(lang: string) {
        if (currentLanguage === lang) return;
        setLanguage(lang as "en" | "ko");
        alert(t("system.languageChangeMessage"));
        setTimeout(() => window.location.reload(), 300);
    }
</script>

<div class="space-y-6">
    <!-- UI Size -->
    <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
            <Type class="w-5 h-5 mr-3 text-blue-400" />
            {t("settings.interfaceSize")}
        </h4>
        <div class="space-y-4">
            <div class="relative">
                <label
                    for="font-scale-slider"
                    class="flex items-center justify-between text-sm font-medium text-gray-300 mb-3"
                >
                    <span>{t("settings.uiScale")}</span>
                    <span class="text-blue-400 font-mono text-sm"
                        >{Math.round($settings.fontScale * 100)}%</span
                    >
                </label>
                <input
                    id="font-scale-slider"
                    type="range"
                    min="0.8"
                    max="1.4"
                    step="0.1"
                    bind:value={$settings.fontScale}
                    class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <div
                    class="w-full flex justify-between text-xs text-gray-400 mt-1"
                >
                    <span>80%</span>
                    <span class="absolute left-1/3 -translate-x-1/2"
                        >100% ({t("system.default")})</span
                    >
                    <span>140%</span>
                </div>
            </div>
            <div class="bg-gray-600/50 rounded-lg p-3">
                <p class="text-xs text-gray-300">
                    <Info class="w-3 h-3 inline mr-1" />
                    {t("settings.uiScaleInfo")}
                </p>
            </div>
        </div>
    </div>

    <!-- Language -->
    <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
            <Globe class="w-5 h-5 mr-3 text-blue-400" />
            {t("settings.language")}
        </h4>
        <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                    on:click={() => handleLanguageChange("ko")}
                    class="p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 {currentLanguage ===
                    'ko'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                        : 'bg-gray-600/30 border-gray-600 text-gray-300 hover:bg-gray-600/50 hover:border-gray-500'}"
                >
                    <div class="text-2xl">🇰🇷</div>
                    <div class="text-left">
                        <div class="font-medium">
                            {t("settings.languageKorean")}
                        </div>
                        <div class="text-xs opacity-75">한국어</div>
                    </div>
                </button>
                <button
                    on:click={() => handleLanguageChange("en")}
                    class="p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 {currentLanguage ===
                    'en'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                        : 'bg-gray-600/30 border-gray-600 text-gray-300 hover:bg-gray-600/50 hover:border-gray-500'}"
                >
                    <div class="text-2xl">🇺🇸</div>
                    <div class="text-left">
                        <div class="font-medium">
                            {t("settings.languageEnglish")}
                        </div>
                        <div class="text-xs opacity-75">English</div>
                    </div>
                </button>
            </div>
            <div class="bg-gray-600/50 rounded-lg p-3">
                <p class="text-xs text-gray-300">
                    <Info class="w-3 h-3 inline mr-1" />
                    {t("settings.languageInfo")}
                </p>
            </div>
        </div>
    </div>

    <!-- Theme -->
    <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
            <Palette class="w-5 h-5 mr-3 text-blue-400" />
            {t("settings.themeSettings")}
        </h4>
        <div class="bg-gray-600/50 rounded-lg p-4 text-center">
            <Moon class="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p class="text-gray-300 text-sm">{t("settings.darkTheme")}</p>
            <p class="text-xs text-gray-400 mt-1">
                {t("settings.currentTheme")}
            </p>
        </div>
    </div>

    <!-- Animation -->
    <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
            <Zap class="w-5 h-5 mr-3 text-blue-400" />
            {t("settings.animationSettings")}
        </h4>
        <div class="bg-gray-600/30 rounded-lg p-3 border border-gray-600/50">
            <p class="text-xs text-gray-400 text-center">
                <Clock class="w-3 h-3 inline mr-1" />
                {t("settings.animationComingSoon")}
            </p>
        </div>
    </div>
</div>
