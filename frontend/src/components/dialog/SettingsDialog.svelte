<script lang="ts" generics="TContext = never">
    import GearIcon from "phosphor-svelte/lib/GearIcon";
    import XIcon from "phosphor-svelte/lib/XIcon";
    import type { Component } from "svelte";
    import SanitizedHtml from "@/components/SanitizedHtml.svelte";
    import type { Page, SubpageProps } from "./settingsPreload";

    let {
        id = `untitled-${crypto.randomUUID()}`,
        title = "Untitled",
        preloaded,
        onOpen = () => null,
        onClose = () => null,
        onTabChange,
        activeId,
        settingsModalContext,
        self = $bindable(),
    }: {
        id?: string;
        title?: string;
        preloaded: {
            tabList: {
                id: string;
                label: string;
                icon: Component;
            }[];
            pageMap: Record<string, Page<TContext>>;
        };
        onOpen?: () => void;
        onClose?: () => void;
        onTabChange: (kind: string) => void;
        activeId: string;
        settingsModalContext: () => TContext;
        self?: HTMLDialogElement;
    } = $props();

    let { tabList, pageMap } = $derived(preloaded);
    let page = $derived(pageMap[activeId]);

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === self) {
            onClose();
        }
    }

    function onAttach(dialog: HTMLDialogElement) {
        dialog.showModal();
        onOpen();
    }
</script>

{#snippet Tab(id: string, Icon: Component, label: string, isActive: boolean)}
    <li>
        <button
            class="flex gap-2 rounded-lg"
            class:active={isActive}
            onclick={() => onTabChange(id)}
            aria-label={label}
        >
            <Icon size={18} />
            {label}
        </button>
    </li>
{/snippet}

{#snippet Panel(Comp: Component<SubpageProps<TContext>>)}
    <div class="space-y-6">
        <h3 class="text-lg font-semibold">{title}</h3>

        <Comp context={settingsModalContext} />
    </div>
{/snippet}

<dialog
    bind:this={self}
    class="modal"
    onclose={onClose}
    onclick={handleBackdropClick}
    aria-labelledby="{id}-settings-title"
    {@attach onAttach}
>
    <div
        class="modal-box w-11/12 max-w-5xl h-[80vh] p-0 flex flex-col overflow-hidden bg-base-100 text-base-content shadow-2xl"
    >
        <!-- Header -->
        <header
            class="flex items-center justify-between p-4 border-b border-base-300/50 bg-base-200/80"
        >
            <h2
                id="{id}-settings-title"
                class="text-xl font-bold flex items-center gap-2 tracking-tight"
            >
                <GearIcon size={24} />
                {title} Settings
            </h2>
            <button
                class="btn btn-ghost btn-sm btn-square hover:bg-base-300/50"
                onclick={onClose}
                aria-label="Close"
            >
                <XIcon size={20} />
            </button>
        </header>

        <div class="flex flex-1 overflow-hidden">
            <!-- Sidebar -->
            <aside class="w-56 bg-base-200/60 p-3 overflow-y-auto border-r border-base-300/50">
                <ul class="menu w-full p-0 gap-1">
                    {#each tabList as tab (tab.id)}
                        {@const isActive = tab.id === activeId}
                        {@render Tab(tab.id, tab.icon, tab.label, isActive)}
                    {/each}
                </ul>
            </aside>

            <!-- Main Panel -->
            <main class="flex-1 p-6 overflow-y-auto bg-base-100">
                {#if page.type === "none"}
                    <div></div>
                {:else if page.type === "markdown"}
                    <SanitizedHtml
                        class="prose prose-compact prose-invert prose-sm prose-gray max-w-[80ch]"
                        html={page.text}
                    />
                {:else if page.type === "component"}
                    {@render Panel(page.component)}
                {:else}
                    <page.component />
                {/if}
            </main>
        </div>

        <!-- Footer -->
        <div class="modal-action p-4 border-t border-base-300/50 bg-base-200/60 m-0">
            <span class="text-sm text-base-content/50 flex-1">Changes are saved automatically</span>
            <button class="btn btn-primary shadow-md" onclick={onClose}>Close</button>
        </div>
    </div>
</dialog>

<style>
    aside::-webkit-scrollbar {
        width: 4px;
    }
    aside::-webkit-scrollbar-thumb {
        background-color: var(--fallback-bc, oklch(var(--bc) / 0.2));
        border-radius: 4px;
    }
</style>
