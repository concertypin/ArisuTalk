<script>
  import { MessageCircle, Wrench, RefreshCw } from 'lucide-svelte';
  import { t } from '../../i18n.js';
  import { isResetOnRefreshEnabled, toggleResetOnRefresh } from '../stores/debugSettings';
  import { get } from 'svelte/store';

  let isEnabled = get(isResetOnRefreshEnabled);

  function handleToggle() {
    toggleResetOnRefresh();
    isEnabled = get(isResetOnRefreshEnabled);
  }
</script>

<div id="landing-page" class="w-full h-full absolute top-0 left-0 flex flex-col items-center justify-center text-center p-4 bg-gray-950">
  <div class="max-w-md">
    {#if import.meta.env.DEV}
      <div class="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
        <Wrench class="w-12 h-12 text-white" />
      </div>
      <h2 class="text-3xl font-bold text-white mb-3">{t("landing.debugModeTitle")}</h2>
      <p class="text-gray-400 leading-relaxed mb-8">{t("landing.debugModeMessage")}</p>
      
      <!-- 개발 서버에서는 항상 ResetAtRefresh UI 표시 -->
      <div class="mt-8 flex items-center justify-center">
        <span class="mr-3 text-white">{t('debug.quickPanel.resetOnRefresh.title', 'Reset on refresh')}</span>
        <label class="switch">
          <input type="checkbox" bind:checked={isEnabled} on:change={handleToggle} />
          <span class="toggle-slider round"></span>
        </label>
      </div>
    {:else}
      <div class="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
        <MessageCircle class="w-12 h-12 text-white" />
      </div>
      <h2 class="text-3xl font-bold text-white mb-3">{t("landing.welcomeTitle")}</h2>
      <p class="text-gray-400 leading-relaxed mb-8">{t("landing.welcomeMessage")}</p>
    {/if}
  </div>
</div>
