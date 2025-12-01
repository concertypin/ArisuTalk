<script lang="ts">
import { derived } from "svelte/store";
import { onMount, afterUpdate, onDestroy } from "svelte";
import { slide } from "svelte/transition";
import {
    Menu,
    Send,
    Paperclip,
    X,
    Mic,
    Image as ImageIcon,
    Bot,
    ArrowLeft,
    Globe,
    Users,
    Instagram,
    Phone,
    Video,
    BarChart3,
    Plus,
    Smile,
    MessageCircle,
} from "lucide-svelte";
import { nanoid } from "nanoid";
import { t } from "$root/i18n";

import {
    selectedChatId,
    messages,
    isWaitingForResponse,
    imageToSend,
    stickerToSend,
    chatRooms,
    groupChats,
    openChats,
    typingCharacterId,
    virtualStream,
} from "../stores/chat";
import { settings } from "../stores/settings";
import { characters } from "../stores/character";
import {
    isSidebarCollapsed,
    isDebugLogModalVisible,
    isSNSFeedModalVisible,
    isInputOptionsVisible,
    isUserStickerPanelVisible,
    snsFeedCharacter,
} from "../stores/ui";
import { sendMessage } from "../services/chatService";
import {
    initializeOpenChat,
    updateParticipantStates,
} from "../services/openChatService";
import { chatType, selectedChat, selectedCharacter } from "../stores/derived";

import Avatar from "./Avatar.svelte";
import MessageGroup from "./MessageGroup.svelte";
import UserStickerPanel from "./UserStickerPanel.svelte";

let messagesContainer: HTMLElement;
let imageUploadInput: HTMLInputElement;
let messageInput = "";
let imageCaption = "";
const participants = derived(
    [chatType, selectedChatId, openChats, characters],
    ([$chatType, $selectedChatId, $openChats, $characters]) => {
        if (
            $chatType === "open" &&
            $selectedChatId &&
            $openChats[$selectedChatId]
        ) {
            const participantIds =
                $openChats[$selectedChatId].currentParticipants || [];
            return participantIds
                .map((id) => $characters.find((c) => c.id === id))
                .filter(Boolean);
        }
        return [];
    },
);
let isAtBottom = true;
let participantUpdateInterval: number;

function checkScrollPosition() {
    if (!messagesContainer) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
    isAtBottom = scrollHeight - scrollTop - clientHeight < 5; // Increased tolerance
}

onMount(() => {
    checkScrollPosition();
});

afterUpdate(() => {
    checkScrollPosition();
});

$: {
    if (participantUpdateInterval) {
        clearInterval(participantUpdateInterval);
        participantUpdateInterval = null;
    }
    if ($chatType === "open" && $selectedChatId) {
        const chat = $openChats[$selectedChatId];
        if (chat && chat.participantHistory.length === 0) {
            initializeOpenChat($selectedChatId);
        }

        participantUpdateInterval = setInterval(() => {
            updateParticipantStates($selectedChatId);
        }, 30000);
    }
}

onDestroy(() => {
    if (participantUpdateInterval) {
        clearInterval(participantUpdateInterval);
    }
});

$: chatMessages = $messages[$selectedChatId] || [];
$: allRooms = [
    ...Object.values($chatRooms).flat(),
    ...Object.values($groupChats),
    ...Object.values($openChats),
];
$: selectedRoom = allRooms.find((room) => room.id === $selectedChatId);
$: character = selectedRoom
    ? selectedRoom.type === "group" || selectedRoom.type === "open"
        ? {
              id: `${selectedRoom.type}_chat_avatar`,
              name: selectedRoom.name,
              avatar: "",
          }
        : $characters.find((c) => c.id === selectedRoom.characterId)
    : null;

const getSenderId = (msg) => {
    if (msg.isMe) return "user";
    if (msg.type === "system") return "system";
    return msg.characterId;
};

