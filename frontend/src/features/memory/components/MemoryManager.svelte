<script lang="ts">
    /**
     * @component MemoryManager
     * View, add, and manage character memory entries.
     * Displays stored facts, conversation excerpts, and summaries for
     * the currently selected character, with inline editing and deletion.
     */
    import Star from "phosphor-svelte/lib/StarIcon";
    import Plus from "phosphor-svelte/lib/PlusIcon";
    import Trash from "phosphor-svelte/lib/TrashIcon";
    import ClockClockwise from "phosphor-svelte/lib/ClockClockwiseIcon";
    import type { MemoryType } from "@/features/memory";
    import { memoryStore } from "@/features/memory/stores/memoryStore.svelte";

    type Props = {
        characterId: string;
    };

    let { characterId }: Props = $props();

    let activeTab = $state<"all" | MemoryType>("all");
    let newContent = $state("");
    let newImportance = $state(0.5);
    let expandedId = $state<string | null>(null);

    // Load memories on mount and when characterId changes
    $effect(() => {
        void memoryStore.loadMemories(characterId);
    });

    let filteredMemories = $derived.by(() => {
        const all = memoryStore.memories;
        if (activeTab === "all") return all;
        return all.filter((m) => m.type === activeTab);
    });

    function getTypeLabel(type: MemoryType): string {
        const labels: Record<MemoryType, string> = {
            fact: "Fact",
            conversation: "Conversation",
            summary: "Summary",
        };
        return labels[type];
    }

    function getTypeBadgeClass(type: MemoryType): string {
        const classes: Record<MemoryType, string> = {
            fact: "badge-info",
            conversation: "badge-success",
            summary: "badge-warning",
        };
        return classes[type];
    }

    function formatDate(iso: string): string {
        return new Date(iso).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    async function handleAddFact() {
        const content = newContent.trim();
        if (!content) return;

        await memoryStore.addMemory(content, "fact", newImportance);
        newContent = "";
        newImportance = 0.5;
    }

    async function handleDelete(id: string) {
        await memoryStore.deleteMemory(id);
    }

    function handleToggleExpand(id: string) {
        expandedId = expandedId === id ? null : id;
    }

    async function handleSummarize() {
        await memoryStore.summarizeOldMemories();
    }

    function importanceStars(importance: number): number {
        return Math.round(importance * 5);
    }
</script>

<!-- Typescript hack to autocomplete props -->
{#snippet StarFill(argv: Parameters<NonNullable<Star["$set"]>>[0])}
    <Star weight="fill" {...argv}></Star>
{/snippet}
<div class="space-y-6">
    <h3 class="text-lg font-semibold">Character Memory</h3>

    <!-- Add new fact -->
    <div class="border border-base-300 rounded-lg p-4 bg-base-100 space-y-3">
        <h4 class="font-medium text-sm">Add Fact</h4>
        <textarea
            class="textarea textarea-bordered w-full h-20"
            bind:value={newContent}
            placeholder="Store a fact about this character..."
        ></textarea>
        <div class="flex items-center gap-4">
            <fieldset class="fieldset flex-1">
                <label for="fact-importance" class="fieldset-legend text-xs">Importance</label>
                <input
                    type="range"
                    id="fact-importance"
                    class="range range-sm"
                    min="0"
                    max="1"
                    step="0.1"
                    bind:value={newImportance}
                />
                <div class="flex justify-between text-xs text-base-content/50 px-1">
                    <span>Trivial</span>
                    <span>{newImportance.toFixed(1)}</span>
                    <span>Critical</span>
                </div>
            </fieldset>
            <button
                class="btn btn-primary btn-sm gap-1 mt-6"
                onclick={handleAddFact}
                disabled={!newContent.trim()}
            >
                <Plus size={16} /> Save
            </button>
        </div>
    </div>

    <!-- Tabs and summary action -->
    <div class="flex items-center justify-between">
        <div class="tabs tabs-box tabs-sm">
            <button
                class="tab {activeTab === 'all' ? 'tab-active' : ''}"
                onclick={() => (activeTab = "all")}>All ({memoryStore.memoryCount})</button
            >
            <button
                class="tab {activeTab === 'fact' ? 'tab-active' : ''}"
                onclick={() => (activeTab = "fact")}>Facts</button
            >
            <button
                class="tab {activeTab === 'conversation' ? 'tab-active' : ''}"
                onclick={() => (activeTab = "conversation")}>Conversation</button
            >
            <button
                class="tab {activeTab === 'summary' ? 'tab-active' : ''}"
                onclick={() => (activeTab = "summary")}>Summaries</button
            >
        </div>
        <button class="btn btn-sm btn-ghost gap-1" onclick={handleSummarize}>
            <ClockClockwise size={16} /> Summarize Old
        </button>
    </div>

    <!-- Memory list -->
    {#if filteredMemories.length === 0}
        <div class="text-center py-8 text-base-content/50">
            <p>No memories yet.</p>
            <p class="text-sm">Conversation memories are created automatically during chat.</p>
        </div>
    {:else}
        <div class="space-y-2">
            {#each filteredMemories as entry (entry.id)}
                <div class="border border-base-300 rounded-lg overflow-hidden bg-base-100">
                    <!-- Entry header -->
                    <div
                        class="flex items-center gap-2 p-3 bg-base-200/50 cursor-pointer hover:bg-base-200"
                        onclick={() => handleToggleExpand(entry.id)}
                        onkeydown={(e) => e.key === "Enter" && handleToggleExpand(entry.id)}
                        role="button"
                        tabindex="0"
                    >
                        <span class="badge badge-sm {getTypeBadgeClass(entry.type)}">
                            {getTypeLabel(entry.type)}
                        </span>
                        <span class="flex-1 truncate text-sm">{entry.content}</span>
                        <span
                            class="flex gap-0.5"
                            title="Importance: {entry.importance.toFixed(2)}"
                        >
                            {#each Array(importanceStars(entry.importance)) as _, idx (idx)}
                                {@render StarFill({
                                    size: 12,
                                    class: "text-warning",
                                })}
                            {/each}
                            {#each Array(5 - importanceStars(entry.importance)) as _, idx (idx)}
                                <Star size={12} class="text-base-content/30" />
                            {/each}
                        </span>
                        <span class="text-xs text-base-content/50 whitespace-nowrap">
                            {formatDate(entry.timestamp)}
                        </span>
                    </div>

                    <!-- Expanded detail -->
                    {#if expandedId === entry.id}
                        <div class="p-4 space-y-3 border-t border-base-300">
                            <p class="text-sm whitespace-pre-wrap">{entry.content}</p>
                            <div class="flex flex-wrap gap-4 text-xs text-base-content/50">
                                <span>Type: {getTypeLabel(entry.type)}</span>
                                <span>Importance: {entry.importance.toFixed(2)}</span>
                                <span>Created: {formatDate(entry.timestamp)}</span>
                                <span>Last accessed: {formatDate(entry.lastAccessed)}</span>
                            </div>
                            <div class="flex justify-end">
                                <button
                                    class="btn btn-sm btn-error btn-outline gap-1"
                                    onclick={() => handleDelete(entry.id)}
                                >
                                    <Trash size={14} /> Delete
                                </button>
                            </div>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
</div>
