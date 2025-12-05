<script>
    import { onMount, onDestroy } from "svelte";
    import { t } from "$root/i18n";
    import { characters } from "../../../stores/character";
    import { groupChats, selectedChatId } from "../../../stores/chat";
    import { isCreateGroupChatModalVisible } from "../../../stores/ui";
    import { X, Users } from "@lucide/svelte";
    import { fade } from "svelte/transition";
    import Avatar from "../../Avatar.svelte";

    let groupName = "";
    let selectedParticipantIds = [];

    function closeModal() {
        isCreateGroupChatModalVisible.set(false);
        // Reset state
        groupName = "";
        selectedParticipantIds = [];
    }

    function createGroupChat() {
        if (!groupName.trim()) {
            alert(t("groupChat.groupChatNameRequiredMessage"));
            return;
        }
        if (selectedParticipantIds.length < 2) {
            alert(t("groupChat.participantsRequiredMessage"));
            return;
        }

        const newChatId = `group_${Date.now()}`;
        const newGroupChat = {
            id: newChatId,
            name: groupName,
            participantIds: selectedParticipantIds,
            type: "group", // To distinguish from other chat types
            createdAt: Date.now(),
            // Default settings from GroupChat.js logic
            settings: {
                responseFrequency: 0.5,
                maxRespondingCharacters: 1,
                responseDelay: 3000,
                participantSettings: selectedParticipantIds.reduce(
                    (acc, id) => {
                        acc[id] = {
                            isActive: true,
                            responseProbability: 0.9,
                            characterRole: "normal",
                        };
                        return acc;
                    },
                    {},
                ),
            },
        };

        groupChats.update((chats) => {
            chats[newChatId] = newGroupChat;
            return chats;
        });

        selectedChatId.set(newChatId);
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

{#if $isCreateGroupChatModalVisible}
    <div
        transition:fade={{ duration: 200 }}
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        on:click={closeModal}
        role="button"
        tabindex="0"
        on:keydown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                closeModal();
            }
        }}
    >
        <div
            role="dialog"
            aria-modal="true"
            tabindex="0"
            class="bg-gray-800 rounded-2xl w-full max-w-md mx-auto my-auto flex flex-col max-h-[90vh]"
            on:click|stopPropagation
            on:keydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }}
        >
            <div
                class="flex items-center justify-between p-6 border-b border-gray-700 shrink-0"
            >
                <h3
                    class="text-xl font-semibold text-white flex items-center gap-3"
                >
                    <Users class="w-6 h-6" />
                    {t("groupChat.createGroupChat")}
                </h3>
                <button
                    on:click={closeModal}
                    class="p-1 hover:bg-gray-700 rounded-full"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>
            <div class="p-6 space-y-6 overflow-y-auto">
                <div>
                    <label
                        for="group-name"
                        class="text-sm font-medium text-gray-300 mb-2 block"
                        >{t("groupChat.groupChatName")}</label
                    >
                    <input
                        id="group-name"
                        bind:value={groupName}
                        type="text"
                        placeholder={t("ui.groupChatNamePlaceholder")}
                        class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 text-sm"
                    />
                </div>

                <fieldset>
                    <legend class="text-sm font-medium text-gray-300 mb-3 block"
                        >{t("groupChat.selectParticipants")}</legend
                    >
                    <div
                        class="space-y-2 max-h-60 overflow-y-auto character-list-scrollbar pr-2"
                    >
                        {#each $characters as character (character.id)}
                            <label
                                class="flex items-center space-x-3 p-3 hover:bg-gray-700 rounded-lg cursor-pointer group"
                            >
                                <input
                                    type="checkbox"
                                    bind:group={selectedParticipantIds}
                                    value={character.id}
                                    class="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-offset-0"
                                />
                                <div class="flex items-center space-x-3 flex-1">
                                    <Avatar {character} />
                                    <div>
                                        <h4 class="font-medium text-white">
                                            {character.name}
                                        </h4>
                                        <p
                                            class="text-xs text-gray-400 truncate max-w-48"
                                        >
                                            {character.prompt
                                                .split("\n")[0]
                                                .replace(/[#*-]/g, "")
                                                .trim()}
                                        </p>
                                    </div>
                                </div>
                            </label>
                        {/each}
                    </div>
                    <p class="text-xs text-gray-500 mt-2">
                        {t("groupChat.minimumParticipants")}
                    </p>
                </fieldset>
            </div>
            <div
                class="p-6 mt-auto border-t border-gray-700 shrink-0 flex justify-end space-x-3"
            >
                <button
                    on:click={closeModal}
                    class="flex-1 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-center"
                    >{t("common.cancel")}</button
                >
                <button
                    on:click={createGroupChat}
                    class="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-center"
                    >{t("common.create")}</button
                >
            </div>
        </div>
    </div>
{/if}
