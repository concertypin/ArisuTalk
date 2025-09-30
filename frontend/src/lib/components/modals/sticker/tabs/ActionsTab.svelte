<script>
  import { createEventDispatcher } from 'svelte';
  import { t } from '../../../../../i18n.js';
  import { Trash2, Copy, Download } from 'lucide-svelte';

  const dispatch = createEventDispatcher();

</script>

<div class="space-y-4">
  <div>
    <h4 class="text-sm font-medium text-red-400 mb-3">{t("stickerPreview.dangerZone")}</h4>
    <div class="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <Trash2 class="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
        <div class="flex-1">
          <h5 class="text-sm font-medium text-red-400 mb-1">{t("stickerPreview.deleteSticker")}</h5>
          <p class="text-xs text-gray-300 mb-3">{t("stickerPreview.deleteWarning")}</p>
          <button on:click={() => dispatch('delete')} class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors">
            {t("stickerPreview.deleteConfirm")}
          </button>
        </div>
      </div>
    </div>
  </div>

  <div>
    <h4 class="text-sm font-medium text-white mb-3">{t("stickerPreview.otherActions")}</h4>
    <div class="space-y-2">
      <button on:click={() => dispatch('copy')} class="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2">
        <Copy class="w-4 h-4" />
        {t("stickerPreview.copyToClipboard")}
      </button>
      
      <button on:click={() => dispatch('download')} class="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2">
        <Download class="w-4 h-4" />
        {t("stickerPreview.downloadSticker")}
      </button>
    </div>
  </div>
</div>