const createMessageGroups = (msgs) => {
    if (!msgs || msgs.length === 0) {
        return [];
    }

    const groups = [];
    let i = 0;
    while (i < msgs.length) {
        const currentMessage = msgs[i];
        const senderId = getSenderId(currentMessage);

        let endIndex = i;
        while (endIndex < msgs.length - 1) {
            if (getSenderId(msgs[endIndex + 1]) !== senderId) {
                break;
            }
            endIndex++;
        }

        const groupMessages = msgs.slice(i, endIndex + 1);
        const firstMessage = groupMessages[0];
        const senderCharacter = firstMessage.characterId
            ? $characters.find((c) => c.id === firstMessage.characterId)
            : character;

        groups.push({
            id: firstMessage.id,
            messages: groupMessages,
            isMe: firstMessage.isMe,
            showSenderInfo:
                !firstMessage.isMe && firstMessage.type !== "system",
            character: senderCharacter,
        });

        i = endIndex + 1;
    }
    return groups;
};

$: messageGroups = createMessageGroups(chatMessages);
$: virtualMessageGroups =
    $virtualStream.isStreaming && $virtualStream.chatId === $selectedChatId
        ? createMessageGroups($virtualStream.messages)
        : [];

$: typingIndicatorInfo =
    $typingCharacterId && $typingCharacterId.chatId === $selectedChatId
        ? $typingCharacterId
        : null;
$: typingCharacter = typingIndicatorInfo
    ? $characters.find((c) => c.id === typingIndicatorInfo.characterId)
    : null;
$: virtualTypingCharacter =
    $virtualStream.isTyping && $virtualStream.chatId === $selectedChatId
        ? $characters.find((c) => c.id === $virtualStream.characterId)
        : null;

async function handleSendMessage() {
    let content = messageInput;
    let type = "text";
    let payload = {};

    if ($imageToSend) {
        const imageId = nanoid();
        const match = $imageToSend.match(
            /^data:(image\/[a-zA-Z]+);base64,(.*)$/,
        );
        const mimeType = match ? match[1] : "image/png";

        const newMedia = {
            id: imageId,
            mimeType: mimeType,
            dataUrl: $imageToSend,
        };

        // Update character
        characters.update((allChars) => {
            const charIndex = allChars.findIndex((c) => c.id === character.id);
            if (charIndex !== -1) {
                const updatedChar = { ...allChars[charIndex] };
                if (!updatedChar.media) {
                    updatedChar.media = [];
                }
                updatedChar.media.push(newMedia);
                allChars[charIndex] = updatedChar;
            }
            return allChars;
        });

        content = imageCaption;
        type = "image";
        payload = { imageId: imageId, imageUrl: $imageToSend }; // Keep imageUrl for rendering
    } else if ($stickerToSend) {
        type = "sticker";
        payload = { sticker: $stickerToSend, content: content }; // Pass text content along with sticker
    }

    if (!content.trim() && type === "text" && !$imageToSend && !$stickerToSend)
        return;

    const contentToSend = content;
    const typeToSend = type;
    const payloadToSend = payload;

    messageInput = "";
    imageCaption = "";
    imageToSend.set(null);
    stickerToSend.set(null);

    await sendMessage(contentToSend, typeToSend, payloadToSend);
}

function openDebugLogs() {
    isDebugLogModalVisible.set(true);
}

function openSNSModal() {
    if (
        character &&
        selectedRoom.type !== "open" &&
        selectedRoom.type !== "group"
    ) {
        snsFeedCharacter.set(character);
        isSNSFeedModalVisible.set(true);
    }
}

function handleDummyClick() {
    console.log("This feature is not yet migrated.");
}

function toggleInputOptions() {
    isUserStickerPanelVisible.set(false);
    isInputOptionsVisible.update((v) => !v);
}

function toggleStickerPanel() {
    isInputOptionsVisible.set(false);
    isUserStickerPanelVisible.update((v) => !v);
}

function openImageUpload() {
    imageUploadInput.click();
    isInputOptionsVisible.set(false);
}

function handleImageFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        imageToSend.set(e.target.result);
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    imageToSend.set(null);
    imageCaption = "";
}

function removeSticker() {
    stickerToSend.set(null);
}
</script>

<div
    id="main-chat-area"
    class="w-full h-full absolute top-0 left-0 flex flex-col bg-gray-950"
