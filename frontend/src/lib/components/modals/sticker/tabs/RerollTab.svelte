
<script>
  import { createEventDispatcher } from 'svelte';
  import { t } from '../../../../../i18n.js';
  import { RefreshCw, ArrowLeft, ArrowRight } from 'lucide-svelte';

  export let rerollData = null;
  export let sticker = null;
  export let index = null;
  export let rerollResult = null;
  export let rerolling = false;

  let rerollPrompt = rerollData?.prompt || '';
  let rerollSteps = rerollData?.steps || 28;
  let rerollScale = rerollData?.scale || 3;
  let rerollSize = 'square';

  const dispatch = createEventDispatcher();

  function startReroll() {
    dispatch('reroll', {
      prompt: rerollPrompt,
      steps: rerollSteps,
      scale: rerollScale,
      size: rerollSize,
    });
  }

  function selectOriginal() {
    dispatch('select', { original: true });
  }

  function selectReroll() {
    dispatch('select', { original: false });
  }

</script>

{#if !rerollData}
  <div class="text-center py-8">
    <RefreshCw class="w-8 h-8 text-gray-400 mx-auto mb-2" />
    <p class="text-gray-400">{t("stickerPreview.noRerollData")}</p>
  </div>
{:else}
  <div class="space-y-4">
    {#if rerollResult}
      <div id="reroll-comparison">
        <h4 class="text-sm font-medium text-white mb-2">{t("stickerPreview.imageComparison")}</h4>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-gray-700 rounded-lg p-3">
            <div class="text-xs text-gray-300 mb-2 text-center">{t("stickerPreview.currentImage")}</div>
            <div class="flex justify-center">
              <div class="max-w-full">
                <img src={sticker.dataUrl} alt={sticker.name} class="max-w-full rounded-lg">
              </div>
            </div>
          </div>

          <div class="bg-gray-700 rounded-lg p-3">
            <div class="text-xs text-gray-300 mb-2 text-center">{t("stickerPreview.rerollResult")}</div>
            <div class="flex justify-center">
              <div class="max-w-full">
                <img src={rerollResult.dataUrl} alt={rerollResult.name} class="max-w-full rounded-lg">
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-2 mt-4">
          <button on:click={selectOriginal} class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
            <ArrowLeft class="w-4 h-4 mr-2 inline-block" />
            {t("stickerPreview.selectOriginal")}
          </button>
          <button on:click={selectReroll} class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
            <ArrowRight class="w-4 h-4 mr-2 inline-block" />
            {t("stickerPreview.selectReroll")}
          </button>
        </div>
      </div>
    {:else}
      <div>
        <h4 class="text-sm font-medium text-white mb-2">{t("stickerPreview.currentImage")}</h4>
        <div class="bg-gray-700 rounded-lg p-3">
          <div class="flex justify-center">
            <div class="max-w-xs">
              <img src={sticker.dataUrl} alt={sticker.name} class="max-w-full rounded-lg">
            </div>
          </div>
        </div>
      </div>
    {/if}

    <div>
      <h4 class="text-sm font-medium text-white mb-2">{t("stickerPreview.rerollSettings")}</h4>
      <div class="bg-gray-700 rounded-lg p-3 space-y-3">
        <div>
          <label class="block text-xs text-gray-300 mb-1">{t("stickerPreview.prompt")}:</label>
          <textarea bind:value={rerollPrompt} class="w-full px-2 py-1 bg-gray-600 text-white rounded text-xs resize-none" rows="2" placeholder={t("stickerPreview.enterPrompt")}></textarea>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="block text-xs text-gray-300 mb-1">{t("stickerPreview.steps")}:</label>
            <input bind:value={rerollSteps} type="number" min="1" max="50" class="w-full px-2 py-1 bg-gray-600 text-white rounded text-xs">
          </div>
          <div>
            <label class="block text-xs text-gray-300 mb-1">{t("stickerPreview.scale")}:</label>
            <input bind:value={rerollScale} type="number" min="1" max="20" step="0.5" class="w-full px-2 py-1 bg-gray-600 text-white rounded text-xs">
          </div>
          <div>
            <label class="block text-xs text-gray-300 mb-1">{t("stickerPreview.imageSize")}:</label>
            <select bind:value={rerollSize} class="w-full px-2 py-1 bg-gray-600 text-white rounded text-xs">
              <option value="portrait">세로형</option>
              <option value="square">정사각형</option>
              <option value="landscape">가로형</option>
            </select>
          </div>
        </div>

        <div class="flex gap-3 pt-2">
          <button on:click={startReroll} disabled={rerolling} class="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium">
            <RefreshCw class="w-4 h-4 mr-2 inline-block {rerolling ? 'animate-spin' : ''}" />
            {rerolling ? t('stickerPreview.rerolling') : t("stickerPreview.startReroll")}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
