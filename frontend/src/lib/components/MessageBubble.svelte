<script lang="ts">
    import { t } from "$root/i18n";
    import type { Message } from "$types/chat";

    import { expandedImages } from "../stores/ui";

    export let message: Message;

    function toggleImageSize() {
        expandedImages.update((set) => {
            if (set.has(message.id)) {
                set.delete(message.id);
            } else {
                set.add(message.id);
            }
            return set;
        });
    }

    $: isExpanded = $expandedImages.has(message.id);
    $: sizeStyle = isExpanded
        ? "width: 400px; max-width: none; max-height: 720px;"
        : "width: 200px; max-width: 200px; max-height: 320px;";
</script>

{#if message.type === "image"}
    <div class="flex flex-col {message.isMe ? 'items-end' : 'items-start'}">
        <button
            class="inline-block transition-all duration-300 rounded-2xl overflow-hidden"
            on:click={toggleImageSize}
            aria-label="Toggle image size"
        >
            <img
                src={message.imageUrl}
                alt="user upload"
                class="rounded-2xl object-cover pointer-events-none"
                style={sizeStyle}
            />
        </button>
        {#if message.content}
            <div
                class="mt-2 inline-block px-4 py-2 rounded-2xl text-sm md:text-base leading-relaxed break-words {message.isMe
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-200'}"
            >
                <p>{message.content}</p>
            </div>
        {/if}
    </div>
{:else if message.type === "sticker"}
    <div
        class="inline-block px-4 py-2 rounded-2xl text-sm md:text-base leading-relaxed break-words {message.isMe
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-200'}"
    >
        {#if message.sticker}
            <button
                class="flex flex-col items-center"
                on:click={() => console.log("zoom sticker")}
                aria-label="Zoom sticker"
            >
                <img
                    src={message.sticker.data}
                    alt={message.sticker.name}
                    class="max-w-[120px] h-auto"
                />
                {#if message.content}
                    <p class="mt-2 text-center">{message.content}</p>
                {/if}
            </button>
        {/if}
    </div>
{:else}
    <div
        class="inline-block px-4 py-2 rounded-2xl text-sm md:text-base leading-relaxed break-words {message.isError
            ? 'bg-red-500 text-white'
            : message.isMe
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-200'}"
    >
        <p>{message.content}</p>
    </div>
{/if}
