<script>
  import { t } from '../../../../i18n.js';
  import { createEventDispatcher } from 'svelte';
  import { ArrowLeft, Save, RefreshCw, Download, Upload } from 'lucide-svelte';
  import { prompts } from '../../../stores/prompts';
  import PromptSection from '../prompt/PromptSection.svelte';

  const dispatch = createEventDispatcher();

  let promptData = {};
  prompts.subscribe(value => {
      promptData = JSON.parse(JSON.stringify(value)); // Deep copy
  });

  const promptSections = [
    { key: "mainChat", title: t("promptModal.mainChatPrompt"), description: t("promptModal.mainChatPromptDescription") },
    { key: "characterSheet", title: t("promptModal.characterSheetGenerationPrompt"), description: t("promptModal.characterSheetGenerationPromptDescription") },
    { key: "profileCreation", title: t("promptModal.randomFirstMessagePrompt"), description: t("promptModal.randomFirstMessagePromptDescription") },
    { key: "snsForce", title: t("promptModal.snsForcePrompt"), description: t("promptModal.snsForcePromptDescription") },
    { key: "naiSticker", title: t("promptModal.naiStickerPrompt"), description: t("promptModal.naiStickerPromptDescription") },
    { key: "groupChat", title: t("promptModal.groupChatPrompt"), description: t("promptModal.groupChatPromptDescription") },
    { key: "openChat", title: t("promptModal.openChatPrompt"), description: t("promptModal.openChatPromptDescription") },
  ];

  async function handleSave() {
    await prompts.save(promptData);
    dispatch('back');
  }

  async function handleReset() {
    if (confirm(t("promptModal.resetAllPromptsConfirmation"))) {
      await prompts.reset();
      // Re-initialize promptData after reset
      prompts.subscribe(value => { promptData = JSON.parse(JSON.stringify(value)); });
    }
  }
</script>

<div class="flex flex-col h-full relative">
  <header class="absolute top-0 left-0 right-0 px-6 py-4 bg-gray-900/80 flex items-center justify-between z-10" style="backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);">
    <div class="flex items-center space-x-2">
      <button on:click={() => dispatch('back')} class="p-3 -ml-2 rounded-full hover:bg-gray-700">
        <ArrowLeft class="h-6 w-6 text-gray-300" />
      </button>
      <h2 class="font-semibold text-white text-3xl">{t("promptModal.title")}</h2>
    </div>
    <div class="flex items-center">
      <button on:click={handleSave} class="p-3 -mr-2 rounded-full hover:bg-gray-700 text-blue-400">
        <Save class="h-6 w-6" />
      </button>
    </div>
  </header>

  <div class="flex-1 overflow-y-auto mt-[88px] px-6 mx-4 bg-gray-900 rounded-t-2xl py-6 space-y-6">
    {#each promptSections as section}
      <PromptSection 
        title={section.title}
        description={section.description}
        bind:value={promptData[section.key]}
      />
    {/each}

    <div class="border-t-2 border-gray-700 pt-6 space-y-3">
        <button on:click={prompts.backup} class="w-full p-3 rounded-lg bg-gray-700/80 border border-gray-600 text-gray-300 hover:bg-gray-700 flex items-center justify-center gap-3">
            <Download class="w-5 h-5" />
            <span>{t("promptModal.backupPrompts")}</span>
        </button>
        <button on:click={prompts.restore} class="w-full p-3 rounded-lg bg-gray-700/80 border border-gray-600 text-gray-300 hover:bg-gray-700 flex items-center justify-center gap-3">
            <Upload class="w-5 h-5" />
            <span>{t("promptModal.restorePrompts")}</span>
        </button>
        <button on:click={handleReset} class="w-full p-3 rounded-lg bg-red-600/20 border border-red-500 text-red-400 hover:bg-red-600/30 flex items-center justify-center gap-3">
            <RefreshCw class="w-5 h-5" />
            <span>{t("promptModal.resetAllPrompts")}</span>
        </button>
    </div>
  </div>
</div>