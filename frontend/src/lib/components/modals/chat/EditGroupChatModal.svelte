<script>
  import { t } from "../../../../i18n.js";
  import { characters } from "../../../stores/character";
  import { groupChats, editingGroupChat } from "../../../stores/chat";
  import { isEditGroupChatModalVisible } from "../../../stores/ui";
  import { X, Users } from "lucide-svelte";
  import { fade } from "svelte/transition";
  import { onMount, onDestroy } from "svelte";
  import Avatar from "../../Avatar.svelte";

  let chatName = "";
  let responseFrequency = 50;
  let maxRespondingCharacters = 1;
  let responseDelay = 3;
  let participantSettings = {};

  let participants = [];

  editingGroupChat.subscribe((chat) => {
    if (chat) {
      participants = chat.participantIds
        .map((id) => $characters.find((c) => c.id === id))
        .filter(Boolean);
      chatName = chat.name;
      responseFrequency = Math.round(
        (chat.settings.responseFrequency || 0.5) * 100,
      );
      maxRespondingCharacters = chat.settings.maxRespondingCharacters || 1;
      responseDelay = Math.round((chat.settings.responseDelay || 3000) / 1000);

      // Deep copy participant settings to avoid direct store mutation
      participantSettings = JSON.parse(
        JSON.stringify(chat.settings.participantSettings || {}),
      );

      // Ensure all participants have a settings object
      for (const p of participants) {
        if (!participantSettings[p.id]) {
          participantSettings[p.id] = {
            isActive: true,
            responseProbability: 0.9,
            characterRole: "normal",
          };
        }
      }
    }
  });

  function closeModal() {
    isEditGroupChatModalVisible.set(false);
    editingGroupChat.set(null);
  }

  function saveChanges() {
    if (!$editingGroupChat) return;

    const updatedSettings = {
      responseFrequency: responseFrequency / 100,
      maxRespondingCharacters: parseInt(maxRespondingCharacters, 10),
      responseDelay: responseDelay * 1000,
      participantSettings: participantSettings,
    };

    groupChats.update((chats) => {
      const chatToUpdate = chats[$editingGroupChat.id];
      if (chatToUpdate) {
        chatToUpdate.name = chatName;
        chatToUpdate.settings = updatedSettings;
      }
      return chats;
    });

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

{#if $editingGroupChat}
  <div
    transition:fade={{ duration: 200 }}
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
  >
    <div
      role="dialog"
      aria-modal="true"
      tabindex="0"
      aria-labelledby="edit-group-chat-title"
      class="bg-gray-800 rounded-2xl w-full max-w-2xl mx-auto my-auto flex flex-col max-h-[90vh]"
      on:click|stopPropagation
      on:keydown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
        }
      }}
    >
      <div
        class="flex items-center justify-between p-6 border-b border-gray-700 shrink-0 sticky top-0 bg-gray-800 z-10"
      >
        <h3
          id="edit-group-chat-title"
          class="text-xl font-semibold text-white flex items-center gap-3"
        >
          <Users class="w-6 h-6" />
          {t("groupChat.groupChatSettings")}
        </h3>
        <button
          on:click={closeModal}
          class="p-1 hover:bg-gray-700 rounded-full"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-6 space-y-6 overflow-y-auto">
        <!-- Chat Name -->
        <div>
          <label
            for="group-chat-name"
            class="block text-sm font-medium text-gray-300 mb-2"
            >{t("groupChat.groupChatName")}</label
          >
          <input
            id="group-chat-name"
            bind:value={chatName}
            type="text"
            class="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <!-- General Settings -->
        <div class="space-y-4 pt-4 border-t border-gray-700/50">
          <h3 class="text-lg font-semibold text-white">
            {t("groupChat.responseSettings")}
          </h3>
          <div>
            <label
              for="response-frequency"
              class="block text-sm font-medium text-gray-300 mb-2"
            >
              {t("groupChat.overallResponseFrequency")} ({responseFrequency}%)
            </label>
            <input
              id="response-frequency"
              type="range"
              bind:value={responseFrequency}
              min="0"
              max="100"
              class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              on:input={(e) => (responseFrequency = parseInt(e.target.value))}
            />
            <p class="text-xs text-gray-400 mt-1">
              {t("groupChat.responseFrequencyInfo")}
            </p>
          </div>
          <div>
            <label
              for="max-responders"
              class="block text-sm font-medium text-gray-300 mb-2"
              >{t("groupChat.maxSimultaneousResponders")}</label
            >
            <select
              id="max-responders"
              bind:value={maxRespondingCharacters}
              class="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600"
            >
              <option value={1}>{t("groupChat.people1")}</option>
              <option value={2}>{t("groupChat.people2")}</option>
              <option value={3}>{t("groupChat.people3")}</option>
              <option value={4}>{t("groupChat.people4")}</option>
            </select>
          </div>
          <div>
            <label
              for="response-delay"
              class="block text-sm font-medium text-gray-300 mb-2"
            >
              {t("groupChat.responseInterval")} ({responseDelay}
              {t("groupChat.seconds")})
            </label>
            <input
              id="response-delay"
              type="range"
              bind:value={responseDelay}
              min="1"
              max="10"
              class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              on:input={(e) => (responseDelay = parseInt(e.target.value))}
            />
            <p class="text-xs text-gray-400 mt-1">
              {t("groupChat.responseIntervalInfo")}
            </p>
          </div>
        </div>

        <!-- Participant Settings -->
        <div class="space-y-4 pt-4 border-t border-gray-700/50">
          <h3 class="text-lg font-semibold text-white">
            {t("groupChat.individualCharacterSettings")}
          </h3>
          <div class="space-y-4">
            {#each participants as participant (participant.id)}
              {@const settings = participantSettings[participant.id]}
              <div class="bg-gray-700/50 p-4 rounded-lg">
                <div class="flex items-center gap-3 mb-4">
                  <Avatar character={participant} size="sm" />
                  <h4 class="font-medium text-white">{participant.name}</h4>
                </div>
                <div class="space-y-4">
                  <div class="flex items-center gap-3">
                    <input
                      type="checkbox"
                      bind:checked={settings.isActive}
                      id={`active-${participant.id}`}
                      class="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                    />
                    <label
                      for={`active-${participant.id}`}
                      class="text-sm text-gray-300"
                      >{t("groupChat.responseEnabled")}</label
                    >
                  </div>
                  <div>
                    <label
                      for={`response-prob-${participant.id}`}
                      class="block text-sm text-gray-300 mb-1"
                    >
                      {t("groupChat.individualResponseProbability")} ({Math.round(
                        settings.responseProbability * 100,
                      )}%)
                    </label>
                    <input
                      id={`response-prob-${participant.id}`}
                      type="range"
                      bind:value={settings.responseProbability}
                      min="0"
                      max="1"
                      step="0.01"
                      class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                      on:input={(e) =>
                        (settings.responseProbability = parseFloat(
                          e.target.value,
                        ))}
                    />
                  </div>
                  <div>
                    <label
                      for={`role-${participant.id}`}
                      class="block text-sm text-gray-300 mb-1"
                      >{t("groupChat.characterRole")}</label
                    >
                    <select
                      id={`role-${participant.id}`}
                      bind:value={settings.characterRole}
                      class="w-full p-2 bg-gray-600 text-white rounded border border-gray-500 text-sm"
                    >
                      <option value="normal">{t("groupChat.roleNormal")}</option
                      >
                      <option value="leader">{t("groupChat.roleLeader")}</option
                      >
                      <option value="quiet">{t("groupChat.roleQuiet")}</option>
                      <option value="active">{t("groupChat.roleActive")}</option
                      >
                    </select>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <div
        class="p-6 mt-auto border-t border-gray-700 shrink-0 flex justify-end space-x-3 sticky bottom-0 bg-gray-800 z-10"
      >
        <button
          on:click={closeModal}
          class="flex-1 md:flex-none py-2.5 px-6 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-center"
          >{t("common.cancel")}</button
        >
        <button
          on:click={saveChanges}
          class="flex-1 md:flex-none py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-center"
          >{t("common.save")}</button
        >
      </div>
    </div>
  </div>
{/if}
