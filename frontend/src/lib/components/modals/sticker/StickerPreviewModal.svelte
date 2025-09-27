
<script>
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import { X } from 'lucide-svelte';
  import { t } from '../../../../i18n.js';
  import PreviewTab from '../sticker/tabs/PreviewTab.svelte';
  import ExifTab from '../sticker/tabs/ExifTab.svelte';
  import RerollTab from '../sticker/tabs/RerollTab.svelte';
  import ActionsTab from '../sticker/tabs/ActionsTab.svelte';

  export let isOpen = false;
  export let sticker = null;
  export let index = null;

  let activeTab = 'preview';
  let exifData = null;
  let rerollData = null;

  const dispatch = createEventDispatcher();

  function closeModal() {
    dispatch('close');
  }

  // TODO: Fetch EXIF and reroll data when the modal is opened

</script>

{#if isOpen && sticker}
  <div transition:fade={{ duration: 200 }} class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]" on:click={closeModal}>
    <div class="bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" on:click|stopPropagation>
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-white">{t("stickerPreview.title")}</h3>
        <button on:click={closeModal} class="p-2 text-gray-400 hover:text-white transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="flex border-b border-gray-600 mb-4">
        <button on:click={() => activeTab = 'preview'} class="px-4 py-2 text-sm font-medium transition-colors {activeTab === 'preview' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}">
          {t("stickerPreview.tabs.preview")}
        </button>
        {#if sticker.type && sticker.type.startsWith('image/')}
          <button on:click={() => activeTab = 'exif'} class="px-4 py-2 text-sm font-medium transition-colors {activeTab === 'exif' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}">
            {t("stickerPreview.tabs.exif")}
          </button>
          <button on:click={() => activeTab = 'reroll'} class="px-4 py-2 text-sm font-medium transition-colors {activeTab === 'reroll' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}">
            {t("stickerPreview.tabs.reroll")}
          </button>
        {/if}
        <button on:click={() => activeTab = 'actions'} class="px-4 py-2 text-sm font-medium transition-colors {activeTab === 'actions' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}">
          {t("stickerPreview.tabs.actions")}
        </button>
      </div>

      <div>
        {#if activeTab === 'preview'}
          <PreviewTab {sticker} on:save={(e) => dispatch('save', e.detail)} />
        {:else if activeTab === 'exif'}
          <ExifTab {exifData} />
        {:else if activeTab === 'reroll'}
          <RerollTab {rerollData} {sticker} {index} on:reroll={(e) => dispatch('reroll', e.detail)} />
        {:else if activeTab === 'actions'}
          <ActionsTab {sticker} {index} on:delete={() => dispatch('delete')} on:copy={() => dispatch('copy')} on:download={() => dispatch('download')} />
        {/if}
      </div>
    </div>
  </div>
{/if}
