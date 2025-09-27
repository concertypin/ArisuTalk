<script>
  import { t } from '../../i18n.js';
  import { userStickers } from '../stores/character';
  import { stickerToSend } from '../stores/chat';
  import { isUserStickerPanelVisible } from '../stores/ui';
  import { Plus, X, Smile, Music, Edit3, Trash2 } from 'lucide-svelte';

  let stickerInput;

  function selectSticker(sticker) {
    stickerToSend.set(sticker);
    isUserStickerPanelVisible.set(false);
  }

  function addStickers() {
      stickerInput.click();
  }

  async function handleFileChange(event) {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    for (const file of files) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/gif', 'image/png', 'image/bmp', 'image/webp', 'video/webm', 'video/mp4', 'audio/mpeg', 'audio/mp3'];
      if (!allowedTypes.includes(file.type)) {
        alert(`${file.name}${t("modal.unsupportedFileType.message")}`);
        continue;
      }

      if (file.size > 30 * 1024 * 1024) {
        alert(`${file.name}${t("modal.fileTooLarge.message")}`);
        continue;
      }

      try {
        let dataUrl;
        if (file.type.startsWith("image/")) {
          dataUrl = await compressImage(file, 1024, 1024, 0.85);
        } else {
          dataUrl = await toBase64(file);
        }
        const stickerName = file.name.split(".")[0];
        const newSticker = {
            id: Date.now() + Math.random(),
            name: stickerName,
            data: dataUrl,
            type: file.type,
            createdAt: Date.now(),
        };
        userStickers.update(stickers => [...stickers, newSticker]);
      } catch (error) {
        console.error(t("ui.fileProcessingError"), error);
        alert(t("ui.fileProcessingAlert"));
      }
    }
    event.target.value = '';
  }

  function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
  }

  function compressImage(file, maxWidth, maxHeight, quality) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL(file.type, quality));
        };
        img.onerror = (error) => reject(error);
    });
  }

  function editName(sticker, event) {
      event.stopPropagation();
      const newName = prompt(t('modal.editStickerName.title'), sticker.name);
      if (newName && newName.trim() !== '') {
          userStickers.update(stickers => {
              const index = stickers.findIndex(s => s.id === sticker.id);
              if (index !== -1) {
                  stickers[index].name = newName.trim();
              }
              return stickers;
          });
      }
  }

  function deleteSticker(sticker, event) {
      event.stopPropagation();
      if (confirm(t('stickerPreview.confirmRemove'))) {
          userStickers.update(stickers => stickers.filter(s => s.id !== sticker.id));
      }
  }

  function calculateSize() {
      if (!$userStickers || $userStickers.length === 0) return '0 Bytes';
      const totalBytes = $userStickers.reduce((acc, sticker) => {
          if (sticker.data) {
              const base64Length = sticker.data.split(',')[1]?.length || 0;
              return acc + (base64Length * 0.75);
          }
          return acc;
      }, 0);

      if (totalBytes < 1024) return `${totalBytes.toFixed(0)} Bytes`;
      if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(2)} KB`;
      return `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;
  }

</script>

<div class="absolute bottom-full right-0 z-20 mb-2 w-80 rounded-xl shadow-lg border border-gray-700 animate-fadeIn floating-panel bg-gray-800 flex flex-col">
    <div class="p-3 border-b border-gray-700 flex items-center justify-between shrink-0">
        <h3 class="text-sm font-medium text-white">{t('mainChat.personaStickers')}</h3>
        <div class="flex gap-2">
            <button on:click={addStickers} class="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded" title="Add Sticker">
                <Plus class="w-3 h-3" />
            </button>
            <button on:click={() => isUserStickerPanelVisible.set(false)} class="p-1 bg-gray-600 hover:bg-gray-500 text-white rounded" title="Close">
                <X class="w-3 h-3 pointer-events-none" />
            </button>
        </div>
    </div>
    <div class="p-3 flex-1 overflow-y-auto">
        <div class="flex items-center justify-between text-xs text-gray-400 mb-3">
            <span>{t('mainChat.stickerSupport')}</span>
            <span>{t('mainChat.stickerCount', { count: $userStickers.length })}</span>
        </div>
        <div class="flex items-center justify-between text-xs text-gray-500 mb-3">
            <span>{t('characterModal.totalSize')} {calculateSize()}</span>
        </div>
        
        {#if $userStickers.length === 0}
            <div class="text-center text-gray-400 py-8">
                <Smile class="w-8 h-8 mx-auto mb-2" />
                <p class="text-sm">{t('mainChat.addStickerPrompt')}</p>
                <button on:click={addStickers} class="mt-2 text-xs text-blue-400 hover:text-blue-300">{t('mainChat.addStickerButton')}</button>
            </div>
        {:else}
            <div class="grid grid-cols-4 gap-2">
                {#each $userStickers as sticker (sticker.id)}
                    <div on:click={() => selectSticker(sticker)} class="relative group aspect-square flex items-center justify-center p-1 rounded-lg hover:bg-gray-600 cursor-pointer bg-gray-700/50">
                        {#if sticker.type?.startsWith('video')}
                            <video class="w-full h-full object-contain" muted loop autoplay src={sticker.data}></video>
                        {:else if sticker.type?.startsWith('audio')}
                            <div class="w-full h-full flex items-center justify-center">
                                <Music class="w-8 h-8 text-gray-400" />
                            </div>
                        {:else}
                            <img src={sticker.data} alt={sticker.name} class="w-full h-full object-contain">
                        {/if}
                        <div class="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate rounded-b-lg">
                            {sticker.name}
                        </div>
                        <div class="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 z-10">
                            <button on:click|stopPropagation={(e) => editName(sticker, e)} class="p-1 bg-blue-600 hover:bg-blue-700 rounded-full text-white">
                                <Edit3 class="w-3 h-3" />
                            </button>
                            <button on:click|stopPropagation={(e) => deleteSticker(sticker, e)} class="p-1 bg-red-600 hover:bg-red-700 rounded-full text-white">
                                <Trash2 class="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
    <input type="file" accept="image/*,video/*,audio/*" bind:this={stickerInput} on:change={handleFileChange} class="hidden" multiple />
</div>