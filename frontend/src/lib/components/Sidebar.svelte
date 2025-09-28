<script>
  import { onMount, afterUpdate } from 'svelte';
  import { t } from '../../i18n.js';
  import { characters, expandedCharacterIds, editingCharacter } from '../stores/character';
  import { chatRooms, selectedChatId, searchQuery, messages, groupChats, openChats, unreadCounts, editingGroupChat, editingChatRoomId } from '../stores/chat';
  import { isSidebarCollapsed, isCharacterModalVisible, isConfirmationModalVisible, confirmationModalData, isCreateGroupChatModalVisible, isCreateOpenChatModalVisible, isEditGroupChatModalVisible, isDesktopSettingsModalVisible, isChatSelectionModalVisible, chatSelectionModalData, isSearchModalVisible } from '../stores/ui';
  import { formatTimestamp } from '../../utils';
  import Avatar from './Avatar.svelte';
  import { Bot, Settings, Plus, ChevronRight, ChevronLeft, ChevronDown, Edit3, Trash2, Check, Users, Globe, X } from 'lucide-svelte';
  import GroupChatList from './sidebar/GroupChatList.svelte';
  import OpenChatList from './sidebar/OpenChatList.svelte';

  let characterGroupEls = {};
  let avatarEls = {};
  let headerEls = {};
  let roomListEls = {};
  let editingName = '';

  $: filteredCharacters = $characters.filter(char =>
    char.name.toLowerCase().includes($searchQuery.toLowerCase())
  );

  $: characterLastAiMessages = Object.fromEntries(
    $characters.map(char => {
      const rooms = $chatRooms[char.id] || [];
      if (!rooms.length) return [char.id, null];

      const lastAiMessage = rooms
        .flatMap(room => ($messages[room.id] || []))
        .filter(msg => msg && typeof msg.timestamp === 'number')
        .sort((a, b) => b.timestamp - a.timestamp)[0];
      
      return [char.id, lastAiMessage];
    })
  );

  afterUpdate(() => {
    $expandedCharacterIds.forEach(id => {
      updateTreeLine(id);
    });
  });

  function updateTreeLine(characterId) {
    const characterGroup = characterGroupEls[characterId];
    const avatar = avatarEls[characterId];
    const header = headerEls[characterId];
    const roomList = roomListEls[characterId];

    if (!characterGroup || !avatar || !header) return;

    const groupRect = characterGroup.getBoundingClientRect();
    const avatarRect = avatar.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();

    const alignmentCorrection = -2;
    const trunkLeft =
      avatarRect.left -
      groupRect.left +
      avatarRect.width / 2 +
      alignmentCorrection;
      
    const connectorTop = headerRect.bottom - groupRect.top;
    let connectorHeight = 0;
    if(roomList && roomList.lastElementChild) {
        const lastRoomItemRect = roomList.lastElementChild.getBoundingClientRect();
        connectorHeight = lastRoomItemRect.top - headerRect.bottom + (lastRoomItemRect.height / 2) - 6;
    }

    characterGroup.style.setProperty("--tree-trunk-left", `${trunkLeft}px`);
    characterGroup.style.setProperty("--tree-connector-top", `${connectorTop}px`);
    characterGroup.style.setProperty("--tree-connector-height", `${connectorHeight}px`);
  }

  function toggleSidebar() {
    isSidebarCollapsed.update(v => !v);
  }

  function openSettings() {
    isDesktopSettingsModalVisible.set(true);
  }

  function openNewCharacterModal() {
    isCharacterModalVisible.set(true);
  }

  function handleCharacterSelect(character) {
    const rooms = $chatRooms[character.id] || [];
    if (rooms.length === 1) {
      selectChat(rooms[0].id);
    } else if (rooms.length > 1) {
      chatSelectionModalData.set({ character });
      isChatSelectionModalVisible.set(true);
    }
  }

  function toggleCharacterExpansion(characterId) {
    expandedCharacterIds.update(ids => {
      const newIds = new Set(ids);
      if (newIds.has(characterId)) {
        newIds.delete(characterId);
      } else {
        newIds.add(characterId);
      }
      return newIds;
    });
  }

  function selectChat(chatId) {
    if ($editingChatRoomId) return;
    selectedChatId.set(chatId);
  }

  function createNewChatRoomForCharacter(characterId) {
    const newChatRoomId = `${characterId}_${Date.now()}`;
    const newChatRoom = {
      id: newChatRoomId,
      characterId: characterId,
      name: t("ui.newChatName"),
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };

    chatRooms.update(rooms => {
      const characterChatRooms = [...(rooms[characterId] || []), newChatRoom];
      return { ...rooms, [characterId]: characterChatRooms };
    });

    messages.update(msgs => ({ ...msgs, [newChatRoomId]: [] }));

    selectChat(newChatRoomId);
  }

  function editCharacter(character) {
    editingCharacter.set(character);
    isCharacterModalVisible.set(true);
  }

  function deleteCharacter(charToDelete) {
    confirmationModalData.set({
      title: t('sidebar.deleteCharacterTitle'),
      message: t('sidebar.deleteCharacterConfirm', { name: charToDelete.name }),
      onConfirm: () => {
        characters.update(chars => chars.filter(c => c.id !== charToDelete.id));
        chatRooms.update(rooms => {
          delete rooms[charToDelete.id];
          return rooms;
        });
        // TODO: Also delete messages for all rooms of this character
      }
    });
    isConfirmationModalVisible.set(true);
  }

  function editChatRoom(room) {
    editingChatRoomId.set(room.id);
    editingName = room.name;
  }

  function deleteChatRoom(room, characterId) {
    confirmationModalData.set({
        title: t('sidebar.deleteChatRoom'),
        message: t('modal.deleteChatRoom.message'),
        onConfirm: () => {
            chatRooms.update(rooms => {
                const characterRooms = rooms[characterId] || [];
                rooms[characterId] = characterRooms.filter(r => r.id !== room.id);
                return rooms;
            });
            messages.update(msgs => {
                delete msgs[room.id];
                return msgs;
            });
        }
    });
    isConfirmationModalVisible.set(true);
  }

  function saveName(room, characterId) {
    if (!editingName.trim()) return;

    if (characterId) { // It's a character room
        chatRooms.update(rooms => {
            const characterRooms = rooms[characterId] || [];
            const roomToUpdate = characterRooms.find(r => r.id === room.id);
            if (roomToUpdate) {
                roomToUpdate.name = editingName;
            }
            return rooms;
        });
    } else { // It's a group chat
        groupChats.update(chats => {
            const chatToUpdate = chats[room.id];
            if (chatToUpdate) {
                chatToUpdate.name = editingName;
            }
            return chats;
        });
    }

    editingChatRoomId.set(null);
    editingName = '';
  }

  function cancelEdit() {
      editingChatRoomId.set(null);
      editingName = '';
  }

