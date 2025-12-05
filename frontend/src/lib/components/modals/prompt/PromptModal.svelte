<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { t } from "$root/i18n";
    import { isPromptModalVisible } from "../../../stores/ui";
    import { prompts } from "../../../stores/prompts";
    import PromptSection from "./PromptSection.svelte";
    import HookManager from "../HookManager.svelte";
    import { X, Download, Upload, RefreshCw } from "@lucide/svelte";
    import { fade } from "svelte/transition";
    import type { PromptStorageType } from "$types/Prompt";

    type TabType = "prompts" | "hooks";

    let promptData: PromptStorageType = {};
    let activeTab: TabType = "prompts";

    const promptSections = [
        {
            key: "mainChat",
            title: t("promptModal.mainChatPrompt"),
            description: t("promptModal.mainChatPromptDescription"),
        },
        {
            key: "characterSheet",
            title: t("promptModal.characterSheetGenerationPrompt"),
            description: t(
                "promptModal.characterSheetGenerationPromptDescription",
            ),
        },
        {
            key: "profileCreation",
            title: t("promptModal.randomFirstMessagePrompt"),
            description: t("promptModal.randomFirstMessagePromptDescription"),
        },
        {
            key: "snsForce",
            title: t("promptModal.snsForcePrompt"),
            description: t("promptModal.snsForcePromptDescription"),
        },
        {
            key: "naiSticker",
            title: t("promptModal.naiStickerPrompt"),
            description: t("promptModal.naiStickerPromptDescription"),
        },
        {
            key: "groupChat",
            title: t("promptModal.groupChatPrompt"),
            description: t("promptModal.groupChatPromptDescription"),
        },
        {
            key: "openChat",
            title: t("promptModal.openChatPrompt"),
            description: t("promptModal.openChatPromptDescription"),
        },
    ] satisfies {
        key: keyof PromptStorageType;
        title: string;
        description: string;
    }[];

    async function handleSave() {
        await prompts.save(promptData);
        isPromptModalVisible.set(false);
    }

    async function handleReset() {
        if (confirm(t("promptModal.resetAllPromptsConfirmation"))) {
            await prompts.reset();
        }
    }

    async function handleBackup() {
        await prompts.backup();
    }

    async function handleRestore() {
        try {
            await prompts.restore();
        } catch (e) {
            alert(t("promptModal.restoreFailed"));
        }
    }

    function handleKeydown(event) {
        if (event.key === "Escape") {
            isPromptModalVisible.set(false);
        }
    }

    onMount(() => {
        window.addEventListener("keydown", handleKeydown);
    });

    onDestroy(() => {
        window.removeEventListener("keydown", handleKeydown);
    });
</script>

{#if $isPromptModalVisible}
    <div
        transition:fade={{ duration: 200 }}
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
        <div
            role="dialog"
            aria-modal="true"
            tabindex="0"
            aria-labelledby="prompt-modal-title"
            class="bg-gray-800 rounded-2xl w-full max-w-4xl mx-4 flex flex-col max-h-[90vh]"
            on:click|stopPropagation
            on:keydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                }
            }}
        >
            <div
                class="flex items-center justify-between p-6 border-b border-gray-700 shrink-0"
            >
                <div class="flex items-center gap-6">
                    <h3
                        id="prompt-modal-title"
                        class="text-lg font-semibold text-white"
                    >
                        {t("promptModal.title")}
                    </h3>
                    <div class="flex gap-2 ml-4">
                        <button
                            on:click={() => (activeTab = "prompts")}
                            class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors {activeTab ===
                            'prompts'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}"
                        >
                            {t("promptModal.promptsTab")}
                        </button>
                        <button
                            on:click={() => (activeTab = "hooks")}
                            class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors {activeTab ===
                            'hooks'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}"
                        >
                            {t("promptModal.replaceHooksTab")}
                        </button>
                    </div>
                </div>
                <button
                    on:click={() => isPromptModalVisible.set(false)}
                    class="p-1 hover:bg-gray-700 rounded-full"
                    ><X class="w-5 h-5" /></button
                >
            </div>
            <div class="p-6 space-y-6 overflow-y-auto">
                {#if activeTab === "prompts"}
                    {#each promptSections as section}
                        <PromptSection
                            title={section.title}
                            description={section.description}
                            bind:value={promptData[section.key]}
                        />
                    {/each}
                {:else if activeTab === "hooks"}
                    <HookManager />
                {/if}
            </div>
            <div
                class="p-6 mt-auto border-t border-gray-700 shrink-0 flex flex-wrap justify-end gap-3"
            >
                {#if activeTab === "prompts"}
                    <button
                        on:click={handleBackup}
                        class="py-2 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                    >
                        <Download class="w-4 h-4" />
                        {t("promptModal.backupPrompts")}
                    </button>
                    <button
                        on:click={handleRestore}
                        class="py-2 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                    >
                        <Upload class="w-4 h-4" />
                        {t("promptModal.restorePrompts")}
                    </button>
                    <button
                        on:click={handleReset}
                        class="py-2 px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                    >
                        <RefreshCw class="w-4 h-4" />
                        {t("promptModal.resetAllPrompts")}
                    </button>
                {/if}
                <div class="flex-grow"></div>
                <button
                    on:click={() => isPromptModalVisible.set(false)}
                    class="py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >{t("common.cancel")}</button
                >
                {#if activeTab === "prompts"}
                    <button
                        on:click={handleSave}
                        class="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >{t("common.save")}</button
                    >
                {/if}
            </div>
        </div>
    </div>
{/if}
