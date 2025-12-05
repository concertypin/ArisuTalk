<script>
    import { onMount, onDestroy } from "svelte";
    import { t } from "$root/i18n";
    import { createEventDispatcher } from "svelte";
    import { fade } from "svelte/transition";
    import { X, Search, ChevronRight, Lock } from "@lucide/svelte";
    import { characters, characterStateStore } from "../../../stores/character";
    import { checkSNSAccess } from "../../../utils/sns";

    export let isOpen = false;

    let searchTerm = "";
    let accessibleCharacters = [];
    let inaccessibleCharacters = [];

    const dispatch = createEventDispatcher();

    $: {
        const filtered = $characters.filter(
            (char) =>
                char.id !== 0 &&
                char.name.toLowerCase().includes(searchTerm.toLowerCase()),
        );
        accessibleCharacters = filtered.filter((char) =>
            checkSNSAccess(char, "public", $characterStateStore[char.id]),
        );
        inaccessibleCharacters = filtered.filter(
            (char) =>
                !checkSNSAccess(char, "public", $characterStateStore[char.id]),
        );
    }

    function closeModal() {
        dispatch("close");
    }

    function openSns(character) {
        dispatch("openSns", character);
        closeModal();
    }

    function handleKeydown(event) {
        if (event.key === "Escape") {
            closeModal();
        }
    }

    onMount(() => {
        window.addEventListener("keydown", handleKeydown);
    });

    onDestroy(() => {
        window.removeEventListener("keydown", handleKeydown);
    });
</script>

{#if isOpen}
    <div
        transition:fade={{ duration: 200 }}
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 w-full h-full"
    >
        <div
            role="dialog"
            aria-modal="true"
            tabindex="0"
            aria-labelledby="sns-character-list-title"
            class="bg-gray-900 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
            on:click|stopPropagation
            on:keydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                }
            }}
        >
            <div class="flex justify-between items-center mb-6">
                <h2
                    id="sns-character-list-title"
                    class="text-xl font-bold text-white"
                >
                    {t("sns.characterListTitle")}
                </h2>
                <button
                    on:click={closeModal}
                    class="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                    <X class="w-5 h-5 text-gray-300" />
                </button>
            </div>

            <div class="mb-4">
                <div class="relative">
                    <Search
                        class="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <input
                        bind:value={searchTerm}
                        type="text"
                        placeholder={t("sns.characterList.searchPlaceholder")}
                        class="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
                    />
                </div>
            </div>

            {#if accessibleCharacters.length > 0}
                <div class="mb-6">
                    <h3 class="text-sm font-medium text-green-400 mb-3">
                        {t("sns.characterList.availableCharacters")}
                    </h3>
                    <div class="space-y-2">
                        {#each accessibleCharacters as char (char.id)}
                            <button
                                on:click={() => openSns(char)}
                                class="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 w-full text-left"
                            >
                                <div class="flex items-center space-x-3">
                                    <div
                                        class="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden"
                                    >
                                        {#if char.avatar}
                                            <img
                                                src={char.avatar}
                                                alt={char.name}
                                                class="w-full h-full object-cover"
                                            />
                                        {:else}
                                            <i
                                                data-lucide="instagram"
                                                class="w-6 h-6 text-gray-400"
                                            ></i>
                                        {/if}
                                    </div>
                                    <div class="flex-1">
                                        <h4 class="font-medium text-white">
                                            {char.name}
                                        </h4>
                                        <!-- Affection levels can be added here if needed -->
                                    </div>
                                    <ChevronRight
                                        class="w-4 h-4 text-gray-400"
                                    />
                                </div>
                            </button>
                        {/each}
                    </div>
                </div>
            {/if}

            {#if inaccessibleCharacters.length > 0}
                <div>
                    <h3 class="text-sm font-medium text-red-400 mb-3">
                        {t("sns.characterList.noAccessCharacters")}
                    </h3>
                    <div class="space-y-2">
                        {#each inaccessibleCharacters as char (char.id)}
                            <div
                                class="bg-gray-800 p-3 rounded-lg cursor-not-allowed opacity-60"
                            >
                                <div class="flex items-center space-x-3">
                                    <div
                                        class="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden"
                                    >
                                        {#if char.avatar}
                                            <img
                                                src={char.avatar}
                                                alt={char.name}
                                                class="w-full h-full object-cover"
                                            />
                                        {:else}
                                            <i
                                                data-lucide="instagram"
                                                class="w-6 h-6 text-gray-400"
                                            ></i>
                                        {/if}
                                    </div>
                                    <div class="flex-1">
                                        <h4 class="font-medium text-white">
                                            {char.name}
                                        </h4>
                                        <!-- Affection levels can be added here if needed -->
                                    </div>
                                    <Lock class="w-4 h-4 text-red-400" />
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}

            {#if accessibleCharacters.length === 0 && inaccessibleCharacters.length === 0}
                <div class="text-center py-8 text-gray-400">
                    {searchTerm
                        ? t("sns.characterList.noSearchResults", { searchTerm })
                        : t("sns.characterList.noCharacters")}
                </div>
            {/if}
        </div>
    </div>
{/if}
