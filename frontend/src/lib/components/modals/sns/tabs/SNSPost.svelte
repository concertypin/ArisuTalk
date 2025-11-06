<script>
    import { t } from "$root/i18n";
    import { createEventDispatcher } from "svelte";
    import {
        Heart,
        MessageCircle,
        Star,
        Lock,
        Edit3,
        Trash2,
    } from "lucide-svelte";

    export let post = null;
    export let character = null;
    export let isSecretMode = false;

    const dispatch = createEventDispatcher();

    function formatTimeAgo(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const diff = now.getTime() - past.getTime();

        if (diff < 60000) return t("sns.justNow");
        if (diff < 3600000)
            return t("sns.minutesAgo", { minutes: Math.floor(diff / 60000) });
        if (diff < 86400000)
            return t("sns.hoursAgo", { hours: Math.floor(diff / 3600000) });
        if (diff < 604800000)
            return t("sns.daysAgo", { days: Math.floor(diff / 86400000) });
        if (diff < 2592000000)
            return t("sns.weeksAgo", { weeks: Math.floor(diff / 604800000) });
        if (diff < 31536000000)
            return t("sns.monthsAgo", {
                months: Math.floor(diff / 2592000000),
            });

        return t("sns.yearsAgo", { years: Math.floor(diff / 31536000000) });
    }

    function getStickerUrl(character, stickerId) {
        if (!character.stickers) {
            return "";
        }

        // 문자열과 숫자 비교 모두 시도하여 스티커 찾기
        let sticker = character.stickers.find((s) => s.id === stickerId);
        if (!sticker) {
            // 타입 변환해서 재시도
            sticker = character.stickers.find((s) => s.id == stickerId); // == 사용 (타입 무시)
        }
        if (!sticker) {
            // 문자열로 변환해서 재시도
            sticker = character.stickers.find(
                (s) => String(s.id) === String(stickerId)
            );
        }

        if (!sticker) {
            return "";
        }

        // 메인 채팅과 동일한 방식으로 data 또는 dataUrl 사용
        return sticker.data || sticker.dataUrl || "";
    }

    function handleEdit() {
        dispatch("edit", { characterId: character.id, postId: post.id });
    }

    function handleDelete() {
        dispatch("delete", { characterId: character.id, postId: post.id });
    }
</script>

<div
    class="bg-gray-800/90 backdrop-blur-sm rounded-xl overflow-hidden relative group hover:shadow-lg transition-all duration-200 border border-gray-700/50"
    data-post-id={post.id}
>
    {#if character?.hypnosis?.enabled && character?.hypnosis?.sns_edit_access}
        <div
            class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 flex space-x-2"
        >
            <button
                on:click={handleEdit}
                class="p-2 rounded-full bg-gray-800 hover:bg-blue-600 transition-colors"
                title="포스트 편집"
            >
                <Edit3 class="w-4 h-4 text-gray-300" />
            </button>
            <button
                on:click={handleDelete}
                class="p-2 rounded-full bg-gray-800 hover:bg-red-600 transition-colors"
                title="포스트 삭제"
            >
                <Trash2 class="w-4 h-4 text-gray-300" />
            </button>
        </div>
    {/if}

    {#if post.image}
        <img
            src={post.image}
            alt="Post content"
            class="w-full h-64 object-cover"
        />
    {/if}

    <div class="p-4">
        <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-3">
                <Heart class="w-5 h-5 text-red-500" />
                <span class="text-sm text-gray-400"
                    >{post.likes} {t("sns.likes")}</span
                >
                <MessageCircle class="w-5 h-5 text-gray-400" />
                <span class="text-sm text-gray-400"
                    >{post.comments} {t("sns.comments")}</span
                >
                {#if post.importance}
                    <div class="flex items-center space-x-1">
                        <Star class="w-4 h-4 text-yellow-500" />
                        <span class="text-xs text-yellow-400"
                            >{post.importance}</span
                        >
                    </div>
                {/if}
            </div>
            <span class="text-xs text-gray-500"
                >{formatTimeAgo(post.timestamp)}</span
            >
        </div>

        <div class="sns-post-content">
            {#if post.stickerId}
                <div class="mb-6 flex justify-center">
                    <div class="bg-gray-700 rounded-xl p-6 max-w-sm w-full">
                        <img
                            src={getStickerUrl(character, post.stickerId)}
                            alt="Sticker"
                            class="w-full h-auto max-w-xs max-h-60 object-contain mx-auto"
                        />
                    </div>
                </div>
            {/if}
            <p class="text-gray-300 text-sm leading-relaxed">
                {post.content || post.caption || ""}
            </p>
        </div>

        {#if post.tags && post.tags.length > 0}
            <div class="mt-3 flex flex-wrap gap-1">
                {#each post.tags as tag}
                    <span
                        class="px-2 py-1 bg-blue-900/30 text-blue-400 text-xs rounded-full"
                    >
                        #{tag}
                    </span>
                {/each}
            </div>
        {/if}

        {#if post.accessLevel && post.accessLevel !== "main-public"}
            <div
                class="mt-2 text-xs {isSecretMode
                    ? 'text-red-400'
                    : 'text-pink-400'}"
            >
                <Lock class="w-3 h-3 inline mr-1" />
                {t(`sns.accessLevel.${post.accessLevel}`) || post.accessLevel}
            </div>
        {/if}
    </div>
</div>
