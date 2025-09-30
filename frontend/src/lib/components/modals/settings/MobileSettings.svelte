<script>
  import { t } from '../../../../i18n.js';
  import { createEventDispatcher } from 'svelte';
  import { fly } from 'svelte/transition';
  import {
    ArrowLeft, ChevronRight, User, BrainCircuit, MessageSquarePlus, Shuffle,
    Camera, Activity, Database, Image, Type, Settings, ChevronDown, Check, Info,
    Palette, BookUser, FileArchive, SlidersHorizontal, Bug
  } from 'lucide-svelte';
  import { isMobileSettingsPageVisible } from '../../../stores/ui';
  import AiSettings from './AiSettings.svelte';
  import NaiSettings from './NaiSettings.svelte';
  import AppearanceSettings from './AppearanceSettings.svelte';
  import CharacterDefaults from '../character/CharacterDefaults.svelte';
  import DataManagement from './DataManagement.svelte';
  import AdvancedSettings from './AdvancedSettings.svelte';
  import DebugSettings from './DebugSettings.svelte';
  import PromptSettings from './PromptSettings.svelte';

  export let isOpen = false;

  let activePage = 'main';
  let previousPage = 'main';

  const dispatch = createEventDispatcher();

  function closeModal() {
    isMobileSettingsPageVisible.set(false);
  }

  function navigateTo(page) {
    previousPage = activePage;
    activePage = page;
  }

  const menuItems = [
    { id: 'ai', icon: BrainCircuit, label: t('settings.aiSettings') },
    { id: 'nai', icon: Image, label: t('settings.naiSettings') },
    { id: 'appearance', icon: Palette, label: t('settings.appearanceSettings') },
    { id: 'characterDefaults', icon: BookUser, label: t('settings.yourPersona') },
    { id: 'data', icon: FileArchive, label: t('settings.dataManagement') },
    { id: 'advanced', icon: SlidersHorizontal, label: t('settings.advancedSettings') },
    { id: 'debug', icon: Bug, label: t('settings.debug') }
  ];
</script>

<style>
  .page-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    background-color: #111827; /* bg-gray-900 */
  }
</style>

{#if isOpen}
  <div class="fixed inset-0 bg-gray-900 z-40 overflow-hidden">
    {#if activePage === 'main'}
      <div class="page-container" transition:fly={{ x: -200, duration: 300 }}>
        <header class="absolute top-0 left-0 right-0 px-6 py-4 bg-gray-900/80 flex items-center justify-between z-10" style="backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);">
          <div class="flex items-center space-x-2">
            <button on:click={closeModal} class="p-3 -ml-2 rounded-full hover:bg-gray-700">
              <ArrowLeft class="h-6 w-6 text-gray-300" />
            </button>
            <h2 class="font-semibold text-white text-3xl">{t("settings.title")}</h2>
          </div>
        </header>
        <div class="flex-1 overflow-y-auto space-y-1 mt-[88px] px-4">
          {#each menuItems as item}
            <button on:click={() => navigateTo(item.id)} class="group border-b border-gray-800 last:border-b-0 w-full text-left">
              <div class="flex items-center justify-between list-none py-4">
                <span class="text-lg font-medium text-gray-200 flex items-center">
                  <svelte:component this={item.icon} class="w-5 h-5 mr-4 text-gray-400" />
                  {item.label}
                </span>
                <ChevronRight class="w-6 h-6 text-gray-400" />
              </div>
            </button>
          {/each}
        </div>
      </div>
    {:else if activePage === 'ai'}
      <div class="page-container" transition:fly={{ x: 200, duration: 300 }}>
        <AiSettings on:back={() => navigateTo('main')} on:navigate={e => navigateTo(e.detail)} />
      </div>
    {:else if activePage === 'prompt'}
      <div class="page-container" transition:fly={{ x: 200, duration: 300 }}>
        <PromptSettings on:back={() => navigateTo('ai')} />
      </div>
    {:else if activePage === 'nai'}
      <div class="page-container" transition:fly={{ x: 200, duration: 300 }}>
        <NaiSettings on:back={() => navigateTo('main')} />
      </div>
    {:else if activePage === 'appearance'}
      <div class="page-container" transition:fly={{ x: 200, duration: 300 }}>
        <AppearanceSettings on:back={() => navigateTo('main')} />
      </div>
    {:else if activePage === 'characterDefaults'}
      <div class="page-container" transition:fly={{ x: 200, duration: 300 }}>
        <CharacterDefaults on:back={() => navigateTo('main')} />
      </div>
    {:else if activePage === 'data'}
      <div class="page-container" transition:fly={{ x: 200, duration: 300 }}>
        <DataManagement on:back={() => navigateTo('main')} />
      </div>
    {:else if activePage === 'advanced'}
      <div class="page-container" transition:fly={{ x: 200, duration: 300 }}>
        <AdvancedSettings on:back={() => navigateTo('main')} />
      </div>
    {:else if activePage === 'debug'}
      <div class="page-container" transition:fly={{ x: 200, duration: 300 }}>
        <DebugSettings on:back={() => navigateTo('main')} />
      </div>
    {/if}
  </div>
{/if}