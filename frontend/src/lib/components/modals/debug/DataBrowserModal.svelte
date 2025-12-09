<script lang="ts">
import { t } from "$root/i18n";
import {
	Database,
	Download,
	Filter,
	RefreshCw,
	Search,
	X,
} from "lucide-svelte";
import { onDestroy, onMount } from "svelte";
import { fade } from "svelte/transition";

import { characterStateStore, characters } from "../../../stores/character";
import { chatRooms, groupChats, openChats } from "../../../stores/chat";
import { prompts } from "../../../stores/prompts";
import { settings } from "../../../stores/settings";
import { isDataBrowserModalVisible } from "../../../stores/ui";

let selectedStore = "characters";
let searchQuery = "";
let filteredData: any[] = [];
let isLoading = false;

const stores = [
	{ id: "characters", name: "Characters", icon: "👤", data: $characters },
	{
		id: "characterStates",
		name: "Character States",
		icon: "🔋",
		data: $characterStateStore,
	},
	{ id: "chatRooms", name: "Chat Rooms", icon: "💬", data: $chatRooms },
	{
		id: "groupChats",
		name: "Group Chats",
		icon: "👥",
		data: $groupChats,
	},
	{ id: "openChats", name: "Open Chats", icon: "🌐", data: $openChats },
	{ id: "settings", name: "Settings", icon: "⚙️", data: $settings },
	{ id: "prompts", name: "Prompts", icon: "📝", data: $prompts },
];

function handleKeydown(event: KeyboardEvent) {
	if (event.key === "Escape") {
		isDataBrowserModalVisible.set(false);
	}
}

function refreshData() {
	isLoading = true;
	// 데이터 새로고침 (간단한 딜레이로 시뮬레이션)
	setTimeout(() => {
		filteredData = filterData();
		isLoading = false;
	}, 300);
}

function filterData() {
	const store = stores.find((s) => s.id === selectedStore);
	if (!store || !store.data) return [];

	let data: any[] = Array.isArray(store.data)
		? [...store.data]
		: Object.entries(store.data).map(([key, value]) => ({
				key,
				value,
			}));

	if (searchQuery.trim()) {
		const query = searchQuery.toLowerCase();
		data = data.filter((item) => {
			const itemString = JSON.stringify(item).toLowerCase();
			return itemString.includes(query);
		});
	}

	return data;
}

