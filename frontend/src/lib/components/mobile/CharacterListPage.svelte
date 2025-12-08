<script lang="ts">
import { t } from "$root/i18n";
import { Plus, Search, Settings, UserCircle2, X } from "lucide-svelte";
import { createEventDispatcher } from "svelte";

import { auth } from "../../stores/auth";
import { characters } from "../../stores/character";
import {
    isFabMenuVisible,
    isMobileAuthModalVisible,
    isMobileSettingsPageVisible,
    isSearchModalVisible,
} from "../../stores/ui";
import CharacterItem from "../CharacterItem.svelte";

const dispatch = createEventDispatcher();

function openSearchModal() {
    isSearchModalVisible.set(true);
}

function openSettingsModal() {
    isMobileSettingsPageVisible.set(true);
}

function openAuthModal() {
    isMobileAuthModalVisible.set(true);
}

function toggleFabMenu() {
    isFabMenuVisible.update((v) => !v);
}

function openNewCharacterModal() {
    dispatch("newcharacter");
}

function handleCharacterSelect(event: CustomEvent) {
    dispatch("characterselect", event.detail);
}
</script>

<div class="flex flex-col h-full relative w-full">
    <header class="px-6 py-4 sticky top-0 bg-gray-950 z-10">
        <div class="flex items-center justify-between">
            <h1 class="text-3xl text-white">{t("sidebar.title")}</h1>
            <div class="flex items-center gap-2">
                <button
                    on:click={openSearchModal}
                    class="p-3 rounded-full hover:bg-gray-700 transition-colors"
                >
                    <Search class="w-6 h-6 text-gray-100" />
                </button>
                <button
                    on:click={openAuthModal}
                    class="relative p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                    aria-label={t("auth.account")}
                >
                    <UserCircle2
                        class={`w-6 h-6 ${$auth.isSignedIn ? "text-blue-300" : "text-gray-100"}`}
                    />
                    {#if $auth.isSignedIn}
                        <span
                            class="absolute top-2 right-2 inline-flex w-2 h-2 rounded-full bg-emerald-400"
                        ></span>
                    {/if}
                </button>
                <button
                    on:click={openSettingsModal}
                    class="p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                    <Settings class="w-6 h-6 text-gray-100" />
                </button>
            </div>
        </div>
    </header>

    <div
        class="flex-1 overflow-y-auto p-4 bg-gray-900 rounded-t-[3rem]"
        style="scroll-behavior: smooth;"
    >
        <div class="character-list space-y-4">
            {#each $characters as char (char.id)}
                <CharacterItem
                    character={char}
                    on:select={handleCharacterSelect}
                    on:sns={(e) => dispatch("sns", e.detail)}
                    on:settings={(e) => dispatch("settings", e.detail)}
                />
            {/each}
        </div>
    </div>

    {#if $isFabMenuVisible}
        <div
            class="fab-menu fixed bottom-24 right-6 w-48 bg-gray-700 rounded-2xl shadow-lg z-20 animate-fab-menu-in"
        >
            <button
                on:click={openNewCharacterModal}
                class="w-full flex items-center gap-3 px-4 py-3 text-white text-sm text-left rounded-2xl hover:bg-gray-600"
            >
                <Plus class="w-5 h-5" />
                <span>{t("sidebar.invite")}</span>
            </button>
        </div>
    {/if}

    <button
        on:click={toggleFabMenu}
        class="fixed bottom-6 right-6 bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all duration-200 transform-gpu hover:scale-110 active:scale-95 z-30"
    >
        {#if $isFabMenuVisible}
            <X
                class="w-8 h-8 transition-transform duration-300 ease-in-out rotate-45"
            />
        {:else}
            <Plus
                class="w-8 h-8 transition-transform duration-300 ease-in-out"
            />
        {/if}
    </button>
</div>
