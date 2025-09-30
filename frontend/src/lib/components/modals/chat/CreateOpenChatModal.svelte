<script>
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { t } from '../../../../i18n.js';
  import { openChats, selectedChatId } from '../../../stores/chat';
  import { characters } from '../../../stores/character';
  import { isCreateOpenChatModalVisible } from '../../../stores/ui';
  import { X, Globe, Info, Users } from 'lucide-svelte';
  import { fade } from 'svelte/transition';

  let chatName = '';

  function closeModal() {
    isCreateOpenChatModalVisible.set(false);
    chatName = '';
  }

  function createOpenChat() {
    if (!chatName.trim()) {
      alert(t('openChat.openChatNameRequiredMessage'));
      return;
    }

    const newChatId = `open_${Date.now()}`;
    const newOpenChat = {
      id: newChatId,
      name: chatName,
      type: 'open', 
      createdAt: Date.now(),
      currentParticipants: [], // Initially empty, managed by openChatService
      participantHistory: [],
    };

    openChats.update(chats => {
      chats[newChatId] = newOpenChat;
      return chats;
    });

    selectedChatId.set(newChatId);
    closeModal();
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

{#if $isCreateOpenChatModalVisible}
  <div 
    transition:fade={{ duration: 200 }} 
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
  >
    <div role="dialog" aria-modal="true" tabindex="0" aria-labelledby="create-open-chat-title" class="bg-gray-800 rounded-2xl w-full max-w-md mx-auto my-auto flex flex-col max-h-[90vh]" on:click|stopPropagation on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); } }}>
      <div class="flex items-center justify-between p-6 border-b border-gray-700 shrink-0">
        <h3 id="create-open-chat-title" class="text-xl font-semibold text-white flex items-center gap-3">
            <Globe class="w-6 h-6" />
            {t("openChat.createOpenChat")}
        </h3>
        <button on:click={closeModal} class="p-1 hover:bg-gray-700 rounded-full">
          <X class="w-5 h-5" />
        </button>
      </div>
      <div class="p-6 space-y-6 overflow-y-auto">
        <div>
          <label for="open-chat-name" class="text-sm font-medium text-gray-300 mb-2 block">{t("openChat.openChatName")}</label>
          <input id="open-chat-name" bind:value={chatName} type="text" placeholder={t("openChat.openChatNamePlaceholder")} class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 text-sm" />
        </div>
        
        <div class="bg-gray-900/50 rounded-lg p-4">
          <div class="flex items-start space-x-3 mb-3">
            <Info class="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <h4 class="text-sm font-medium text-blue-300 mb-2">{t("openChat.openChatInfo")}</h4>
              <ul class="text-xs text-gray-400 space-y-1.5 pl-1">
                <li>• {t("openChat.openChatAutoManagement")}</li>
                <li>• {t("openChat.charactersMoodBased")}</li>
                <li>• {t("openChat.naturalConversation")}</li>
                <li>• {t("openChat.initialParticipants")}</li>
              </ul>
            </div>
          </div>
          
          <div class="border-t border-gray-700 pt-3 mt-3">
            <div class="flex items-center space-x-2">
              <Users class="w-4 h-4 text-green-400" />
              <span class="text-xs text-green-300">{t("openChat.availableCharacters", { count: $characters.length })}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="p-6 mt-auto border-t border-gray-700 shrink-0 flex justify-end space-x-3">
        <button on:click={closeModal} class="flex-1 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-center">{t("common.cancel")}</button>
        <button on:click={createOpenChat} class="flex-1 py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-center">{t("common.create")}</button>
      </div>
    </div>
  </div>
{/if}