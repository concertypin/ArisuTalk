
<script>
  import { t } from '../../i18n.js';
  import { createEventDispatcher } from 'svelte';
  import { chatRooms, messages, unreadCounts } from '../stores/chat';
  import { formatTimestamp } from '../../utils.js';
  import Avatar from './Avatar.svelte';
  import { Instagram, Settings } from 'lucide-svelte';

  export let character = null;

  const dispatch = createEventDispatcher();

  let lastMessage = null;
  let totalUnreadCount = 0;

  $: {
    const rooms = $chatRooms[character.id] || [];
    lastMessage = null;
    totalUnreadCount = 0;
    rooms.forEach(room => {
      const roomMessages = $messages[room.id] || [];
      const roomLastMessage = roomMessages.slice(-1)[0];
      if (roomLastMessage && (!lastMessage || roomLastMessage.id > lastMessage.id)) {
        lastMessage = roomLastMessage;
      }
      totalUnreadCount += $unreadCounts[room.id] || 0;
    });
  }

  function handleSelect() {
    dispatch('select', character);
  }

  function openSns() {
    dispatch('sns', character);
  }

  function openSettings() {
    dispatch('settings', character);
  }

</script>

<div class="character-list-item p-3 rounded-full cursor-pointer hover:bg-gray-800/60 transition-colors duration-200" on:click={handleSelect}>
    <div class="flex items-center space-x-5">
        <div class="character-avatar relative">
            <Avatar {character} size="lg" />
        </div>
        <div class="flex-1 min-w-0">
            <div class="flex items-center mb-1">
                <h3 class="font-semibold text-white text-lg truncate">{character.name || t("sidebar.unknownCharacter")}</h3>
                <div class="flex items-center gap-1 shrink-0 ml-auto">
                    <button on:click|stopPropagation={openSns} class="p-1.5 hover:bg-gray-700 rounded-full transition-colors z-20" title={t("characterModal.openSNS")}>
                        <Instagram class="w-4 h-4 text-gray-300" />
                    </button>
                    <button on:click|stopPropagation={openSettings} class="p-1.5 hover:bg-gray-700 rounded-full transition-colors z-20" title={t("sidebar.editCharacter")}>
                        <Settings class="w-4 h-4 text-gray-300" />
                    </button>
                    {#if totalUnreadCount > 0}
                        <span class="bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full leading-none">{totalUnreadCount}</span>
                    {/if}
                </div>
            </div>
            <div class="flex justify-between items-start">
                <p class="text-base line-clamp-2 {lastMessage?.isError ? 'text-red-400' : 'text-gray-400'} pr-4">
                    {#if lastMessage}
                        {lastMessage.type === 'image' ? t("sidebar.imageSent") : lastMessage.type === 'sticker' ? t("sidebar.stickerSent") : lastMessage.content}
                    {:else}
                        {t("sidebar.startNewChat")}
                    {/if}
                </p>
                <span class="text-sm text-gray-500 shrink-0">{formatTimestamp(lastMessage?.id)}</span>
            </div>
        </div>
    </div>
</div>
