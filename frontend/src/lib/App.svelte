

<script>
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { selectedChatId, createNewChatRoom, chatRooms } from './stores/chat';
  import { characters, editingCharacter } from './stores/character';
  import { isSidebarCollapsed, isChatSelectionModalVisible, chatSelectionModalData, isSearchModalVisible, isMobile, isSNSCharacterListModalVisible, isSNSFeedModalVisible, snsFeedCharacter, isSNSPostModalVisible, editingSNSPost, isMobileSettingsPageVisible, isCharacterModalVisible } from './stores/ui';
  import { fade } from 'svelte/transition';
  import { stickerManager } from './stores/services';
  import { StickerManager } from './services/stickerManager.js';

  // Import migrated components
  import Sidebar from './components/Sidebar.svelte';
  import LandingPage from './components/LandingPage.svelte';
  import ConfirmationModal from './components/ConfirmationModal.svelte';
  import ImageZoomModal from './components/ImageZoomModal.svelte';
  import MainChat from './components/MainChat.svelte';
  import CreateGroupChatModal from './components/modals/chat/CreateGroupChatModal.svelte';
  import CreateOpenChatModal from './components/modals/chat/CreateOpenChatModal.svelte';
  import EditGroupChatModal from './components/modals/chat/EditGroupChatModal.svelte';
  import CharacterModal from './components/modals/character/CharacterModal.svelte';
  import DesktopSettingsUI from './components/modals/settings/DesktopSettingsUI.svelte';
  import MasterPasswordModal from './components/modals/security/MasterPasswordModal.svelte';
  import ChatSelectionModal from './components/modals/chat/ChatSelectionModal.svelte';
  import SearchModal from './components/modals/search/SearchModal.svelte';
  import CharacterListPage from './components/mobile/CharacterListPage.svelte';
  import MobileSettings from './components/modals/settings/MobileSettings.svelte';
  import SNSCharacterListModal from './components/modals/sns/SNSCharacterListModal.svelte';
  import SNSFeedModal from './components/modals/sns/SNSFeedModal.svelte';
  import SNSPostModal from './components/modals/sns/SNSPostModal.svelte';
  import PromptModal from './components/modals/prompt/PromptModal.svelte';
  import DebugLogsModal from './components/modals/logs/DebugLogsModal.svelte';
  import DevModeIndicator from './components/DevModeIndicator.svelte';
  import { settings } from './stores/settings';
  import { enableAutoSnapshots } from './services/dataService';
  import { addLog } from './services/logService';

  onMount(() => {
    addLog({
      type: 'simple',
      level: 'Info',
      message: 'ArisuTalk application initialized.'
    });

    const manager = new StickerManager();
    manager.initializeNAI();
    stickerManager.set(manager);

    // Enable automatic settings snapshots
    enableAutoSnapshots();

    const appEl = document.getElementById('app');

    function handleResize() {
      isMobile.set(window.innerWidth < 768);
      if (appEl) {
        appEl.style.height = `${window.innerHeight}px`;
      }
    }

    handleResize(); // Call once on mount

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  function handleCreateNewChat() {
    const character = get(chatSelectionModalData).character;
    if (character) {
      const newChatRoomId = createNewChatRoom(character.id);
      selectedChatId.set(newChatRoomId);
      isChatSelectionModalVisible.set(false);
    }
  }

  function handleCharacterSelect(event) {
    const character = event.detail;
    const rooms = get(chatRooms)[character.id] || [];
    if (rooms.length === 1) {
      selectedChatId.set(rooms[0].id);
    } else if (rooms.length > 1) {
      chatSelectionModalData.set({ character });
      isChatSelectionModalVisible.set(true);
    } else {
      const newChatRoomId = createNewChatRoom(character.id);
      selectedChatId.set(newChatRoomId);
    }
  }

  function handleMobileCharacterSelect(event) {
    const character = event.detail;
    chatSelectionModalData.set({ character });
    isChatSelectionModalVisible.set(true);
  }

  function handleOpenSns(event) {
    snsFeedCharacter.set(event.detail);
    isSNSFeedModalVisible.set(true);
  }

  function handleCharacterSettings(event) {
    editingCharacter.set(event.detail);
    isCharacterModalVisible.set(true);
  }

  function handleNewCharacter() {
    editingCharacter.set(null);
    isCharacterModalVisible.set(true);
  }

  function handleSaveSNSPost(event) {
    const post = event.detail;
    characters.update(chars => {
      const charIndex = chars.findIndex(c => c.id === post.characterId);
      if (charIndex !== -1) {
        if (post.isNew) {
          chars[charIndex].snsPosts.push({ ...post, id: Date.now(), isNew: false });
        } else {
          const postIndex = chars[charIndex].snsPosts.findIndex(p => p.id === post.id);
          if (postIndex !== -1) {
            chars[charIndex].snsPosts[postIndex] = post;
          }
        }
      }
      return chars;
    });
  }

  $: {
    if (typeof document !== 'undefined' && $settings.fontScale) {
      document.documentElement.style.setProperty('--font-scale', $settings.fontScale);
    }
  }

</script>

<ConfirmationModal />
<ImageZoomModal />
<CreateGroupChatModal />
<CreateOpenChatModal />
<EditGroupChatModal />
<CharacterModal />
<DesktopSettingsUI />
<MasterPasswordModal />
<ChatSelectionModal
  isOpen={$isChatSelectionModalVisible}
  character={$chatSelectionModalData.character}
  on:close={() => isChatSelectionModalVisible.set(false)}
  on:createNewChat={handleCreateNewChat}
/>
<SearchModal
  isOpen={$isSearchModalVisible}
  on:close={() => isSearchModalVisible.set(false)}
  on:select={handleCharacterSelect}
/>
<SNSCharacterListModal
  isOpen={$isSNSCharacterListModalVisible}
  on:close={() => isSNSCharacterListModalVisible.set(false)}
  on:openSns={handleOpenSns}
/>
<SNSFeedModal
  isOpen={$isSNSFeedModalVisible}
  character={$snsFeedCharacter}
  on:close={() => isSNSFeedModalVisible.set(false)}
/>
<SNSPostModal
  isOpen={$isSNSPostModalVisible}
  editingPost={$editingSNSPost}
  on:close={() => isSNSPostModalVisible.set(false)}
  on:save={handleSaveSNSPost}
/>
<PromptModal />
<DebugLogsModal />
<DevModeIndicator />

{#if $isMobile}
  <div class="w-full h-full overflow-hidden relative">
    <!-- Container for Chat/List and Settings -->
    <div class="w-full h-full absolute top-0 left-0 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
         style="transform: translateX({$isMobileSettingsPageVisible ? '-100%' : '0'});">

      <!-- Main View (List <-> Chat) -->
      <div class="w-full h-full absolute top-0 left-0 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
           style="transform: translateX({$selectedChatId ? '-100%' : '0'});">

        <!-- Character List -->
        <div class="w-full h-full absolute top-0 left-0" style="transform: translateX(0);">
          <CharacterListPage on:characterselect={handleMobileCharacterSelect} on:sns={handleOpenSns} on:settings={handleCharacterSettings} on:newcharacter={handleNewCharacter} />
        </div>

        <!-- Main Chat -->
        <div class="w-full h-full absolute top-0 left-0" style="transform: translateX(100%);">
          {#if $selectedChatId}
            <MainChat />
          {/if}
        </div>
      </div>
    </div>

    <!-- Settings View -->
    <div class="w-full h-full absolute top-0 left-0 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
         style="transform: translateX({$isMobileSettingsPageVisible ? '0' : '100%'});">
      <MobileSettings isOpen={$isMobileSettingsPageVisible} />
    </div>
  </div>
{:else}
  <div class="relative flex h-screen w-screen" class:sidebar-collapsed={$isSidebarCollapsed}>
    <Sidebar />

    <main id="main-content-area" class="flex-1 relative">
      {#if $selectedChatId}
        <div in:fade={{ duration: 300 }} class="w-full h-full">
          <MainChat />
        </div>
      {:else}
        <div in:fade={{ duration: 300 }} class="w-full h-full">
          <LandingPage />
        </div>
      {/if}
    </main>
  </div>
{/if}
