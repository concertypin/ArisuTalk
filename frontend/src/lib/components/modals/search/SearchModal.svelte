
<script>
  import { t } from '../../../../i18n.js';
  import { createEventDispatcher, beforeUpdate, afterUpdate } from 'svelte';
  import { fade } from 'svelte/transition';
  import { Search, X, SearchX } from 'lucide-svelte';
  import { searchQuery } from '../../../stores/chat';
  import { characters } from '../../../stores/character';
  import CharacterItem from '../../CharacterItem.svelte';

  export let isOpen = false;

  const dispatch = createEventDispatcher();

  let filteredCharacters = [];
  let modalContentEl;
  let oldHeight;

  beforeUpdate(() => {
    if (!modalContentEl) return;
    oldHeight = modalContentEl.offsetHeight;
  });

  afterUpdate(() => {
    if (!modalContentEl || oldHeight === undefined) return;

    const scrollHeight = modalContentEl.scrollHeight;
    const vh85 = window.innerHeight * 0.85;
    const newHeight = Math.min(scrollHeight, vh85);

    if (Math.abs(oldHeight - newHeight) < 5) {
      return;
    }

    modalContentEl.style.height = `${oldHeight}px`;
    modalContentEl.style.overflow = 'hidden'; // Prevent scrollbar flicker during animation

    requestAnimationFrame(() => {
      modalContentEl.style.transition = `height 0.4s cubic-bezier(0.4, 0, 0.2, 1)`;
      modalContentEl.style.height = `${newHeight}px`;

      const onTransitionEnd = () => {
        modalContentEl.removeEventListener('transitionend', onTransitionEnd);
        modalContentEl.style.transition = '';
        modalContentEl.style.height = '';
        modalContentEl.style.overflow = '';
      };
      modalContentEl.addEventListener('transitionend', onTransitionEnd);
    });
  });

  $: {
    const query = $searchQuery.toLowerCase().trim();
    if (query) {
      filteredCharacters = $characters.filter(char =>
        char.name.toLowerCase().includes(query)
      );
    } else {
      filteredCharacters = [];
    }
  }

  function closeModal() {
    dispatch('close');
  }

  function handleSelect(event) {
    dispatch('select', event.detail);
    closeModal();
  }

</script>

{#if isOpen}
  <div transition:fade={{ duration: 200 }} class="modal-backdrop fixed inset-0 bg-black/60 z-50" on:click={closeModal}></div>
  <div class="search-modal-container p-4 pt-16 md:pt-24 fixed inset-0 z-50 overflow-y-auto">
    <div class="search-modal-content bg-gray-800 rounded-2xl shadow-lg w-full max-w-lg mx-auto flex flex-col max-h-[85vh]" bind:this={modalContentEl}>
        <header class="p-4 flex-shrink-0 flex items-center gap-4 border-b border-gray-700">
            <Search class="w-5 h-5 text-gray-400" />
            <input bind:value={$searchQuery} type="text" placeholder={t("sidebar.searchPlaceholder")} class="flex-1 w-full bg-transparent text-white placeholder-gray-500 focus:outline-none text-lg" autofocus />
            <button on:click={closeModal} class="p-2 -mr-2 rounded-full hover:bg-gray-700">
                <X class="w-5 h-5 text-gray-300" />
            </button>
        </header>
        <div class="search-results-container flex-1 overflow-y-auto p-2">
            {#if $searchQuery.trim()}
                {#if filteredCharacters.length > 0}
                    <div class="character-list space-y-2 p-2">
                        {#each filteredCharacters as char (char.id)}
                            <CharacterItem character={char} on:select={handleSelect} />
                        {/each}
                    </div>
                {:else}
                    <div class="text-center text-gray-400 py-12">
                        <SearchX class="w-12 h-12 mx-auto mb-4" />
                        <p>{t("search.noResults")}</p>
                    </div>
                {/if}
            {:else}
                <div class="text-center text-gray-400 py-12">
                    <Search class="w-12 h-12 mx-auto mb-4" />
                    <p>{t("search.prompt")}</p>
                </div>
            {/if}
        </div>
    </div>
  </div>
{/if}
