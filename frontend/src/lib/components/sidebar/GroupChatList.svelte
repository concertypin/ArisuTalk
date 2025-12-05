<script>
    import { t } from "$root/i18n";
    import {
        groupChats,
        selectedChatId,
        messages,
        unreadCounts,
        editingGroupChat,
    } from "../../stores/chat";
    import {
        isCreateGroupChatModalVisible,
        isEditGroupChatModalVisible,
        isConfirmationModalVisible,
        confirmationModalData,
    } from "../../stores/ui";
    import { Users, Plus, Edit3, Trash2 } from "@lucide/svelte";
    import { formatTimestamp } from "../../../utils";

    function openCreateGroupChatModal() {
        isCreateGroupChatModalVisible.set(true);
    }

    function selectChat(chatId) {
        selectedChatId.set(chatId);
    }

    function editGroupChat(chat) {
        editingGroupChat.set(chat);
        isEditGroupChatModalVisible.set(true);
    }

    function deleteGroupChat(chat) {
        confirmationModalData.set({
            title: t("groupChat.deleteGroupChat"),
            message: t("groupChat.deleteGroupChatConfirm", { name: chat.name }),
            onConfirm: () => {
                groupChats.update((chats) => {
                    delete chats[chat.id];
                    return chats;
                });
                // TODO: also delete messages
            },
        });
        isConfirmationModalVisible.set(true);
    }
</script>

<div class="border-t border-gray-800 pt-6">
    <div class="group flex items-center justify-between px-1 mb-2 relative">
        <div class="flex items-center gap-2">
            <Users class="w-4 h-4 text-gray-400" />
            <h3 class="text-sm font-medium text-gray-300">
                {t("groupChat.groupChat")}
            </h3>
        </div>
        <button
            on:click={openCreateGroupChatModal}
            class="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-gray-700 hover:bg-blue-600 rounded text-gray-300 hover:text-white transition-colors"
            title={t("groupChat.newGroupChat")}
        >
            <Plus class="w-3 h-3" />
        </button>
    </div>
    {#each Object.values($groupChats) as chat (chat.id)}
        {@const isSelected = $selectedChatId === chat.id}
        {@const lastMessage =
            $messages[chat.id]?.[$messages[chat.id]?.length - 1]}
        {@const unreadCount = $unreadCounts[chat.id] || 0}
        <div
            on:click={() => selectChat(chat.id)}
            on:keydown={(e) => {
                if (e.key === "Enter" || e.key === " ") selectChat(chat.id);
            }}
            role="button"
            tabindex="0"
            class="relative group rounded-xl transition-all duration-200 p-3 md:p-4 cursor-pointer {isSelected
                ? 'bg-blue-600/20'
                : 'hover:bg-gray-800/50'}"
            aria-label="Select group chat {chat.name}"
        >
            <div
                class="absolute top-2 right-2 {isSelected
                    ? 'opacity-60 hover:opacity-100'
                    : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-200 flex space-x-1 z-20"
            >
                <button
                    on:click|stopPropagation={() => editGroupChat(chat)}
                    class="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 hover:text-white transition-colors"
                    title={t("groupChat.edit")}
                >
                    <Edit3 class="w-3 h-3" />
                </button>
                <button
                    on:click|stopPropagation={() => deleteGroupChat(chat)}
                    class="p-2 bg-gray-700 hover:bg-red-600 rounded text-gray-300 hover:text-white transition-colors"
                    title={t("groupChat.delete")}
                >
                    <Trash2 class="w-3 h-3" />
                </button>
            </div>
            <div class="flex items-center space-x-4 md:space-x-5">
                <div class="relative">
                    <div
                        class="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center"
                    >
                        <Users class="w-6 h-6 text-white" />
                    </div>
                    {#if unreadCount > 0}
                        <div
                            class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        >
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </div>
                    {/if}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1">
                        <h4 class="font-medium text-white truncate">
                            {chat.name}
                        </h4>
                        {#if lastMessage}
                            <span class="text-xs text-gray-500 ml-2"
                                >{formatTimestamp(lastMessage.timestamp)}</span
                            >
                        {/if}
                    </div>
                    <p class="text-sm text-gray-400 truncate">
                        {chat.participantIds.length}{t(
                            "groupChat.participantsCount",
                        )}
                    </p>
                    <p class="text-xs text-gray-500 truncate mt-1">
                        {lastMessage?.content ||
                            t("groupChat.startConversation")}
                    </p>
                </div>
            </div>
        </div>
    {/each}
</div>
