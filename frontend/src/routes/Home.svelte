<script lang="ts" module>
    import type { Component } from "svelte";
    import { Logger } from "@common/logger/Logger";

    let cached: { CharacterLayout: Component; ChatArea: Component } | null = null;

    async function initHome() {
        if (cached) return cached;

        cached = await Promise.all([
            import("@/features/character/components/CharacterLayout.svelte"),
            import("@/components/ChatArea.svelte"),
        ])
            .then(([layout, chatarea]) => ({
                CharacterLayout: layout.default,
                ChatArea: chatarea.default,
            }))
            .catch((e) => {
                Logger.error("Failed to load components.");
                throw e;
            });

        return cached;
    }
</script>

<!--
  @component Home
  Landing/chat page with character layout.
-->
{#await initHome()}
    <div class="home-layout flex items-center justify-center text-base-content/50">Loading...</div>
{:then { CharacterLayout, ChatArea }}
    <div class="home-layout">
        <CharacterLayout>
            <ChatArea />
        </CharacterLayout>
    </div>
{:catch error}
    <div class="home-layout flex items-center justify-center text-error">
        Failed to load: {String(error)}
    </div>
{/await}

<style>
    .home-layout {
        display: flex;
        width: 100%;
        height: 100vh;
        overflow: hidden;
    }
</style>
