<script lang="ts" module>
    const characterLayoutPromise = import("@/features/character/components/CharacterLayout.svelte");
    const chatAreaPromise = import("@/components/ChatArea.svelte");
</script>

<!--
  @component Home
  Landing/chat page with character layout.
-->
{#await Promise.all([characterLayoutPromise, chatAreaPromise])}
    <div class="home-layout flex items-center justify-center text-base-content/50">Loading...</div>
{:then [{ default: CharacterLayout }, { default: ChatArea }]}
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
