<script>
  import { onMount, onDestroy } from 'svelte';
  import { X } from 'lucide-svelte';
  import { isImageZoomModalVisible, imageZoomModalData } from '../stores/ui.ts';
  import { t } from '../../i18n.js';

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown);
  });

  function handleClose() {
    isImageZoomModalVisible.set(false);
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }
</script>

{#if $isImageZoomModalVisible}
  <div 
    class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999] p-4"
    on:click={handleClose}
  >
    <div class="relative max-w-[90vw] max-h-[90vh] flex flex-col">
      <div class="absolute top-4 right-4 z-10">
        <button on:click|stopPropagation={handleClose} class="p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full text-white transition-all">
          <X class="w-6 h-6 pointer-events-none" />
        </button>
      </div>
      
      <div class="flex-1 flex items-center justify-center">
        <img 
          src={$imageZoomModalData.imageUrl} 
          alt={$imageZoomModalData.title || t('common.image')}
          class="max-w-full max-h-full object-contain cursor-pointer transition-transform duration-200 ease-out"
          style="max-width: min(90vw, 1200px); max-height: min(90vh, 800px);"
          on:click|stopPropagation
        />
      </div>
      
      {#if $imageZoomModalData.title}
        <div class="mt-4 text-center">
          <p class="text-white text-sm opacity-80">{$imageZoomModalData.title}</p>
        </div>
      {/if}
    </div>
  </div>
{/if}
