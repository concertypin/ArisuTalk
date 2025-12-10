<!--
  @component App
  Root Svelte 5 component with hash-based router.
-->
<script lang="ts">
    import { initRouter, getCurrentPath } from "@/lib/router.svelte";
    import { routes } from "@/lib/routeConfig";
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
        const loader = routes[currentPath] ?? routes["/"];
        isLoading = true;

        loader().then((module) => {
            CurrentComponent = module.default;
            isLoading = false;
        });
    });
</script>

<svelte:head>
    <title>ArisuTalk</title>
</svelte:head>

{#if isLoading}
    <div class="loading">Loading...</div>
{:else if CurrentComponent}
    <CurrentComponent />
{/if}

<style>
    .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        color: var(--color-text-muted);
    }
</style>
