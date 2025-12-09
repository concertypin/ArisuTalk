<!--
  @component Home
  Landing/chat page placeholder.
-->
<script lang="ts">
    import Sidebar from '../components/Sidebar.svelte';
    import ChatArea from '../components/ChatArea.svelte';

    let sidebarCollapsed = $state(false);

    function toggleSidebar(): void {
        sidebarCollapsed = !sidebarCollapsed;
    }
</script>

<div class="home-layout">
    <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
    <ChatArea />
</div>

<style>
    .home-layout {
        display: flex;
        width: 100%;
        height: 100%;
    }
</style>
