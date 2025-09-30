<script>
  import { onMount, onDestroy } from 'svelte';
  import { t } from '../../../../i18n.js';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import { X, PlusCircle } from 'lucide-svelte';
  import { chatRooms, messages, unreadCounts, selectedChatId } from '../../../stores/chat';
  import { characters } from '../../../stores/character';
  import Avatar from '../../Avatar.svelte';

  export let isOpen = false;
  export let character = null;

  const dispatch = createEventDispatcher();

  let characterChatRooms = [];

  $: {
    if (character && $chatRooms[character.id]) {
      characterChatRooms = [...$chatRooms[character.id]].sort((a, b) => {
        const lastMessageA = $messages[a.id]?.slice(-1)[0];
        const lastMessageB = $messages[b.id]?.slice(-1)[0];
        const timeA = lastMessageA ? lastMessageA.id : a.createdAt || 0;
        const timeB = lastMessageB ? lastMessageB.id : b.createdAt || 0;
        return timeB - timeA; // Newest first
      });
    }
  }

  function selectChat(chatRoomId) {
    selectedChatId.set(chatRoomId);
    dispatch('close');
  }

  function createNewChat() {
    dispatch('createNewChat');
  }

  function closeModal() {
    dispatch('close');
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown);
  });
</script>

{#if isOpen && character}
  <div 
    transition:fade={{ duration: 200 }} 
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
  >
    <div role="dialog" aria-modal="true" tabindex="0" aria-labelledby="chat-selection-modal-title" class="bg-gray-800 rounded-2xl p-6 w-full max-w-sm mx-4" on:click|stopPropagation on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); } }}>
      <div class="flex items-center mb-4">
        <Avatar {character} size="md" />
        <h3 id="chat-selection-modal-title" class="text-lg font-semibold text-white ml-4">{character.name}</h3>
        <button on:click={closeModal} class="ml-auto p-2 rounded-full hover:bg-gray-700">
          <X class="w-5 h-5 text-gray-300" />
        </button>
      </div>
      <p class="text-sm text-gray-300 mb-4">{t("modal.selectChat.message")}</p>
      <div class="max-h-60 overflow-y-auto space-y-2 pr-2">
        {#each characterChatRooms as chatRoom}
          {@const lastMessage = $messages[chatRoom.id]?.slice(-1)[0]}
          {@const unreadCount = $unreadCounts[chatRoom.id] || 0}
          <button class="chat-room-item p-3 rounded-lg hover:bg-gray-700 transition-colors w-full text-left" on:click={() => selectChat(chatRoom.id)}>
            <div class="flex justify-between items-center">
                <div class="flex-1 min-w-0">
                    <p class="font-semibold text-white truncate">{chatRoom.name || t("sidebar.defaultChatName")}</p>
                    <p class="text-sm text-gray-400 truncate">
                      {#if lastMessage}
                        {lastMessage.type === 'image' ? t("sidebar.imageSent") : lastMessage.type === 'sticker' ? t("sidebar.stickerSent") : lastMessage.content}
                      {:else}
                        {t("sidebar.startNewChat")}
                      {/if}
                    </p>
                </div>
                {#if unreadCount > 0}
                  <span class="bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full leading-none ml-2">{unreadCount}</span>
                {/if}
            </div>
          </button>
        {/each}
      </div>
      <button on:click={createNewChat} class="w-full mt-4 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
        <PlusCircle class="w-5 h-5" />
        <span>{t("modal.selectChat.newChat")}</span>
      </button>
    </div>
  </div>
{/if}