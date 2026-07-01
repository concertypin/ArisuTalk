<!--
  @component App
  Root Svelte 5 component with hash-based router, PWA support, and theming.
-->
<script lang="ts">
    import { initRouter, getCurrentPath } from "@/lib/router.svelte";
    import { Logger } from "@common/logger/Logger";
    import { routes } from "@/lib/routeConfig";
    import { uiState } from "@/lib/stores/ui.svelte";
    import { settings } from "@/lib/stores/settings.svelte";
    import { applyTheme } from "@/lib/theme.svelte";
    import { registerServiceWorker } from "@/lib/serviceWorker";
    import ToastContainer from "@/components/ToastContainer.svelte";
    import IconContext from "phosphor-svelte/lib/IconContext";
    import type { Component } from "svelte";
    import { loadFont } from "@/lib/utils/fontUtils";
    import AuthGate from "@/features/auth/components/AuthGate.svelte";
    import { versionInfo } from "@/lib/stores/versionInfo.svelte";

    // Initialize router and settings on mount
    $effect(() => {
        initRouter();
        void settings.init();
        void registerServiceWorker();
    });

    // Apply theme when settings are loaded or theme changes
    $effect(() => {
        if (settings.isLoaded) {
            applyTheme(settings.value.theme);
        }
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
        })().catch((err) => Logger.error("Failed to load route", err));
    });

    // Apply global font settings
    $effect(() => {
        const { fontSize, fontFamily } = settings.value;
        if (fontFamily) {
            loadFont(fontFamily);
            document.documentElement.style.setProperty("--app-font-family", fontFamily);
        }
        if (fontSize) {
            document.documentElement.style.setProperty("--app-font-size", `${fontSize}px`);
        }
    });
</script>

<svelte:head>
    <title>{versionInfo.displayLabel}</title>
</svelte:head>

<AuthGate>
    <IconContext values={{ weight: "bold", size: 24, mirrored: false }}>
        {#if isLoading}
            <div class="flex items-center justify-center w-full h-full text-base-content/50">
                Loading...
            </div>
        {:else if CurrentComponent}
            <CurrentComponent />
        {/if}

        {#if uiState.settingsModalOpen}
            {#await import("@/components/SettingsModal.svelte")}
                <div
                    class="fixed inset-0 z-50 flex items-center justify-center bg-base-content/50 text-base-content/70 backdrop-blur-sm"
                >
                    <span class="loading loading-spinner loading-lg"></span>
                </div>
            {:then { default: Component }}
                <Component />
            {:catch error}
                <div
                    class="fixed inset-0 z-50 flex items-center justify-center bg-base-content/50 text-error backdrop-blur-sm"
                >
                    <div class="bg-base-100 p-8 rounded-xl shadow-xl border border-error/20">
                        <h3 class="font-bold text-lg mb-2">Error Loading Settings</h3>
                        <p>{String(error)}</p>
                        <button
                            class="btn btn-sm btn-ghost mt-4"
                            onclick={() => uiState.closeSettingsModal()}>Close</button
                        >
                    </div>
                </div>
            {/await}
        {/if}
        <ToastContainer />
        {#if import.meta.env.DEV}
            {#await import("sv-agentation") then { Agentation }}
                <div style="position:relative;z-index:9999">
                    <Agentation toolbarPosition="top-right" />
                </div>
            {/await}
        {/if}
    </IconContext>
</AuthGate>
