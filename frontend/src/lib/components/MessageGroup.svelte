<script>
  import Avatar from "./Avatar.svelte";
  import MessageBubble from "./MessageBubble.svelte";
  import {
    isWaitingForResponse,
    typingCharacterId,
    editingMessageId,
  } from "../stores/chat";
  import { Edit3, Trash2, RefreshCw, Newspaper, Image } from "lucide-svelte";
  import { t } from "../../i18n.js";
  import {
    deleteMessageGroup,
    editMessage,
    saveEditedMessage,
    rerollMessage,
    generateSnsPost,
  } from "../services/chatService";

  export let group;
  export let isLastGroup;

  const { messages, isMe, showSenderInfo, character } = group;
  const lastMessage = messages[messages.length - 1];

  const canEdit = isMe;
  $: canReroll = !isMe && isLastGroup && !$isWaitingForResponse;
  $: canGenerateExtra = canReroll;

  let editedContent = messages.map((m) => m.content).join("\n");

  $: showUnread =
    isMe && isLastGroup && $isWaitingForResponse && !$typingCharacterId;

  function handleEdit() {
    editMessage(lastMessage.id);
  }

  function handleDelete() {
    deleteMessageGroup(lastMessage.id);
  }

  function handleSaveEdit() {
    saveEditedMessage(lastMessage.id, editedContent);
  }

  function handleCancelEdit() {
    editingMessageId.set(null);
  }

  function handleReroll() {
    rerollMessage(lastMessage.id);
  }
  function handleGenerateSns() {
    generateSnsPost(lastMessage.id);
  }
  function handleGenerateNai() {
    alert("NAI sticker generation is not implemented yet.");
  }
</script>

{#if $editingMessageId === lastMessage.id}
  <div class="flex flex-col {isMe ? 'items-end' : 'items-start'}">
    <textarea
      bind:value={editedContent}
      class="edit-message-textarea w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500/50 text-sm"
      rows="3"
    ></textarea>
    <div class="flex items-center space-x-2 mt-2">
      <button
        on:click={handleCancelEdit}
        class="text-xs text-gray-400 hover:text-white"
        >{t("common.cancel")}</button
      >
      <button
        on:click={handleSaveEdit}
        class="text-xs text-blue-400 hover:text-blue-300"
        >{t("common.save")}</button
      >
    </div>
  </div>
{:else}
  <div
    class="group flex w-full items-start gap-3 {isMe ? 'flex-row-reverse' : ''}"
  >
    {#if !isMe}
      <div class="shrink-0 w-10 h-10 mt-1">
        {#if showSenderInfo && character}
          <Avatar {character} size="sm" />
        {/if}
      </div>
    {/if}

    <div
      class="flex flex-col {isMe
        ? 'w-full'
        : 'max-w-[70%] sm:max-w-[75%]'} {isMe ? 'items-end' : 'items-start'}"
    >
      {#if showSenderInfo && character}
        <p class="text-sm text-gray-400 mb-1">{character.name}</p>
      {/if}

      <div
        class="message-content-wrapper flex flex-col gap-0.5 {isMe
          ? 'items-end'
          : 'items-start'}"
      >
        {#each messages as msg, i (msg.id)}
          {#if i === messages.length - 1}
            <div class="flex items-end gap-2 {isMe ? 'flex-row-reverse' : ''}">
              {#if showUnread}
                <span class="text-sm text-yellow-400 self-end mb-0.5">1</span>
              {/if}
              <MessageBubble message={msg} />
              <p class="text-xs text-gray-500 shrink-0 self-end">
                {lastMessage.time}
              </p>
            </div>
          {:else}
            <MessageBubble message={msg} />
          {/if}
        {/each}
      </div>

      <div
        class="flex items-center gap-2 mt-1.5 h-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 {isMe
          ? 'justify-end'
          : ''}"
      >
        {#if canEdit}
          <button
            on:click={handleEdit}
            class="text-gray-500 hover:text-white"
            title={t("common.edit")}
          >
            <Edit3 class="w-3 h-3" />
          </button>
        {/if}
        <button
          on:click={handleDelete}
          class="text-gray-500 hover:text-white"
          title={t("common.delete")}
        >
          <Trash2 class="w-3 h-3" />
        </button>
        {#if canReroll}
          <button
            on:click={handleReroll}
            class="text-gray-500 hover:text-white"
            title={t("mainChat.regenerateMessage")}
          >
            <RefreshCw class="w-3 h-3" />
          </button>
        {/if}
        {#if canGenerateExtra}
          <button
            on:click={handleGenerateSns}
            class="text-gray-500 hover:text-white"
            title={t("mainChat.generateSNS")}
          >
            <Newspaper class="w-3 h-3" />
          </button>
          <button
            on:click={handleGenerateNai}
            class="text-gray-500 hover:text-white"
            title={t("mainChat.generateNAI")}
          >
            <Image class="w-3 h-3" />
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}
