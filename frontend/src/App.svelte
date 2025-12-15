<!--
  @component App
  Root Svelte 5 component with hash-based router.
-->
<script lang="ts">
    import { initRouter, getCurrentPath } from "@/lib/router.svelte";
    import { routes } from "@/lib/routeConfig";
    import { uiState } from "@/lib/stores/ui.svelte";
    import type { Component } from "svelte";

    // Initialize router on mount
    $effect(() => {
        initRouter();
    });

    // Current route path (reactive)
    let currentPath = $derived(getCurrentPath());

    // Current component (lazy loaded)
    let CurrentComponent = $state<Component | null>(null);
    let isLoading = $state(true);

    // Load component when path changes
    $effect(() => {
        void (async () => {
            const loader = routes[currentPath] ?? routes["/"];
            isLoading = true;

            try {
                const module = await loader();
                CurrentComponent = module.default;
            } finally {
                isLoading = false;
            }
        })().catch((err) => console.error("Failed to load route", err));
    });
</script>

<svelte:head>
    <title>ArisuTalk</title>
</svelte:head>

{#if isLoading}
    <div class="flex items-center justify-center w-full h-full text-base-content/50">
        Loading...
    </div>
{:else if CurrentComponent}
    <CurrentComponent />
{/if}

{#if uiState.settingsModalOpen}
    {#await import("@/components/SettingsModal.svelte") then { default: SettingsModal }}
        <SettingsModal />
    {/await}
{/if}
