<script>
    import { t } from "$root/i18n";
    import { createEventDispatcher, onMount, onDestroy } from "svelte";
    import { get } from "svelte/store";
    import { fade } from "svelte/transition";
    import {
        X,
        Plus,
        Instagram,
        Lock,
        ShieldAlert,
        Image,
        Hash,
    } from "lucide-svelte";
    import { characters, characterStateStore } from "../../../stores/character";
    import { isSNSPostModalVisible, editingSNSPost } from "../../../stores/ui";
    import { checkSNSAccess, requirements } from "../../../utils/sns.js";
    import PostsTab from "./tabs/PostsTab.svelte";
    import SecretsTab from "./tabs/SecretsTab.svelte";
    import TagsTab from "./tabs/TagsTab.svelte";

    export let isOpen = false;
    export let character = null;

    let activeTab = "posts";
    let isSecretMode = false;
    let hasAccess = false;

    let postsCount = 0;
    let secretsCount = 0;
    let tagsCount = 0;

    let currentCharacter;

    const dispatch = createEventDispatcher();

    function closeModal() {
        dispatch("close");
    }

    function toggleSecretMode() {
        isSecretMode = !isSecretMode;
    }

    function createNewPost() {
        editingSNSPost.set({
            characterId: character.id,
            isNew: true,
            isSecret: isSecretMode,
        });
        isSNSPostModalVisible.set(true);
    }

    $: {
        if (character) {
            currentCharacter = $characters.find((c) => c.id === character.id);
        } else {
            currentCharacter = null;
        }
        if (currentCharacter) {
            const requiredLevel = isSecretMode ? "private" : "public";
            hasAccess = checkSNSAccess(
                currentCharacter,
                requiredLevel,
                get(characterStateStore)[currentCharacter.id]
            );

            if (currentCharacter.snsPosts) {
                postsCount = currentCharacter.snsPosts.filter(
                    (p) => !p.access_level || p.access_level === "main-public"
                ).length;
                secretsCount = currentCharacter.snsPosts.filter(
                    (p) =>
                        p.access_level &&
                        (p.access_level.includes("private") ||
                            p.access_level.includes("secret"))
                ).length;

                const allTags = new Set();
                currentCharacter.snsPosts.forEach((post) => {
                    if (post.tags && Array.isArray(post.tags)) {
                        post.tags.forEach((tag) => allTags.add(tag));
                    }
                });
                tagsCount = allTags.size;
            } else {
                postsCount = 0;
                secretsCount = 0;
                tagsCount = 0;
            }
        }
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

{#if isOpen && currentCharacter}
    <div
        transition:fade={{ duration: 200 }}
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
        <div
            role="dialog"
            aria-modal="true"
            tabindex="0"
            aria-labelledby="sns-feed-title"
            class="bg-gray-900 rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl border border-gray-700"
            on:click|stopPropagation
            on:keydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                }
            }}
        >
            <!-- Header -->
            <div
                class="relative {isSecretMode
                    ? 'bg-gradient-to-r from-red-900 to-pink-900'
                    : 'bg-gradient-to-r from-purple-900 to-pink-900'} p-6 text-white rounded-t-xl"
            >
                <button
                    on:click={closeModal}
                    class="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
                >
                    <X class="w-5 h-5 text-white" />
                </button>

                {#if currentCharacter?.hypnosis?.enabled && currentCharacter?.hypnosis?.sns_edit_access}
                    <button
                        on:click={createNewPost}
                        class="create-sns-post absolute top-4 right-16 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
                        title={t("sns.createNewPost")}
                    >
                        <Plus class="w-5 h-5 text-white" />
                    </button>
                {/if}

                <div class="flex items-center space-x-4 mb-4">
                    <div
                        class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                    >
                        {#if currentCharacter.avatar}
                            <img
                                src={currentCharacter.avatar}
                                alt={currentCharacter.name}
                                class="w-full h-full object-cover"
                            />
                        {:else}
                            <Instagram class="w-8 h-8" />
                        {/if}
                    </div>
                    <div>
                        <h2 id="sns-feed-title" class="text-xl font-bold">
                            {currentCharacter.name}
                        </h2>
                        <p class="text-sm opacity-90">
                            {isSecretMode
                                ? t("sns.secretAccount")
                                : t("sns.mainAccount")}
                        </p>
                    </div>
                </div>

                {#if hasAccess}
                    <div class="flex items-center justify-between">
                        <div class="flex space-x-4 text-sm">
                            <div class="text-center">
                                <div class="font-bold">{postsCount}</div>
                                <div class="opacity-75">{t("sns.posts")}</div>
                            </div>
                            <div class="text-center">
                                <div class="font-bold">{secretsCount}</div>
                                <div class="opacity-75">{t("sns.secrets")}</div>
                            </div>
                            <div class="text-center">
                                <div class="font-bold">{tagsCount}</div>
                                <div class="opacity-75">{t("sns.tags")}</div>
                            </div>
                        </div>

                        <button
                            on:click={toggleSecretMode}
                            class="px-4 py-2 rounded-full {isSecretMode
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-gray-800 hover:bg-gray-700'} text-sm font-medium transition-colors"
                        >
                            {isSecretMode
                                ? t("sns.mainAccount")
                                : t("sns.secretAccount")}
                        </button>
                    </div>
                {/if}

                {#if isSecretMode}
                    <div class="mt-3 text-xs opacity-75">
                        <ShieldAlert class="w-3 h-3 inline mr-1" />
                        {t("sns.secretAccountWarning")}
                    </div>
                {/if}
            </div>

            {#if hasAccess}
                <!-- Nav -->
                <div class="flex border-b border-gray-800">
                    <button
                        on:click={() => (activeTab = "posts")}
                        class="flex-1 py-4 text-sm font-medium {activeTab ===
                        'posts'
                            ? `text-${isSecretMode ? 'red' : 'pink'}-500 border-b-2 border-${isSecretMode ? 'red' : 'pink'}-500 bg-gray-800/50`
                            : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'} transition-colors relative"
                    >
                        {t("sns.postsTab")}
                    </button>
                    <button
                        on:click={() => (activeTab = "secrets")}
                        class="flex-1 py-4 text-sm font-medium {activeTab ===
                        'secrets'
                            ? `text-${isSecretMode ? 'red' : 'pink'}-500 border-b-2 border-${isSecretMode ? 'red' : 'pink'}-500 bg-gray-800/50`
                            : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'} transition-colors relative"
                    >
                        {t("sns.secretsTab")}
                    </button>
                    <button
                        on:click={() => (activeTab = "tags")}
                        class="flex-1 py-4 text-sm font-medium {activeTab ===
                        'tags'
                            ? `text-${isSecretMode ? 'red' : 'pink'}-500 border-b-2 border-${isSecretMode ? 'red' : 'pink'}-500 bg-gray-800/50`
                            : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'} transition-colors relative"
                    >
                        {t("sns.tagsTab")}
                    </button>
                </div>

                <!-- Content -->
                <div class="overflow-y-auto max-h-[calc(90vh-200px)]">
                    {#if activeTab === "posts"}
                        <PostsTab character={currentCharacter} {isSecretMode} />
                    {:else if activeTab === "secrets"}
                        <SecretsTab
                            character={currentCharacter}
                            {isSecretMode}
                        />
                    {:else if activeTab === "tags"}
                        <TagsTab character={currentCharacter} {isSecretMode} />
                    {/if}
                </div>
            {:else}
                <div class="p-8 text-center">
                    <Lock class="w-16 h-16 mx-auto mb-4 text-red-500" />
                    <h3 class="text-xl font-bold text-white mb-2">
                        {t("sns.accessDenied")}
                    </h3>
                    <p class="text-gray-400 mb-4">
                        {t("sns.accessDeniedDescription")}
                    </p>

                    <div class="bg-gray-800 rounded-lg p-4 mb-4">
                        <h4 class="text-sm font-medium text-gray-300 mb-2">
                            {t("sns.requiredPermissions")}:
                        </h4>
                        <div class="text-xs text-red-400 space-y-1">
                            <div>
                                {t("sns.requiresAffection", {
                                    level: requirements.private.affection * 100,
                                })}
                            </div>
                            <div>
                                {t("sns.requiresIntimacy", {
                                    level: requirements.private.intimacy * 100,
                                })}
                            </div>
                            <div>
                                {t("sns.requiresTrust", {
                                    level: requirements.private.trust * 100,
                                })}
                            </div>
                            <div>
                                {t("sns.requiresRomance", {
                                    level:
                                        requirements.private.romantic_interest *
                                        100,
                                })}
                            </div>
                        </div>
                    </div>

                    <div class="space-y-3">
                        <button
                            on:click={() => (isSecretMode = false)}
                            class="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                        >
                            {t("sns.backToMain")}
                        </button>
                        <button
                            on:click={closeModal}
                            class="px-4 py-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                        >
                            {t("common.close")}
                        </button>
                    </div>
                </div>
            {/if}
        </div>
    </div>
{/if}
