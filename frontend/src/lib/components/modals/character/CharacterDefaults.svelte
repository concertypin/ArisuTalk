<script lang="ts">
import { t } from "$root/i18n";
import { createEventDispatcher } from "svelte";
import {
	ArrowLeft,
	User,
	Badge,
	BrainCircuit,
	MessageSquarePlus,
	Shuffle,
	Users,
} from "lucide-svelte";
import { settings } from "../../../stores/settings";

const dispatch = createEventDispatcher();
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
                {t("settings.characterDefaults")}
            </h2>
            <p class="text-sm text-gray-400">
                {t("settings.characterSubtitle")}
            </p>
        </div>
    </header>

    <div class="flex-1 overflow-y-auto p-4 space-y-6">
        <!-- User Persona -->
        <div class="bg-gray-800 rounded-xl p-4">
            <h4 class="text-md font-semibold text-white mb-3 flex items-center">
                <User class="w-5 h-5 mr-3 text-blue-400" />
                {t("settings.yourPersona")}
            </h4>
            <div class="space-y-4">
                <div>
                    <label
                        class="flex items-center text-sm font-medium text-gray-300 mb-2"
                        for="settings-user-name-mobile"
                    >
                        <Badge class="w-4 h-4 mr-2" />
                        {t("settings.nameOrNickname")}
                    </label>
                    <input
                        id="settings-user-name-mobile"
                        type="text"
                        placeholder={t("settings.yourNamePlaceholder")}
                        bind:value={$settings.userName}
                        class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm"
                    />
                    <p class="text-xs text-gray-400 mt-1">
                        {t("settings.nameOrNicknameInfo")}
                    </p>
                </div>
                <div>
                    <label
                        class="flex items-center text-sm font-medium text-gray-300 mb-2"
                        for="settings-user-desc-mobile"
                    >
                        <BrainCircuit class="w-4 h-4 mr-2" />
                        {t("settings.selfIntroduction")}
                    </label>
                    <textarea
                        id="settings-user-desc-mobile"
                        placeholder={t("settings.selfIntroductionPlaceholder")}
                        bind:value={$settings.userDescription}
                        class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 resize-none text-sm"
                        rows="4"
                    ></textarea>
                    <p class="text-xs text-gray-400 mt-1">
                        {t("settings.selfIntroductionInfo")}
                    </p>
                </div>
            </div>
        </div>

        <!-- Auto Message Settings -->
        <div class="bg-gray-800 rounded-xl p-4">
            <h4 class="text-md font-semibold text-white mb-3 flex items-center">
                <MessageSquarePlus class="w-5 h-5 mr-3 text-blue-400" />
                {t("settings.autoMessageSettings")}
            </h4>
            <div class="space-y-4">
                <div
                    class="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                >
                    <div class="flex-1 pr-4">
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
                    <label
                        class="relative inline-block w-10 h-5 cursor-pointer"
                    >
                        <input
                            type="checkbox"
                            bind:checked={$settings.proactiveChatEnabled}
                            class="sr-only peer"
                        />
                        <div
                            class="w-10 h-5 bg-gray-600 rounded-full peer-checked:bg-blue-600"
                        ></div>
                        <div
                            class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"
                        ></div>
                    </label>
                </div>

                <div class="space-y-3">
                    <div
                        class="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                    >
                        <div class="flex-1 pr-4">
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
                            class="relative inline-block w-10 h-5 cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                bind:checked={
                                    $settings.randomFirstMessageEnabled
                                }
                                class="sr-only peer"
                            />
                            <div
                                class="w-10 h-5 bg-gray-600 rounded-full peer-checked:bg-blue-600"
                            ></div>
                            <div
                                class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"
                            ></div>
                        </label>
                    </div>

                    {#if $settings.randomFirstMessageEnabled}
                        <div
                            class="space-y-3 ml-4 pl-3 border-l-2 border-gray-700"
                        >
                            <div>
                                <label
                                    for="random-character-count-mobile"
                                    class="flex items-center justify-between text-sm font-medium text-gray-300 mb-2"
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
                                    id="random-character-count-mobile"
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
                                    class="text-sm font-medium text-gray-300 mb-2 block"
                                    >{t("settings.messageFrequency")}</legend
                                >
                                <div class="grid grid-cols-2 gap-2">
                                    <div>
                                        <label
                                            for="random-min-interval-mobile"
                                            class="text-xs text-gray-400 mb-1 block"
                                            >{t("settings.minInterval")}</label
                                        >
                                        <input
                                            id="random-min-interval-mobile"
                                            type="number"
                                            min="1"
                                            max="1440"
                                            placeholder="30"
                                            bind:value={
                                                $settings.randomMessageFrequencyMin
                                            }
                                            class="w-full px-2 py-1.5 bg-gray-700 text-white rounded-md border-0 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            for="random-max-interval-mobile"
                                            class="text-xs text-gray-400 mb-1 block"
                                            >{t("settings.maxInterval")}</label
                                        >
                                        <input
                                            id="random-max-interval-mobile"
                                            type="number"
                                            min="1"
                                            max="1440"
                                            placeholder="120"
                                            bind:value={
                                                $settings.randomMessageFrequencyMax
                                            }
                                            class="w-full px-2 py-1.5 bg-gray-700 text-white rounded-md border-0 text-sm"
                                        />
                                    </div>
                                </div>
                                <p class="text-xs text-gray-400 mt-2">
                                    {t("settings.messageFrequencyInfo")}
                                </p>
                            </fieldset>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>
