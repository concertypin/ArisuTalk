<!--
  @component Sidebar
  Character list sidebar with toggle functionality.
  Based on legacy ArisuTalk design.
-->
<script lang="ts">
    interface Props {
        collapsed?: boolean;
        onToggle?: () => void;
    }

    let { collapsed = false, onToggle }: Props = $props();
</script>

<aside id="sidebar" class="sidebar" class:collapsed>
    <button
        id="desktop-sidebar-toggle"
        class="sidebar-toggle"
        onclick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
        <span class="toggle-icon">{collapsed ? '▶' : '◀'}</span>
    </button>

    <div id="sidebar-content" class="sidebar-content">
        <header class="sidebar-header">
            <h1 class="app-title">ArisuTalk</h1>
        </header>

        <nav class="character-list">
            <p class="placeholder-text">Character list will appear here</p>
        </nav>
    </div>
</aside>

<style>
    .sidebar {
        position: relative;
        display: flex;
        flex-direction: column;
        width: var(--sidebar-width);
        height: 100%;
        background-color: var(--color-bg-secondary);
        border-right: 1px solid var(--color-border);
        transition: width var(--transition-normal);
    }

    .sidebar.collapsed {
        width: 0;
        border-right: none;
    }

    .sidebar.collapsed .sidebar-content {
        opacity: 0;
        pointer-events: none;
    }

    .sidebar-toggle {
        position: absolute;
        top: 50%;
        right: -1rem;
        transform: translateY(-50%);
        z-index: 20;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        background-color: var(--color-bg-tertiary);
        border: 1px solid var(--color-border-light);
        border-radius: var(--radius-full);
        transition: background-color var(--transition-fast);
    }

    .sidebar-toggle:hover {
        background-color: var(--color-border-light);
    }

    .toggle-icon {
        font-size: var(--font-size-xs);
    }

    .sidebar-content {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
        transition: opacity var(--transition-normal);
    }

    .sidebar-header {
        padding: var(--spacing-md);
        border-bottom: 1px solid var(--color-border);
    }

    .app-title {
        font-size: var(--font-size-lg);
        font-weight: 600;
    }

    .character-list {
        flex: 1;
        overflow-y: auto;
        padding: var(--spacing-md);
    }

    .placeholder-text {
        color: var(--color-text-muted);
        font-size: var(--font-size-sm);
    }
</style>
