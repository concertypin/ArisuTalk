<script>
    import { t } from "$root/i18n";
    import { Hash, Lock, EyeOff } from "@lucide/svelte";

    export let character = null;

    let allTags = [];

    $: {
        if (character && character.snsPosts) {
            const tagCounts = {};
            const tagLastUsed = {};
            const tagSecretStatus = {};

            character.snsPosts.forEach((post) => {
                if (post.tags && Array.isArray(post.tags)) {
                    post.tags.forEach((tag) => {
                        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                        const postTimestamp = new Date(
                            post.timestamp,
                        ).getTime();
                        if (
                            !tagLastUsed[tag] ||
                            postTimestamp > tagLastUsed[tag]
                        ) {
                            tagLastUsed[tag] = postTimestamp;
                        }
                        if (
                            post.access_level &&
                            post.access_level.includes("secret")
                        ) {
                            tagSecretStatus[tag] = true;
                        }
                    });
                }
            });

            allTags = Object.keys(tagCounts)
                .map((tagName) => ({
                    name: tagName,
                    count: tagCounts[tagName],
                    lastUsed: tagLastUsed[tagName] || Date.now(),
                    isSecret: tagSecretStatus[tagName] || false,
                }))
                .sort((a, b) => b.count - a.count);
        }
    }

    function formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;

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
</script>

{#if allTags.length === 0}
    <div class="text-center py-12 text-gray-400">
        <Hash class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>{t("sns.noTagsAvailable")}</p>
    </div>
{:else}
    <div class="p-4 space-y-4">
        <div
            class="text-center py-2 text-gray-400 text-xs border-b border-gray-800 mb-4"
        >
            {t("sns.tagsDescription")}
        </div>
        <div class="grid grid-cols-2 gap-3">
            {#each allTags as tag (tag.name)}
                {@const borderColor = tag.isSecret
                    ? "border-red-400/50"
                    : "border-blue-400/50"}
                {@const textColor = tag.isSecret
                    ? "text-red-400"
                    : "text-blue-400"}
                {@const bgColor = tag.isSecret
                    ? "bg-red-900/20"
                    : "bg-blue-900/20"}
                <div
                    class="tag-card {bgColor} border {borderColor} rounded-lg p-3 cursor-pointer hover:bg-opacity-30 transition-all"
                >
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center space-x-1">
                            {#if tag.isSecret}
                                <Lock class="w-3 h-3 {textColor}" />
                            {:else}
                                <Hash class="w-3 h-3 {textColor}" />
                            {/if}
                            <span class="text-sm font-medium text-white"
                                >{tag.name}</span
                            >
                        </div>
                        {#if tag.isSecret}
                            <EyeOff class="w-3 h-3 {textColor}" />
                        {/if}
                    </div>

                    <div class="text-xs text-gray-400 space-y-1">
                        <div>{t("sns.postsCount", { count: tag.count })}</div>
                        <div class="opacity-75">
                            {formatTimeAgo(tag.lastUsed)}
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    </div>
{/if}
