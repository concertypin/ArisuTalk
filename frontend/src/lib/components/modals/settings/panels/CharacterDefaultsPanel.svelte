<script lang="ts">
    import { t } from "$root/i18n";
    import {
        Badge,
        BrainCircuit,
        MessageSquarePlus,
        Shuffle,
        User,
        Users,
    } from "lucide-svelte";

    import { settings } from "../../../../stores/settings";

    function handleSettingChange(key: string, value: unknown) {
        settings.update((s) => ({ ...s, [key]: value }));
    }
</script>

<div class="space-y-6">
    <!-- User Persona -->
    <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
            <User class="w-5 h-5 mr-3 text-blue-400" />
            {t("settings.yourPersona")}
        </h4>
        <div class="space-y-4">
            <div>
                <label
                    class="flex items-center text-sm font-medium text-gray-300 mb-2"
                    for="settings-user-name"
                >
                    <Badge class="w-4 h-4 mr-2" />
                    {t("settings.nameOrNickname")}
                </label>
                <input
                    id="settings-user-name"
                    type="text"
                    placeholder={t("settings.yourNamePlaceholder")}
                    bind:value={$settings.userName}
                    class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                />
                <p class="text-xs text-gray-400 mt-1">
                    {t("settings.nameOrNicknameInfo")}
                </p>
            </div>
            <div>
                <label
                    class="flex items-center text-sm font-medium text-gray-300 mb-2"
                    for="settings-user-desc"
                >
                    <BrainCircuit class="w-4 h-4 mr-2" />
                    {t("settings.selfIntroduction")}
                </label>
                <textarea
                    id="settings-user-desc"
                    placeholder={t("settings.selfIntroductionPlaceholder")}
                    bind:value={$settings.userDescription}
                    class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 resize-none"
                    rows="4"
                ></textarea>
                <p class="text-xs text-gray-400 mt-1">
                    {t("settings.selfIntroductionInfo")}
                </p>
            </div>
        </div>
    </div>

    <!-- Auto Message Settings -->
    <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
            <MessageSquarePlus class="w-5 h-5 mr-3 text-blue-400" />
            {t("settings.autoMessageSettings")}
        </h4>
        <div class="space-y-6">
            <!-- Proactive Chat -->
            <div
                class="flex items-center justify-between p-4 bg-gray-600/30 rounded-lg"
            >
                <div class="flex-1">
                    <div class="flex items-center mb-1">
                        <Users class="w-4 h-4 mr-2 text-blue-400" />
                        <span class="text-sm font-medium text-white"
                            >{t("settings.proactiveChat")}</span
                        >
                    </div>
                    <p class="text-xs text-gray-400">
                        {t("settings.proactiveChatInfo")}
                    </p>
                </div>
                <label class="relative inline-block w-12 h-6 cursor-pointer">
                    <input
                        type="checkbox"
                        bind:checked={$settings.proactiveChatEnabled}
                        class="sr-only peer"
                    />
                    <div
                        class="w-12 h-6 bg-gray-600 rounded-full peer-checked:bg-blue-600 transition-colors"
                    ></div>
                    <div
                        class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"
                    ></div>
                </label>
            </div>

            <!-- Random First Message -->
            <div class="space-y-4">
                <div
                    class="flex items-center justify-between p-4 bg-gray-600/30 rounded-lg"
                >
                    <div class="flex-1">
                        <div class="flex items-center mb-1">
                            <Shuffle class="w-4 h-4 mr-2 text-blue-400" />
                            <span class="text-sm font-medium text-white"
                                >{t("settings.randomFirstMessage")}</span
                            >
                        </div>
                        <p class="text-xs text-gray-400">
                            {t("settings.randomFirstMessageInfo")}
                        </p>
                    </div>
                    <label
                        class="relative inline-block w-12 h-6 cursor-pointer"
                    >
                        <input
                            type="checkbox"
                            bind:checked={$settings.randomFirstMessageEnabled}
                            class="sr-only peer"
                        />
                        <div
                            class="w-12 h-6 bg-gray-600 rounded-full peer-checked:bg-blue-600 transition-colors"
                        ></div>
                        <div
                            class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"
                        ></div>
                    </label>
                </div>

                {#if $settings.randomFirstMessageEnabled}
                    <div class="space-y-4 ml-4">
                        <div class="bg-gray-600/20 rounded-lg p-4 space-y-4">
                            <div>
                                <label
                                    for="random-character-count"
                                    class="flex items-center justify-between text-sm font-medium text-gray-300 mb-3"
                                >
                                    <span>{t("settings.characterCount")}</span>
                                    <span class="text-blue-400 font-semibold"
                                        >{$settings.randomCharacterCount ||
                                            3}{t(
                                            "settings.characterCountUnit"
                                        )}</span
                                    >
                                </label>
                                <input
                                    id="random-character-count"
                                    type="range"
                                    min="1"
                                    max="5"
                                    step="1"
                                    bind:value={$settings.randomCharacterCount}
                                    class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <fieldset>
                                <legend
                                    class="text-sm font-medium text-gray-300 mb-3 block"
                                    >{t("settings.messageFrequency")}</legend
                                >
                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <label
                                            for="random-min-interval"
                                            class="text-xs text-gray-400 mb-1 block"
                                            >{t("settings.minInterval")}</label
                                        >
                                        <input
                                            id="random-min-interval"
                                            type="number"
                                            min="1"
                                            max="1440"
                                            placeholder="30"
                                            bind:value={
                                                $settings.randomMessageFrequencyMin
                                            }
                                            class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            for="random-max-interval"
                                            class="text-xs text-gray-400 mb-1 block"
                                            >{t("settings.maxInterval")}</label
                                        >
                                        <input
                                            id="random-max-interval"
                                            type="number"
                                            min="1"
                                            max="1440"
                                            placeholder="120"
                                            bind:value={
                                                $settings.randomMessageFrequencyMax
                                            }
                                            class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm"
                                        />
                                    </div>
                                </div>
                                <p class="text-xs text-gray-400 mt-2">
                                    {t("settings.messageFrequencyInfo")}
                                </p>
                            </fieldset>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
