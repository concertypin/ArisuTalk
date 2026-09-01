<script module>
    import EmptySettings from "./EmptySettings.svelte";
    import PlaceholderIcon from "phosphor-svelte/lib/PlaceholderIcon";

    import GearIcon from "phosphor-svelte/lib/GearIcon";
    import XIcon from "phosphor-svelte/lib/XIcon";

    import type { Component } from "svelte";

    export function declareTab<T extends Record<string, any>>(
        kind: string,
        panel: Component<T>,
        icon: Component,
        title: string,
        label: string,
        text: string
    ) {
        return {
            kind,
            panel,
            icon,
            title,
            label,
            text,
        };
    }

    export type Subpage<Props extends Record<string, any>> = {
        kind: string;
        panel: Component<Props>;
        icon: Component;
        title: string;
        label: string;
        text: string;
    };

    export function tabEntry<T extends Record<string, any>>({
        kind = "unknown",
        panel = EmptySettings,
        icon = PlaceholderIcon,
        title,
        label,
        text,
    }: {
        kind?: string;
        panel?: Component<T>;
        icon?: Component;
        title?: string;
        label?: string;
        text?: string;
    }) {
        const upperCaseKind = kind.toUpperCase();
        return {
            kind,
            panel,
            icon,
            title: title ?? upperCaseKind,
            label: label ?? upperCaseKind,
            text: text ?? upperCaseKind,
        };
    }

    export function processTab<T extends Record<string, any>>(subpages: Subpage<T>[]) {
        const tabList: {
            kind: string;
            title: string;
            label: string;
            icon: Component;
            text: string;
        }[] = [];
        const pageMap: Record<string, Component<T>> = {};

        for (const subpage of subpages) {
            pageMap[subpage.kind] = subpage.panel;
            tabList.push({
                kind: subpage.kind,
                title: subpage.title,
                label: subpage.label,
                icon: subpage.icon,
                text: subpage.text,
            });
        }

        return { tabList, pageMap };
    }
</script>

<script lang="ts" generics="TContext = never">
    // DO NOT REMOVE
    type TProps = { context: () => TContext };

    let {
        id = "untitled-" + crypto.randomUUID(),
        title = "Untitled",
        subpages,
        onOpen = () => null,
        onClose = () => null,
        onTabChange,
        activeTab,
        settingsModalContext,
        self = $bindable(),
    }: {
        id?: string;
        title?: string;
        subpages: {
            tabList: {
                kind: string;
                title: string;
                label: string;
                icon: Component;
                text: string;
            }[];
            pageMap: Record<string, Component<TProps>>;
        };
        onOpen?: () => void;
        onClose?: () => void;
        onTabChange: (kind: string) => void;
        activeTab: string;
        settingsModalContext: () => TContext;
        self?: HTMLDialogElement;
    } = $props();

    let { tabList, pageMap } = $derived(subpages);

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

{#snippet Tab(kind: string, Icon: Component, isActive: boolean, label: string, text: string)}
    <li>
        <button
            class="flex gap-2 rounded-lg"
            class:active={isActive}
            onclick={() => onTabChange(kind)}
            aria-label={label}
        >
            <Icon size={18} />
            {text}
        </button>
    </li>
{/snippet}

{#snippet Panel(Comp: Component<TProps>)}
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
                    {#each tabList as tab (tab.kind)}
                        {@const isActive = tab.kind === activeTab}
                        {@render Tab(tab.kind, tab.icon, isActive, tab.label, tab.text)}
                    {/each}
                </ul>
            </aside>

            <!-- Main Panel -->
            <main class="flex-1 p-6 overflow-y-auto bg-base-100">
                {@render Panel(pageMap[activeTab] ?? EmptySettings)}
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