</script>

<aside id="sidebar" class="fixed inset-y-0 left-0 z-30 flex w-full flex-col bg-gray-900 transition-transform duration-300 ease-in-out md:relative md:w-100 md:border-r md:border-gray-800 {
  $isSidebarCollapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0'
}">
  <button on:click={toggleSidebar} class="absolute top-1/2 -translate-y-1/2 -right-4 h-8 w-8 items-center justify-center rounded-full border border-gray-600 bg-gray-700 transition-colors hover:bg-gray-600 md:flex z-20">
    {#if $isSidebarCollapsed}
      <ChevronRight class="w-5 h-5 text-gray-300" />
    {:else}
      <ChevronLeft class="w-5 h-5 text-gray-300" />
    {/if}
  </button>

  <div id="sidebar-content" class="flex h-full flex-col overflow-hidden">
    <header class="p-4 md:p-6 border-b border-gray-800">
      <div class="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 class="text-xl md:text-2xl font-bold text-white mb-1">{t("sidebar.title")}</h1>
          <p class="text-xs md:text-sm text-gray-400">{t("sidebar.description")}</p>
        </div>
        <button on:click={openSettings} class="p-2 md:p-2.5 rounded-full bg-gray-800 hover:bg-gray-700 transition-all duration-200">
          <Settings class="w-5 h-5 text-gray-300" />
        </button>
      </div>
      <div class="relative">
        <Bot class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
        <input bind:value={$searchQuery} type="text" placeholder={t("sidebar.searchPlaceholder")} class="w-full pl-11 pr-4 py-2 md:py-3 bg-gray-800 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/30 focus:bg-gray-750 transition-all duration-200 text-sm placeholder-gray-500" />
      </div>
    </header>

    <div class="flex-1 overflow-y-auto">
      <div class="p-4">
        <button on:click={openNewCharacterModal} class="w-full flex items-center justify-center py-3 md:py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg text-sm">
          <Plus class="w-4 h-4 mr-2" />
          {t("sidebar.invite")}
        </button>
      </div>
      <div class="space-y-1 px-3 pb-4">
        <GroupChatList />
        <OpenChatList />
        
        <!-- Character Chats -->
        <div class="border-t border-gray-800 pt-6">
            <div class="group flex items-center justify-between px-1 mb-2 relative">
                <div class="flex items-center gap-2">
                    <Bot class="w-4 h-4 text-gray-400" />
                    <h3 class="text-sm font-medium text-gray-300">{t("sidebar.characters")}</h3>
                </div>
            </div>
        {#each filteredCharacters as char (char.id)}
          {@const rooms = $chatRooms[char.id] || []}
          {@const isExpanded = $expandedCharacterIds.has(char.id)}
          {@const lastAiMessage = characterLastAiMessages[char.id]}
          <div class="character-group" class:is-expanded={isExpanded} bind:this={characterGroupEls[char.id]}>
            <div on:click={() => toggleCharacterExpansion(char.id)} 
                 on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleCharacterExpansion(char.id); }}
                 role="button" 
                 tabindex="0" 
                 class="character-header group p-3 md:p-4 rounded-xl cursor-pointer transition-all duration-200 relative hover:bg-gray-800/50" 
                 bind:this={headerEls[char.id]}>
              <div class="flex items-center space-x-4 md:space-x-5">
                <div class="character-avatar relative" bind:this={avatarEls[char.id]}>
                  <Avatar character={char}/>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <h3 class="font-semibold text-white text-sm truncate">{char.name || t("sidebar.unknownCharacter")}</h3>
                    <div class="flex items-center gap-2">
                      <!-- Unread count and timestamp logic here -->
                      <span class="text-sm text-gray-500 shrink-0"></span>
                      <svelte:component this={isExpanded ? ChevronDown : ChevronRight} class="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <p class="text-xs md:text-sm truncate text-gray-400">{lastAiMessage?.content?.substring(0, 35) || t("sidebar.startNewChat")}</p>
                  <p class="text-xs text-gray-500 mt-1">{rooms.length}{t("sidebar.chatRoomCount")}</p>
                </div>
              </div>
              <div class="absolute bottom-3 right-3 flex space-x-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button on:click|stopPropagation={() => createNewChatRoomForCharacter(char.id)} class="p-1.5 bg-gray-700/50 hover:bg-green-600 rounded-lg text-gray-300 hover:text-white transition-colors" title={t("sidebar.newChatRoom")}>
                      <Plus class="w-3.5 h-3.5" />
                  </button>
                  <button on:click|stopPropagation={() => editCharacter(char)} class="p-1.5 bg-gray-700/50 hover:bg-orange-500 rounded-lg text-gray-300 hover:text-white transition-colors" title={t("common.edit")}>
                      <Edit3 class="w-3.5 h-3.5" />
                  </button>
                  <button on:click|stopPropagation={() => deleteCharacter(char)} class="p-1.5 bg-gray-700/50 hover:bg-red-600 rounded-lg text-gray-300 hover:text-white transition-colors" title={t("common.delete")}>
                      <Trash2 class="w-3.5 h-3.5" />
                  </button>
              </div>
            </div>
            {#if isExpanded}
              <div class="ml-2 space-y-1 pb-2 chat-room-list" bind:this={roomListEls[char.id]}>
                {#each rooms as room (room.id)}
                  {@const lastMessage = $messages[room.id]?.[$messages[room.id]?.length - 1]}
                  {@const unreadCount = $unreadCounts[room.id] || 0}
                  <div class="chat-room-list-item-wrapper relative group">
                    <div class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1 z-10">
                        <button on:click|stopPropagation={() => editChatRoom(room)} class="p-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 hover:text-white transition-colors" title={t("sidebar.rename")}>
                            <Edit3 class="w-3 h-3" />
                        </button>
                        <button on:click|stopPropagation={() => deleteChatRoom(room, char.id)} class="p-1 bg-gray-700 hover:bg-red-600 rounded text-gray-300 hover:text-white transition-colors" title={t("sidebar.deleteChatRoom")}>
                            <Trash2 class="w-3 h-3" />
                        </button>
                    </div>
                    <div on:click|stopPropagation={() => selectChat(room.id)} 
                         on:keydown|stopPropagation={(e) => { if (e.key === 'Enter' || e.key === ' ') selectChat(room.id); }}
                         role="button" 
                         tabindex="0" 
                         class="chat-room-item p-3 rounded-lg cursor-pointer transition-all duration-200 w-full {$selectedChatId === room.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}">
                        {#if $editingChatRoomId === room.id}
                            <div class="flex items-center gap-2">
                                <input bind:value={editingName} on:keydown={e => e.key === 'Enter' && saveName(room, char.id)} type="text" class="w-full px-2 py-1 bg-gray-600 text-white rounded border-gray-500 focus:ring-1 focus:ring-blue-500 text-sm">
                                <button on:click|stopPropagation={() => saveName(room, char.id)} class="p-1 bg-blue-600 hover:bg-blue-700 rounded"><Check class="w-3 h-3" /></button>
                                <button on:click|stopPropagation={cancelEdit} class="p-1 bg-gray-500 hover:bg-gray-600 rounded"><X class="w-3 h-3" /></button>
                            </div>
                        {:else}
                            <div class="flex items-center justify-between">
                                <h4 class="text-sm font-medium truncate">{room.name}</h4>
                                {#if unreadCount > 0}
                                    <span class="text-xs font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5">{unreadCount}</span>
                                {/if}
                            </div>
                            <div class="flex items-center justify-between text-xs mt-1 { $selectedChatId === room.id ? 'text-gray-200' : 'text-gray-400' }">
                                <p class="truncate flex-1 pr-2">{lastMessage?.content || t("sidebar.startChatting")}</p>
                                {#if lastMessage}
                                    <span class="shrink-0">{formatTimestamp(lastMessage.timestamp)}</span>
                                {/if}
                            </div>
                        {/if}
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
        </div>
      </div>
    </div>
  </div>
</aside>

{#if !$isSidebarCollapsed}
  <div on:click={toggleSidebar} 
       on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSidebar(); }}
       role="button" 
       tabindex="0" 
       aria-label="Close sidebar" 
       class="fixed inset-0 z-20 bg-black/50 md:hidden">
  </div>
{/if}