<script lang="ts">
    import { t } from "$root/i18n";
    import { get } from "svelte/store";
    import { characterStateStore } from "../../../../stores/character";
    import { checkSNSAccess } from "../../../../utils/sns";
    import { Image } from "lucide-svelte";
    import SNSPost from "./SNSPost.svelte";
    import type { Character, SNSPost as SNSPostType } from "$types/character";

    export let character: Character | null = null;
    export let isSecretMode = false;

    let posts: (SNSPostType & { isBlocked?: boolean })[] = [];

    $: {
        if (character && character.snsPosts) {
            posts = character.snsPosts
                .filter((post) => {
                    const accessLevel = post.accessLevel || post.access_level;
                    if (isSecretMode) {
                        return (
                            accessLevel &&
                            (accessLevel.includes("private") ||
                                accessLevel.includes("secret"))
                        );
                    } else {
                        return (
                            !accessLevel ||
                            accessLevel === "main-public"
                        );
                    }
                })
                .map((post) => {
                    const accessLevel = post.accessLevel || post.access_level || "public";
                    const hasAccess = checkSNSAccess(
                        character!,
                        accessLevel,
                        get(characterStateStore)[String(character!.id)]
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

{#if posts.length === 0}
    <div class="text-center py-12 text-gray-400">
        <Image class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>{t("sns.noPostsAvailable")}</p>
    </div>
{:else}
    <div class="p-4 space-y-6">
        {#each posts as post (post.id)}
            <SNSPost {post} {character} {isSecretMode} />
        {/each}
    </div>
{/if}