function exportData() {
	const store = stores.find((s) => s.id === selectedStore);
	if (!store) return;

	const data = {
		store: store.name,
		timestamp: new Date().toISOString(),
		data: store.data,
	};

	const blob = new Blob([JSON.stringify(data, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `data-browser-${selectedStore}-${new Date().toISOString().split("T")[0]}.json`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

$: if (selectedStore && searchQuery !== undefined) {
	filteredData = filterData();
}

onMount(() => {
	window.addEventListener("keydown", handleKeydown);
	refreshData();
});

onDestroy(() => {
	window.removeEventListener("keydown", handleKeydown);
});
</script>

{#if $isDataBrowserModalVisible}
    <div
        transition:fade={{ duration: 200 }}
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
        <div
            role="dialog"
            aria-modal="true"
            tabindex="0"
            aria-labelledby="data-browser-title"
            class="bg-gray-800 rounded-lg w-full max-w-6xl h-[90vh] flex flex-col"
            on:click|stopPropagation
            on:keydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                }
            }}
        >
            <!-- Header -->
            <div class="p-6 border-b border-gray-600">
                <div
                    class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
                >
                    <div>
                        <h2
                            id="data-browser-title"
                            class="text-xl font-bold text-white flex items-center gap-2"
                        >
                            <Database class="w-5 h-5" />
                            {t("dataBrowser.title", {
                                defaultValue: "Data Browser",
                            })}
                        </h2>
                        <p class="text-gray-400 text-sm mt-1">
                            {t("dataBrowser.subtitle")}
                        </p>
                    </div>
                    <div
                        class="flex flex-wrap justify-end gap-2 w-full sm:w-auto sm:flex-nowrap"
                    >
                        <button
                            on:click={exportData}
                            class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 text-sm"
                        >
                            <Download class="w-4 h-4" />
                            {t("dataBrowser.export")}
                        </button>
                        <button
                            on:click={refreshData}
                            class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg flex items-center gap-2 text-sm"
                            disabled={isLoading}
                        >
                            <RefreshCw
                                class="w-4 h-4 {isLoading
                                    ? 'animate-spin'
                                    : ''}"
                            />
                            {t("dataBrowser.refresh")}
                        </button>
                        <button
                            on:click={() =>
                                isDataBrowserModalVisible.set(false)}
                            class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm"
                        >
                            {t("dataBrowser.close")}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Controls -->
            <div class="p-4 border-b border-gray-600 bg-gray-700/50">
                <div class="flex flex-col sm:flex-row gap-4">
                    <!-- Store Selector -->
                    <div class="flex-1">
                        <label
                            for="store-selector"
                            class="block text-sm font-medium text-gray-300 mb-2"
                        >
                            {t("dataBrowser.selectStore")}
                        </label>
                        <select
                            id="store-selector"
                            bind:value={selectedStore}
                            class="w-full bg-gray-600 border border-gray-500 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {#each stores as store}
                                <option value={store.id}>
                                    {store.icon}
                                    {store.name} ({Array.isArray(store.data)
                                        ? store.data.length
                                        : Object.keys(store.data).length})
                                </option>
                            {/each}
                        </select>
                    </div>

                    <!-- Search -->
                    <div class="flex-1">
                        <label
                            for="search-input"
                            class="block text-sm font-medium text-gray-300 mb-2"
                        >
                            {t("dataBrowser.search")}
                        </label>
                        <div class="relative">
                            <Search
                                class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                            />
                            <input
                                id="search-input"
                                type="text"
                                bind:value={searchQuery}
                                placeholder={t("dataBrowser.searchPlaceholder")}
                                class="w-full bg-gray-600 border border-gray-500 text-white rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-hidden">
                {#if isLoading}
                    <div class="flex items-center justify-center h-full">
                        <RefreshCw class="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                {:else if filteredData.length === 0}
                    <div
                        class="flex flex-col items-center justify-center h-full text-gray-400 p-8"
                    >
                        <Database class="w-16 h-16 mb-4 opacity-50" />
                        <h3 class="text-lg font-medium mb-2">
                            {searchQuery
                                ? t("dataBrowser.noResults")
                                : t("dataBrowser.noData")}
                        </h3>
                        <p class="text-sm text-center">
                            {searchQuery
                                ? t("dataBrowser.tryDifferentQuery")
                                : t("dataBrowser.selectDifferentStore")}
                        </p>
                    </div>
                {:else}
                    <div class="p-6 h-full overflow-auto">
                        <div class="mb-4">
                            <p class="text-sm text-gray-400">
                                {t("dataBrowser.showingResults", {
                                    count: String(filteredData.length),
                                })}
                            </p>
                        </div>

                        <div class="space-y-4">
                            {#each filteredData as item, index (index)}
                                <div
                                    class="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
                                >
                                    <div
                                        class="flex justify-between items-start mb-3"
                                    >
                                        <h4
                                            class="font-mono text-sm text-blue-400"
                                        >
                                            {selectedStore === "chatRooms" ||
                                            selectedStore === "groupChats" ||
                                            selectedStore === "openChats" ||
                                            selectedStore === "characterStates"
                                                ? `#${index + 1} • ${item.key || item.id || "Item"}`
                                                : `#${index + 1}`}
                                        </h4>
                                        <span class="text-xs text-gray-400">
                                            {typeof item}
                                        </span>
                                    </div>

                                    <pre
                                        class="text-xs text-gray-300 whitespace-pre-wrap overflow-x-auto bg-gray-800/50 p-3 rounded">
<code>{JSON.stringify(item, null, 2)}</code>
                </pre>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    pre {
        font-family:
            "Fira Code", "Monaco", "Cascadia Code", "Roboto Mono", monospace;
        font-size: 0.75rem;
        line-height: 1.4;
    }

    code {
        color: #e5e7eb;
    }
</style>
