

<script>
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { selectedChatId, createNewChatRoom, chatRooms } from './stores/chat';
  import { characters, editingCharacter } from './stores/character';
  import { isSidebarCollapsed, isChatSelectionModalVisible, chatSelectionModalData, isSearchModalVisible, isMobile, isSNSCharacterListModalVisible, isSNSFeedModalVisible, snsFeedCharacter, isSNSPostModalVisible, editingSNSPost, isMobileSettingsPageVisible, isCharacterModalVisible } from './stores/ui';
  import { fade } from 'svelte/transition';
  import { stickerManager } from './stores/services';
  import { StickerManager } from './services/stickerManager.js';

  // Core components - always loaded
  import Sidebar from './components/Sidebar.svelte';
  import LandingPage from './components/LandingPage.svelte';
  import MainChat from './components/MainChat.svelte';
  import DevModeIndicator from './components/DevModeIndicator.svelte';

  // Lazy load heavy components
  let ConfirmationModal, ImageZoomModal, CreateGroupChatModal, CreateOpenChatModal,
      EditGroupChatModal, CharacterModal, DesktopSettingsUI, MasterPasswordModal,
      ChatSelectionModal, SearchModal, CharacterListPage, MobileSettings,
      SNSCharacterListModal, SNSFeedModal, SNSPostModal, PromptModal, DebugLogsModal;
  import { settings } from './stores/settings';
  import { enableAutoSnapshots } from './services/dataService';
  import { addLog } from './services/logService';

  // Dynamic import functions for code splitting
  const loadConfirmationModal = () => import('./components/ConfirmationModal.svelte');
  const loadImageZoomModal = () => import('./components/ImageZoomModal.svelte');
  const loadCreateGroupChatModal = () => import('./components/modals/chat/CreateGroupChatModal.svelte');
  const loadCreateOpenChatModal = () => import('./components/modals/chat/CreateOpenChatModal.svelte');
  const loadEditGroupChatModal = () => import('./components/modals/chat/EditGroupChatModal.svelte');
  const loadCharacterModal = () => import('./components/modals/character/CharacterModal.svelte');
  const loadDesktopSettingsUI = () => import('./components/modals/settings/DesktopSettingsUI.svelte');
  const loadMasterPasswordModal = () => import('./components/modals/security/MasterPasswordModal.svelte');
  const loadChatSelectionModal = () => import('./components/modals/chat/ChatSelectionModal.svelte');
  const loadSearchModal = () => import('./components/modals/search/SearchModal.svelte');
  const loadCharacterListPage = () => import('./components/mobile/CharacterListPage.svelte');
  const loadMobileSettings = () => import('./components/modals/settings/MobileSettings.svelte');
  const loadSNSCharacterListModal = () => import('./components/modals/sns/SNSCharacterListModal.svelte');
  const loadSNSFeedModal = () => import('./components/modals/sns/SNSFeedModal.svelte');
  const loadSNSPostModal = () => import('./components/modals/sns/SNSPostModal.svelte');
  const loadPromptModal = () => import('./components/modals/prompt/PromptModal.svelte');
  const loadDebugLogsModal = () => import('./components/modals/logs/DebugLogsModal.svelte');

  // Lazy load components when needed
  async function lazyLoadComponent(loadFunction, componentVar) {
    if (!componentVar) {
      const module = await loadFunction();
      componentVar = module.default;
    }
    return componentVar;
  }

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

  async function handleCreateNewChat() {
    // Lazy load ChatSelectionModal if needed
    ChatSelectionModal = await lazyLoadComponent(loadChatSelectionModal, ChatSelectionModal);
    const character = get(chatSelectionModalData).character;
    if (character) {
      const newChatRoomId = createNewChatRoom(character.id);
      selectedChatId.set(newChatRoomId);
      isChatSelectionModalVisible.set(false);
    }
  }

  async function handleCharacterSelect(event) {
    // Lazy load SearchModal if needed
    SearchModal = await lazyLoadComponent(loadSearchModal, SearchModal);
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

  async function handleMobileCharacterSelect(event) {
    // Lazy load CharacterListPage if needed
    CharacterListPage = await lazyLoadComponent(loadCharacterListPage, CharacterListPage);
    const character = event.detail;
    chatSelectionModalData.set({ character });
    isChatSelectionModalVisible.set(true);
  }

  async function handleOpenSns(event) {
    // Lazy load SNS components if needed
    SNSCharacterListModal = await lazyLoadComponent(loadSNSCharacterListModal, SNSCharacterListModal);
    SNSFeedModal = await lazyLoadComponent(loadSNSFeedModal, SNSFeedModal);
    snsFeedCharacter.set(event.detail);
    isSNSFeedModalVisible.set(true);
  }

  async function handleCharacterSettings(event) {
    // Lazy load CharacterModal if needed
    CharacterModal = await lazyLoadComponent(loadCharacterModal, CharacterModal);
    editingCharacter.set(event.detail);
    isCharacterModalVisible.set(true);
  }

  async function handleNewCharacter() {
    // Lazy load CharacterModal if needed
    CharacterModal = await lazyLoadComponent(loadCharacterModal, CharacterModal);
    editingCharacter.set(null);
    isCharacterModalVisible.set(true);
  }

  async function handleSaveSNSPost(event) {
    // Lazy load SNSPostModal if needed
    SNSPostModal = await lazyLoadComponent(loadSNSPostModal, SNSPostModal);
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
