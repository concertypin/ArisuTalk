<script lang="ts">
import { t } from "$root/i18n";
import {
	Activity,
	AlertTriangle,
	ArrowLeft,
	BarChart3,
	Bug,
	Clock,
	FlaskConical,
	Gauge,
	Info,
	Key,
	Link,
	Trash2,
} from "lucide-svelte";
import { createEventDispatcher } from "svelte";

import { clearDebugLogs } from "../../../services/logService";
import { debugLogs } from "../../../stores/logs";
import { settings } from "../../../stores/settings";
import {
	isDebugLogModalVisible,
	isMasterPasswordModalVisible,
} from "../../../stores/ui";

const dispatch = createEventDispatcher();

function handleClearLogs() {
	if (
		confirm(
			t("debugLogs.clearAllConfirm", {
				defaultValue: "Are you sure you want to clear all debug logs?",
			}),
		)
	) {
		clearDebugLogs();
	}
}

function handleEnableDebugLogs(e: Event) {
	settings.update((s) => ({
		...s,
		enableDebugLogs: (e.target as HTMLInputElement).checked,
	}));
}

function handleExperimentalTracingToggle(event: Event) {
	settings.update((current) => ({
		...current,
		experimentalTracingEnabled: (event.target as HTMLInputElement).checked,
	}));
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
                {t("settings.advancedSettings")}
            </h2>
            <p class="text-sm text-gray-400">
                {t("settings.advancedSubtitle")}
            </p>
        </div>
    </header>

    <div class="flex-1 overflow-y-auto p-4 space-y-6">
        <!-- Debug Settings -->
        <div class="bg-gray-800 rounded-xl p-4">
            <h4 class="text-md font-semibold text-white mb-3 flex items-center">
                <Bug class="w-5 h-5 mr-3 text-blue-400" />
                {t("settings.debugSettings")}
            </h4>
            <div class="space-y-3">
                <div
                    class="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                >
                    <div class="flex-1 pr-4">
                        <div class="flex items-center mb-1">
                            <Activity class="w-4 h-4 mr-2 text-blue-400" />
                            <span class="text-sm font-medium text-white"
                                >{t("settings.enableDebugLogs")}</span
                            >
                        </div>
                        <p class="text-xs text-gray-400">
                            {t("settings.debugLogsInfo")}
                        </p>
                    </div>
                    <label
                        class="relative inline-block w-10 h-5 cursor-pointer"
                    >
                        <input
                            type="checkbox"
                            on:change={handleEnableDebugLogs}
                            checked={$settings.enableDebugLogs}
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
                <div class="grid grid-cols-2 gap-3">
                    <button
                        on:click={() => isDebugLogModalVisible.set(true)}
                        class="w-full py-3 px-4 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 text-sm"
                    >
                        <BarChart3 class="w-4 h-4" />
                        {t("settings.viewLogs")}
                    </button>
                    <button
                        on:click={handleClearLogs}
                        class="w-full py-3 px-4 bg-red-600/80 hover:bg-red-600 text-white rounded-lg flex items-center justify-center gap-2 text-sm"
                    >
                        <Trash2 class="w-4 h-4" />
                        {t("settings.clearLogs")}
                    </button>
                </div>
            </div>
        </div>

        <!-- Performance -->
        <div class="bg-gray-800 rounded-xl p-4">
            <h4 class="text-md font-semibold text-white mb-3 flex items-center">
                <Gauge class="w-5 h-5 mr-3 text-blue-400" />
                {t("settings.performanceOptimization")}
            </h4>
            <div
                class="bg-gray-700/30 rounded-lg p-3 border border-gray-600/50"
            >
                <p
                    class="text-xs text-gray-400 text-center flex items-center justify-center gap-2"
                >
                    <Clock class="w-3 h-3" />
                    <span>{t("settings.performanceComingSoon")}</span>
                </p>
            </div>
        </div>

        <!-- Experimental Features -->
        <div class="bg-gray-800 rounded-xl p-4">
            <h4 class="text-md font-semibold text-white mb-3 flex items-center">
                <FlaskConical class="w-5 h-5 mr-3 text-orange-400" />
                {t("settings.experimentalFeatures")}
            </h4>
            <div
                class="flex items-start justify-between p-3 mb-3 bg-gray-700/40 rounded-lg"
            >
                <div class="pr-4 space-y-1">
                    <span class="text-sm font-medium text-white block">
                        {t("settings.experimentalTracingToggle")}
                    </span>
                    <p class="text-xs text-gray-400">
                        {t("settings.experimentalTracingDescription")}
                    </p>
                </div>
                <label class="relative inline-block w-10 h-5 cursor-pointer">
                    <input
                        type="checkbox"
                        class="sr-only peer"
                        checked={$settings.experimentalTracingEnabled}
                        on:change={handleExperimentalTracingToggle}
                    />
                    <div
                        class="w-10 h-5 bg-gray-600 rounded-full peer-checked:bg-blue-600"
                    ></div>
                    <div
                        class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"
                    ></div>
                </label>
            </div>
            <div
                class="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3"
            >
                <div class="flex items-start gap-2">
                    <AlertTriangle
                        class="w-4 h-4 text-orange-400 shrink-0 mt-0.5"
                    />
                    <div class="text-xs text-gray-300">
                        <p class="font-medium text-orange-300 mb-1">
                            {t("settings.warningNote")}
                        </p>
                        <p class="text-gray-400 mb-2">
                            {t("settings.experimentalWarning")}
                        </p>
                        {#if !$settings.experimentalTracingEnabled}
                            <p class="text-orange-200/80">
                                {t("settings.experimentalTracingReminder")}
                            </p>
                        {/if}
                    </div>
                </div>
            </div>
        </div>

        <!-- App Info -->
        <div class="bg-gray-800 rounded-xl p-4">
            <h4 class="text-md font-semibold text-white mb-3 flex items-center">
                <Info class="w-5 h-5 mr-3 text-blue-400" />
                {t("settings.applicationInfo")}
            </h4>
            <div class="text-xs space-y-1.5 text-gray-400">
                <div class="flex justify-between items-center">
                    <span>{t("settings.appName")}</span>
                    <span class="font-mono text-gray-300">ArisuTalk</span>
                </div>
                <div class="flex justify-between items-center">
                    <span>{t("settings.uiMode")}</span>
                    <span class="font-mono text-gray-300">Mobile</span>
                </div>
                <div class="flex justify-between items-center">
                    <span>{t("settings.browser")}</span>
                    <span class="font-mono text-gray-300"
                        >{navigator.userAgent.split(" ").pop()}</span
                    >
                </div>
                <div class="flex justify-between items-center">
                    <span>{t("settings.screenResolution")}</span>
                    <span class="font-mono text-gray-300"
                        >{window.screen.width}×{window.screen.height}</span
                    >
                </div>
                <div class="flex justify-between items-center">
                    <span>{t("settings.appVersion")}</span>
                    <a
                        href={import.meta.env.VITE_VERSION_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="font-mono text-gray-300 hover:underline flex items-center gap-2"
                    >
                        <Link class="w-4 h-4 inline-block text-gray-300" />
                        <span class="inline-block"
                            >{import.meta.env.VITE_VERSION_CHANNEL} ({import.meta
                                .env.VITE_VERSION_NAME})</span
                        >
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>
