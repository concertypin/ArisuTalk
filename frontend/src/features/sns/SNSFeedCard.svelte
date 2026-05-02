<!--
  @component SNSFeedCard
  Individual post card for SNS feed display (UI only).
-->
<script lang="ts">
    import HeartIcon from "phosphor-svelte/lib/HeartIcon";
    import ChatCircleTextIcon from "phosphor-svelte/lib/ChatCircleTextIcon";
    import BookmarkSimpleIcon from "phosphor-svelte/lib/BookmarkSimpleIcon";

    type Props = {
        /** Post content text */
        content?: string;
        /** Author display name */
        author?: string;
        /** Timestamp display string */
        timestamp?: string;
        /** Number of likes */
        likes?: number;
        /** Number of comments */
        comments?: number;
        /** Whether bookmarked */
        bookmarked?: boolean;
        /** Hashtags array */
        tags?: string[];
    };

    const {
        content = "Hello from the SNS mode!",
        author = "User",
        timestamp = "1m ago",
        likes = 0,
        comments = 0,
        bookmarked = false,
        tags = [],
    }: Props = $props();
</script>

<article class="sns-card p-4 space-y-3 hover-lift">
    <!-- Author & Timestamp -->
    <div class="flex items-center justify-between">
        <span class="font-medium text-sm">{author}</span>
        <span class="text-xs text-base-content/50">{timestamp}</span>
    </div>

    <!-- Content -->
    <p class="text-sm leading-relaxed">{content}</p>

    <!-- Tags -->
    {#if tags.length > 0}
        <div class="flex flex-wrap gap-1">
            {#each tags as tag (tag)}
                <span class="badge-pill bg-primary/20 text-primary text-xs">#{tag}</span>
            {/each}
        </div>
    {/if}

    <!-- Actions -->
    <div class="flex items-center gap-4 pt-2 border-t border-base-content/10">
        <button
            class="flex items-center gap-1 text-xs text-base-content/60 hover:text-accent transition-colors"
        >
            <HeartIcon size={14} />
            <span>{likes}</span>
        </button>
        <button
            class="flex items-center gap-1 text-xs text-base-content/60 hover:text-primary transition-colors"
        >
            <ChatCircleTextIcon size={14} />
            <span>{comments}</span>
        </button>
        <button
            class="flex items-center gap-1 text-xs ml-auto transition-colors {bookmarked
                ? 'text-accent'
                : 'text-base-content/60 hover:text-accent'}"
        >
            <BookmarkSimpleIcon size={14} weight={bookmarked ? "fill" : "regular"} />
        </button>
    </div>
</article>
