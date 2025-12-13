<!--
  @component Home
  Landing/chat page placeholder.
-->
<script lang="ts">
    import CharacterLayout from "@/features/character/components/CharacterLayout.svelte";
    import ChatArea from "@/components/ChatArea.svelte";
</script>

<div class="home-layout">
    <CharacterLayout>
        <ChatArea />
    </CharacterLayout>
</div>

<style>
    .home-layout {
        display: flex;
        width: 100%;
        height: 100vh;
        overflow: hidden;
    }
</style>