>
    {#if character}
        <header
            class="py-4 pl-6 pr-4 bg-gray-900/80 border-b border-gray-800 glass-effect flex items-center justify-between z-10"
        >
            <div class="flex items-center space-x-3 md:space-x-4">
                <button
                    on:click={() => selectedChatId.set(null)}
                    class="p-2 -ml-2 text-gray-300 md:hidden"
                >
                    <ArrowLeft class="w-6 h-6" />
                </button>
                {#if selectedRoom.type === "open"}
                    <div
                        class="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center"
                    >
                        <Globe class="w-6 h-6 text-white" />
                    </div>
                {:else if selectedRoom.type === "group"}
                    <div
                        class="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center"
                    >
                        <Users class="w-6 h-6 text-white" />
                    </div>
                {:else}
                    <Avatar {character} size="sm" />
                {/if}
                <div>
                    {#if $chatType === "regular" && $selectedCharacter}
                        <h2 class="text-lg font-semibold">
                            {$selectedCharacter.name}
                        </h2>
                        <p
                            class="text-xs text-gray-400 flex items-center gap-1.5"
                        >
                            <MessageCircle class="w-4 h-4" />
                            <span>{$selectedChat.name}</span>
                        </p>
                    {:else if $selectedChat}
                        <h2 class="text-lg font-semibold">
                            {$selectedChat.name}
                        </h2>
                        {#if $chatType === "open"}
                            <p class="text-xs text-gray-400">
                                {$participants.length}명 접속중
                                {#if $participants.length > 0}
                                    ({$participants
                                        .map((p) => p.name)
                                        .join(", ")})
                                {/if}
                            </p>
                        {/if}
                    {/if}
                </div>
            </div>
            <div class="flex items-center space-x-1 md:space-x-2">
                <button
                    on:click={openSNSModal}
                    class="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                    disabled={selectedRoom.type === "open" ||
                        selectedRoom.type === "group"}
                >
                    <Instagram class="w-4 h-4 text-gray-300" />
                </button>
                <button
                    on:click={handleDummyClick}
                    class="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                    <Phone class="w-4 h-4 text-gray-300" />
                </button>
                <button
                    on:click={handleDummyClick}
                    class="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                    <Video class="w-4 h-4 text-gray-300" />
                </button>
                <button
                    on:click={openDebugLogs}
                    class="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                    <BarChart3 class="w-4 h-4 text-gray-300" />
                </button>
            </div>
        </header>

        <div
            id="messages-container"
            class="flex-1 overflow-y-auto px-4 pt-4 pb-24 sm:px-6 sm:pt-6 sm:pb-28 space-y-4"
            bind:this={messagesContainer}
            on:scroll={checkScrollPosition}
        >
            {#each messageGroups as group, i (group.id)}
                {#if group.messages[0].type === "system"}
                    <div class="w-full text-center text-xs text-gray-500 my-2">
                        {#each group.messages as msg (msg.id)}
                            <p>{msg.content}</p>
                        {/each}
                    </div>
                {:else}
                    <MessageGroup
                        {group}
                        isLastGroup={i === messageGroups.length - 1}
                    />
                {/if}
            {/each}

            <!-- Virtual Stream Rendering -->
            {#if $virtualStream.isStreaming && $virtualStream.chatId === $selectedChatId}
                {#each virtualMessageGroups as group, i (group.id)}
                    <MessageGroup
                        {group}
                        isLastGroup={i === virtualMessageGroups.length - 1}
                    />
                {/each}

                {#if virtualTypingCharacter}
                    <div class="flex items-start gap-3 animate-slideUp">
                        <div class="shrink-0 w-10 h-10 mt-1">
                            <Avatar
                                character={virtualTypingCharacter}
                                size="sm"
                            />
                        </div>
                        <div class="px-4 py-3 rounded-2xl bg-gray-700">
                            <div class="flex items-center space-x-1">
                                <span
                                    class="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                                    style="animation-delay: 0s"
                                ></span>
                                <span
                                    class="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                                    style="animation-delay: 0.2s"
                                ></span>
                                <span
                                    class="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                                    style="animation-delay: 0.4s"
                                ></span>
                            </div>
                        </div>
                    </div>
                {/if}
            {/if}

            {#if typingIndicatorInfo && typingCharacter && !$virtualStream.isStreaming}
                <div class="flex items-start gap-3 animate-slideUp">
                    <div class="shrink-0 w-10 h-10 mt-1">
                        <Avatar character={typingCharacter} size="sm" />
                    </div>
                    <div class="px-4 py-3 rounded-2xl bg-gray-700">
                        <div class="flex items-center space-x-1">
                            <span
                                class="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                                style="animation-delay: 0s"
                            ></span>
                            <span
                                class="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                                style="animation-delay: 0.2s"
                            ></span>
                            <span
                                class="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                                style="animation-delay: 0.4s"
                            ></span>
                        </div>
                    </div>
                </div>
            {/if}

            <div id="messages-end-ref"></div>
        </div>

        <div
            id="input-area-wrapper"
            class="px-4 pb-4 pt-2"
            class:scrolled-to-bottom={isAtBottom}
        >
            {#if $isInputOptionsVisible}
                <div
                    class="absolute bottom-full left-0 mb-2 w-48 rounded-xl shadow-lg p-2 floating-panel"
                >
                    <button
                        on:click={openImageUpload}
                        class="w-full flex items-center gap-3 px-3 py-2 text-sm text-left rounded-lg hover:bg-gray-600"
                    >
                        <Image class="w-4 h-4" />
                        {t("mainChat.uploadPhoto")}
                    </button>
                    <input
                        type="file"
                        accept="image/png,image/jpeg"
                        bind:this={imageUploadInput}
                        on:change={handleImageFileChange}
                        class="hidden"
                    />
                </div>
            {/if}
            {#if $imageToSend}
                <div class="relative mb-2 p-2 bg-gray-800 rounded-lg">
                    <img
                        src={$imageToSend}
                        alt="Preview"
                        class="max-h-40 rounded-md"
                    />
                    <button
                        on:click={removeImage}
                        class="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white"
                    >
                        <X class="w-4 h-4" />
                    </button>
                    <input
                        bind:value={imageCaption}
                        type="text"
                        placeholder={t("mainChat.addCaption")}
                        class="w-full mt-2 px-3 py-2 bg-gray-700 text-white rounded-lg border-0 text-sm"
                    />
                </div>
            {/if}
            {#if $stickerToSend}
                <div
                    class="relative mb-2 p-2 bg-gray-800 rounded-lg flex items-center gap-2"
                >
                    <img
                        src={$stickerToSend.data}
                        alt="Sticker preview"
                        class="h-16 w-auto rounded-md"
                    />
                    <p class="text-sm text-gray-300">
                        {t("mainChat.stickerLabel")}
                        {$stickerToSend.name}
                    </p>
                    <button
                        on:click={removeSticker}
                        class="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white"
                    >
                        <X class="w-4 h-4" />
                    </button>
                </div>
            {/if}
            <div class="flex items-center gap-3">
                <button
                    id="open-input-options-btn"
                    on:click={toggleInputOptions}
                    class="flex-shrink-0 hover:bg-gray-600 text-white rounded-full h-[44px] w-[44px] flex items-center justify-center"
                    disabled={$imageToSend || $stickerToSend}
                >
                    <Plus class="w-5 h-5" />
                </button>
                <textarea
                    id="new-message-input"
                    bind:value={messageInput}
                    on:keydown={(e) =>
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        (e.preventDefault(), handleSendMessage())}
                    placeholder={$stickerToSend
                        ? t("mainChat.stickerMessagePlaceholder")
                        : t("mainChat.messagePlaceholder")}
                    class="flex-1 self-center pl-5 pr-5 py-3 text-white rounded-full resize-none"
                    rows="1"
                    disabled={$imageToSend}
                ></textarea>
                <button
                    id="sticker-btn"
                    on:click={toggleStickerPanel}
                    class="flex-shrink-0 hover:bg-gray-600 text-white rounded-full h-[44px] w-[44px] flex items-center justify-center"
                    disabled={$imageToSend}
                >
                    <Smile class="w-5 h-5" />
                </button>
                <button
                    id="send-message-btn"
                    on:click={handleSendMessage}
                    disabled={$isWaitingForResponse}
                    class="flex-shrink-0 hover:bg-blue-700 text-white rounded-full disabled:opacity-50 h-[44px] w-[44px] flex items-center justify-center"
                >
                    <Send class="w-5 h-5" />
                </button>
            </div>
            {#if $isUserStickerPanelVisible}
                <UserStickerPanel />
            {/if}
        </div>
    {:else}
        <!-- Should not happen if selectedChatId is valid, but as a fallback -->
        <div class="flex-1 flex items-center justify-center">Select a chat</div>
    {/if}
</div>
