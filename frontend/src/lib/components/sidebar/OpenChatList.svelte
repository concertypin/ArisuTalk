<script>
  import { t } from '../../../i18n.js';
  import { openChats, selectedChatId, messages, unreadCounts } from '../../stores/chat';
  import { isCreateOpenChatModalVisible, isConfirmationModalVisible, confirmationModalData } from '../../stores/ui';
  import { Globe, Plus, Trash2 } from 'lucide-svelte';
  import { formatTimestamp } from '../../../utils';

  function openCreateOpenChatModal() {
    isCreateOpenChatModalVisible.set(true);
  }

  function selectChat(chatId) {
    selectedChatId.set(chatId);
  }

  function deleteOpenChat(chat) {
    confirmationModalData.set({
        title: t('openChat.deleteOpenChatTitle'),
        message: t('openChat.deleteOpenChatConfirm', { name: chat.name }),
        onConfirm: () => {
            openChats.update(chats => {
                delete chats[chat.id];
                return chats;
            });
            // TODO: also delete messages
        }
    });
    isConfirmationModalVisible.set(true);
  }
</script>

<div class="border-t border-gray-800 pt-6">
    <div class="group flex items-center justify-between px-1 mb-2 relative">
        <div class="flex items-center gap-2">
            <Globe class="w-4 h-4 text-gray-400" />
            <h3 class="text-sm font-medium text-gray-300">{t("openChat.openChat")}</h3>
        </div>
        <button on:click={openCreateOpenChatModal} class="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-gray-700 hover:bg-green-600 rounded text-gray-300 hover:text-white transition-colors" title={t("openChat.newOpenChat")}>
            <Plus class="w-3 h-3" />
        </button>
    </div>
    {#each Object.values($openChats) as chat (chat.id)}
        {@const isSelected = $selectedChatId === chat.id}
        {@const lastMessage = $messages[chat.id]?.[$messages[chat.id]?.length - 1]}
        {@const unreadCount = $unreadCounts[chat.id] || 0}
        <div 
            on:click={() => selectChat(chat.id)} 
            on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectChat(chat.id); }}
            role="button"
            tabindex="0"
            class="relative group rounded-xl transition-all duration-200 p-3 md:p-4 cursor-pointer {isSelected ? 'bg-blue-600/20' : 'hover:bg-gray-800/50'}"
            aria-label="Select open chat {chat.name}"
        >
             <div class="absolute top-2 right-2 {isSelected ? 'opacity-60 hover:opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-200 flex space-x-1 z-20">
                <button on:click|stopPropagation={() => deleteOpenChat(chat)} class="p-2 bg-gray-700 hover:bg-red-600 rounded text-gray-300 hover:text-white transition-colors" title={t("common.delete")}>
                    <Trash2 class="w-3 h-3" />
                </button>
            </div>
            <div class="flex items-center space-x-4 md:space-x-5">
                <div class="relative">
                    <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                        <Globe class="w-6 h-6 text-white" />
                    </div>
                     {#if unreadCount > 0}
                        <div class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</div>
                    {/if}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1">
                        <h4 class="font-medium text-white truncate">{chat.name}</h4>
                        {#if lastMessage}
                            <span class="text-xs text-gray-500 ml-2">{formatTimestamp(lastMessage.timestamp)}</span>
                        {/if}
                    </div>
                    <p class="text-sm text-gray-400 truncate">{t("openChat.participantsConnected", { count: (chat.currentParticipants || []).length })}</p>
                    <p class="text-xs text-gray-500 truncate mt-1">{lastMessage?.content || t("openChat.startConversation")}</p>
                </div>
            </div>
        </div>
    {/each}
</div>