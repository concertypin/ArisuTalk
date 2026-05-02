<!--
  @component SNSProfile
  SNS profile view with header, tabs, and feed (UI only - no functionality).
-->
<script lang="ts">
    import UserIcon from "phosphor-svelte/lib/UserIcon";
    import LockIcon from "phosphor-svelte/lib/LockIcon";
    import SNSFeedCard from "./SNSFeedCard.svelte";

    type TabName = "posts" | "secrets" | "tags";

    let activeTab = $state<TabName>("posts");

    // Mock profile data
    const profile = {
        name: "Han Jieyon",
        avatar: null as string | null,
        isSecret: true,
        stats: {
            posts: 12,
            followers: 156,
            following: 89,
        },
        frequentTags: ["daily", "hello", "chat", "mood"],
    };

    // Mock posts
    const posts = [
        {
            id: 1,
            content: "Just started using ArisuTalk today. Really enjoying the experience!",
            timestamp: "2h ago",
            likes: 24,
            comments: 3,
            tags: ["daily"],
        },
        {
            id: 2,
            content: "The new design looks amazing!",
            timestamp: "1d ago",
            likes: 42,
            comments: 7,
            tags: ["mood", "update"],
        },
        {
            id: 3,
            content: "Hello everyone 👋",
            timestamp: "3d ago",
            likes: 18,
            comments: 2,
            tags: ["hello"],
        },
    ];

    const tabs: { key: TabName; label: string }[] = [
        { key: "posts", label: "Posts" },
        { key: "secrets", label: "Secrets" },
        { key: "tags", label: "Tags" },
    ];
</script>

<div class="flex flex-col h-full bg-base-100 max-w-md mx-auto">
    <!-- Profile Header -->
    <header class="p-6 space-y-4">
        <div class="flex items-start gap-4">
            <!-- Avatar -->
            <div
                class="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-secondary flex items-center justify-center"
            >
                {#if profile.avatar}
                    <img
                        src={profile.avatar}
                        alt={profile.name}
                        class="w-full h-full rounded-full object-cover"
                    />
                {:else}
                    <UserIcon size={28} class="text-white" />
                {/if}
            </div>

            <!-- Info -->
            <div class="flex-1">
                <div class="flex items-center gap-2">
                    <h1 class="font-bold text-lg tracking-tight">{profile.name}</h1>
                    {#if profile.isSecret}
                        <span
                            class="badge-pill gradient-accent text-white text-xs flex items-center gap-1"
                        >
                            <LockIcon size={10} /> Secret
                        </span>
                    {/if}
                </div>

                <!-- Stats -->
                <div class="flex gap-4 mt-2 text-sm">
                    <div class="text-center">
                        <span class="font-semibold">{profile.stats.posts}</span>
                        <span class="text-base-content/60 ml-1">Posts</span>
                    </div>
                    <div class="text-center">
                        <span class="font-semibold">{profile.stats.followers}</span>
                        <span class="text-base-content/60 ml-1">Followers</span>
                    </div>
                    <div class="text-center">
                        <span class="font-semibold">{profile.stats.following}</span>
                        <span class="text-base-content/60 ml-1">Following</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Frequent Tags -->
        <div class="space-y-2">
            <p class="text-xs text-base-content/50">Frequently used tags</p>
            <div class="flex flex-wrap gap-1">
                {#each profile.frequentTags as tag (tag)}
                    <span class="badge-pill bg-base-200 text-base-content/80 text-xs">#{tag}</span>
                {/each}
            </div>
        </div>
    </header>

    <!-- Tabs -->
    <nav class="flex border-b border-base-300/50">
        {#each tabs as tab (tab.key)}
            <button
                class="flex-1 py-3 text-sm font-medium transition-colors border-b-2 {activeTab ===
                tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-base-content/60 hover:text-base-content'}"
                onclick={() => (activeTab = tab.key)}
            >
                {tab.label}
            </button>
        {/each}
    </nav>

    <!-- Feed -->
    <section class="flex-1 overflow-y-auto p-4 space-y-3">
        {#if activeTab === "posts"}
            {#each posts as post (post.id)}
                <SNSFeedCard
                    content={post.content}
                    author={profile.name}
                    timestamp={post.timestamp}
                    likes={post.likes}
                    comments={post.comments}
                    tags={post.tags}
                />
            {/each}
        {:else if activeTab === "secrets"}
            <div class="flex flex-col items-center justify-center h-32 text-base-content/50">
                <LockIcon size={24} />
                <p class="mt-2 text-sm">Secret posts are private</p>
            </div>
        {:else if activeTab === "tags"}
            <div class="flex flex-wrap gap-2">
                {#each profile.frequentTags as tag (tag)}
                    <button
                        class="badge-pill bg-base-200 hover:bg-base-300 text-base-content transition-colors"
                    >
                        #{tag}
                    </button>
                {/each}
            </div>
        {/if}
    </section>
</div>
