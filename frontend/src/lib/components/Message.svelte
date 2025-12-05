<script lang="ts">
    import { t } from "$root/i18n";
    import Avatar from "./Avatar.svelte";
    import { isImageZoomModalVisible, imageZoomModalData } from "../stores/ui";

    export let message;
    export let showSenderInfo = false;

    function openImageZoom() {
        if (message.type === "image" || message.type === "sticker") {
            const imageUrl =
                message.type === "sticker"
                    ? message.sticker.data
                    : message.imageUrl;
            const title =
                message.type === "sticker"
                    ? message.sticker.stickerName
                    : t("mainChat.uploadPhoto");
            imageZoomModalData.set({ imageUrl, title });
            isImageZoomModalVisible.set(true);
        }
    }
</script>

<div class="flex items-start gap-3" class:justify-end={message.isMe}>
    {#if showSenderInfo}
        <Avatar character={message.sender} size="xs" />
    {/if}
    <div class="flex flex-col" class:items-end={message.isMe}>
        {#if showSenderInfo}
            <span class="text-sm text-gray-400 ml-2 mb-1"
                >{message.sender.name}</span
            >
        {/if}
        <div
            class="max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl break-words"
            class:bg-blue-600={message.isMe}
            class:text-white={message.isMe}
            class:bg-gray-700={!message.isMe}
            class:text-gray-200={!message.isMe}
        >
            {#if message.type === "image"}
                <img
                    src={message.imageUrl}
                    alt="user upload"
                    class="rounded-lg max-w-full h-auto cursor-pointer"
                    on:click={openImageZoom}
                />
                {#if message.content}
                    <p class="mt-2">{message.content}</p>
                {/if}
            {:else if message.type === "sticker"}
                <div
                    class="flex flex-col items-center cursor-pointer"
                    on:click={openImageZoom}
                >
                    <img
                        src={message.sticker.data}
                        alt={message.sticker.stickerName}
                        class="max-w-[120px] h-auto"
                    />
                    {#if message.content}
                        <p class="mt-2 text-center">{message.content}</p>
                    {/if}
                </div>
            {:else}
                <p>{message.content}</p>
            {/if}
        </div>
        <span class="text-xs text-gray-500 mt-1 px-2">{message.time}</span>
    </div>
</div>
