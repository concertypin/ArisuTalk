<script>
    import { t } from "$root/i18n";
    import { get } from "svelte/store";
    import { characterStateStore } from "../../../../stores/character";
    import { checkSNSAccess } from "../../../../utils/sns.js";
    import { Lock, AlertTriangle } from "lucide-svelte";
    import SNSPost from "./SNSPost.svelte";

    export let character = null;
    export let isSecretMode = false;

    let secretPosts = [];

    $: {
        if (character && character.snsPosts) {
            secretPosts = character.snsPosts
                .filter(
                    (post) =>
                        post.access_level &&
                        (post.access_level.includes("private") ||
                            post.access_level.includes("secret"))
                )
                .map((post) => {
                    const hasAccess = checkSNSAccess(
                        character,
                        post.access_level || "public",
                        get(characterStateStore)[character.id]
                    );
                    return {
                        ...post,
                        content: hasAccess
                            ? post.content
                            : t("sns.lockedContent"),
                        isBlocked: !hasAccess,
                    };
                })
                .sort(
                    (a, b) =>
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime()
                );
        }
    }
</script>

{#if secretPosts.length === 0}
    <div class="text-center py-12 text-gray-400">
        <Lock class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>{t("sns.noSecretsAvailable")}</p>
    </div>
{:else}
    <div class="p-4 space-y-6">
        <div
            class="text-center py-2 text-red-400 text-xs border-b border-gray-800 mb-4"
        >
            <AlertTriangle class="w-4 h-4 inline mr-1" />
            {t("sns.secretPostsWarning")}
        </div>
        {#each secretPosts as post (post.id)}
            <SNSPost
                {post}
                {character}
                {isSecretMode}
                on:edit={(e) =>
                    window.personaApp.editSNSPost(
                        e.detail.characterId,
                        e.detail.postId
                    )}
                on:delete={(e) =>
                    window.personaApp.deleteSNSPost(
                        e.detail.characterId,
                        e.detail.postId
                    )}
            />
        {/each}
    </div>
{/if}
