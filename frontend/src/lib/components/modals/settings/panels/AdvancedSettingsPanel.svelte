<script>
  import { t } from '../../../../../i18n.js';
  import { settings } from '../../../../stores/settings';
  import { debugLogs } from '../../../../stores/logs';
  import { isDebugLogModalVisible, isMasterPasswordModalVisible } from '../../../../stores/ui';
  import { clearDebugLogs } from '../../../../services/logService';
  import { Bug, Activity, BarChart3, Trash2, Gauge, Clock, FlaskConical, AlertTriangle, Info, Link } from 'lucide-svelte';

  function handleClearLogs() {
      if (confirm(t('debugLogs.clearAllConfirm', { defaultValue: 'Are you sure you want to clear all debug logs?' }))) {
          clearDebugLogs();
      }
  }

  function handleEnableDebugLogs(e) {
      settings.update(s => ({...s, enableDebugLogs: e.target.checked}));
  }

</script>

<div class="space-y-6">
    <!-- Debug Settings -->
    <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
            <Bug class="w-5 h-5 mr-3 text-blue-400" />
            {t("settings.debugSettings")}
        </h4>
        <div class="space-y-6">
            <div class="flex items-center justify-between p-4 bg-gray-600/30 rounded-lg">
                <div class="flex-1">
                    <div class="flex items-center mb-1">
                        <Activity class="w-4 h-4 mr-2 text-blue-400" />
                        <span class="text-sm font-medium text-white">{t("settings.enableDebugLogs")}</span>
                    </div>
                    <p class="text-xs text-gray-400">{t("settings.debugLogsInfo")}</p>
                </div>
                <label class="relative inline-block w-12 h-6 cursor-pointer">
                    <input type="checkbox" on:change={handleEnableDebugLogs} checked={$settings.enableDebugLogs} class="sr-only peer" />
                    <div class="w-12 h-6 bg-gray-600 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
                    <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                </label>
            </div>

            <div class="bg-gray-600/20 rounded-lg p-4 space-y-4">
                <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-300">{t("settings.currentLogCount")}</span>
                    <span class="font-mono text-blue-400">{$debugLogs.length}/1000</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button on:click={() => isDebugLogModalVisible.set(true)} class="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                        <BarChart3 class="w-4 h-4" />
                        {t("settings.viewLogs")}
                    </button>
                    <button on:click={handleClearLogs} class="w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                        <Trash2 class="w-4 h-4" />
                        {t("settings.clearLogs")}
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Performance -->
    <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
            <Gauge class="w-5 h-5 mr-3 text-blue-400" />
            {t("settings.performanceOptimization")}
        </h4>
        <div class="bg-gray-600/30 rounded-lg p-3 border border-gray-600/50">
            <p class="text-xs text-gray-400 text-center">
                <Clock class="w-3 h-3 inline mr-1" />
                {t("settings.performanceComingSoon")}
            </p>
        </div>
    </div>

    <!-- Experimental Features -->
    <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
            <FlaskConical class="w-5 h-5 mr-3 text-blue-400" />
            {t("settings.experimentalFeatures")}
        </h4>
        <div class="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
            <div class="flex items-start gap-2">
                <AlertTriangle class="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                <div class="text-xs text-gray-300">
                    <p class="font-medium text-orange-400 mb-1">{t("settings.warningNote")}</p>
                    <p>{t("settings.experimentalWarning")}</p>
                </div>
            </div>
        </div>
    </div>

    <!-- App Info -->
    <div class="bg-gray-700/30 rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
            <Info class="w-5 h-5 mr-3 text-blue-400" />
            {t("settings.applicationInfo")}
        </h4>
        <div class="bg-gray-600/20 rounded-lg p-4 space-y-2">
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-300">{t("settings.appName")}</span>
                <span class="text-sm font-mono text-blue-400">ArisuTalk</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-300">{t("settings.uiMode")}</span>
                <span class="text-sm font-mono text-blue-400">Desktop</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-300">{t("settings.browser")}</span>
                <span class="text-sm font-mono text-blue-400">{navigator.userAgent.split(' ').pop()}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-300">{t("settings.screenResolution")}</span>
                <span class="text-sm font-mono text-blue-400">{window.screen.width}×{window.screen.height}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-300">{t("settings.appVersion")}</span>
                <a href={import.meta.env.VITE_VERSION_URL} target="_blank" rel="noopener noreferrer" class="text-sm font-mono text-blue-400 hover:underline flex items-center gap-2">
                    <Link class="w-4 h-4 inline-block text-blue-400" />
                    <span class="inline-block">{import.meta.env.VITE_VERSION_CHANNEL} ({import.meta.env.VITE_VERSION_NAME})</span>
                </a>
            </div>
        </div>
    </div>
</div>
