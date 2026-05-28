<script lang="ts">
    /**
     * @component CharacterLorebookSettings
     * Lorebook configuration: token limit and lore entries.
     * Each entry has name, content, conditions, priority, and enabled toggle.
     */
    import type { Character } from "@arisutalk/character-spec/v0/Character";
    import PlusIcon from "phosphor-svelte/lib/PlusIcon";
    import TrashIcon from "phosphor-svelte/lib/TrashIcon";
    import CaretDownIcon from "phosphor-svelte/lib/CaretDownIcon";
    import CaretUpIcon from "phosphor-svelte/lib/CaretUpIcon";
    import {
        withCharacter,
        updateArrayItem,
        removeArrayItem,
        appendArrayItem,
    } from "@/lib/utils/characterState";

    type LorebookEntry = Character["prompt"]["lorebook"]["data"][number];
    type ConditionType = LorebookEntry["condition"][number]["type"];

    type Props = {
        character: Character;
        onChange: (character: Character) => void;
    };

    let { character, onChange }: Props = $props();

    let expandedEntryId = $state<string | null>(null);

    function updateTokenLimit(limit: number) {
        onChange(
            withCharacter(character, (draft) => {
                draft.prompt.lorebook.config.tokenLimit = limit;
            })
        );
    }

    function addEntry() {
        const newEntry: LorebookEntry = {
            id: crypto.randomUUID(),
            name: "New Entry",
            content: "",
            condition: [{ type: "always" }],
            multipleConditionResolveStrategy: "any",
            enabled: true,
            priority: 0,
        };
        onChange(
            withCharacter(character, (draft) => {
                draft.prompt.lorebook.data = appendArrayItem(draft.prompt.lorebook.data, newEntry);
            })
        );
        expandedEntryId = newEntry.id;
    }

    function updateEntry(entryId: string, updates: Partial<LorebookEntry>) {
        onChange(
            withCharacter(character, (draft) => {
                draft.prompt.lorebook.data = updateArrayItem(
                    draft.prompt.lorebook.data,
                    entryId,
                    updates
                );
            })
        );
    }

    function deleteEntry(entryId: string) {
        onChange(
            withCharacter(character, (draft) => {
                draft.prompt.lorebook.data = removeArrayItem(draft.prompt.lorebook.data, entryId);
            })
        );
    }

    function toggleExpand(entryId: string) {
        expandedEntryId = expandedEntryId === entryId ? null : entryId;
    }

    function getConditionLabel(type: ConditionType): string {
        const labels: Record<ConditionType, string> = {
            always: "Always",
            plain_text_match: "Plain Text Match",
            regex_match: "Regex Match",
        };
        return labels[type];
    }
</script>

<div class="space-y-6">
    <h3 class="text-lg font-semibold">Lorebook</h3>

    <fieldset class="fieldset w-full">
        <label for="lorebook-token-limit" class="fieldset-legend">Token Limit</label>
        <input
            type="number"
            id="lorebook-token-limit"
            class="input w-32"
            value={character.prompt.lorebook.config.tokenLimit || 0}
            oninput={(e) => updateTokenLimit(parseInt(e.currentTarget.value) || 0)}
            min="0"
        />
        <div class="label">
            <span class="label-text-alt">Maximum tokens for lorebook entries in prompts.</span>
        </div>
    </fieldset>

    <div class="divider"></div>

    <div class="flex items-center justify-between">
        <h4 class="font-medium">Entries ({character.prompt.lorebook.data.length})</h4>
        <button class="btn btn-sm btn-primary gap-1" onclick={addEntry}>
            <PlusIcon size={16} /> Add Entry
        </button>
    </div>

    {#if character.prompt.lorebook.data.length === 0}
        <div class="text-center py-8 text-base-content/50">
            <p>No lorebook entries yet.</p>
            <p class="text-sm">Add entries to inject context based on conditions.</p>
        </div>
    {:else}
        <div class="space-y-2">
            {#each character.prompt.lorebook.data as entry (entry.id)}
                <div class="border border-base-300 rounded-lg overflow-hidden bg-base-100">
                    <!-- Entry Header -->
                    <div
                        class="flex items-center gap-2 p-3 bg-base-200/50 cursor-pointer hover:bg-base-200"
                        onclick={() => toggleExpand(entry.id)}
                        onkeydown={(e) => e.key === "Enter" && toggleExpand(entry.id)}
                        role="button"
                        tabindex="0"
                    >
                        <input
                            type="checkbox"
                            class="checkbox checkbox-sm"
                            checked={entry.enabled}
                            onclick={(e) => e.stopPropagation()}
                            onchange={(e) =>
                                updateEntry(entry.id, { enabled: e.currentTarget.checked })}
                        />
                        <span class="flex-1 font-medium truncate">{entry.name || "Untitled"}</span>
                        <span class="badge badge-sm badge-ghost">
                            {getConditionLabel(entry.condition[0]?.type || "always")}
                        </span>
                        <span class="text-xs text-base-content/50">P: {entry.priority}</span>
                        {#if expandedEntryId === entry.id}
                            <CaretUpIcon size={16} />
                        {:else}
                            <CaretDownIcon size={16} />
                        {/if}
                    </div>

                    <!-- Entry Details -->
                    {#if expandedEntryId === entry.id}
                        <div class="p-4 space-y-4 border-t border-base-300">
                            <div class="grid grid-cols-2 gap-4">
                                <fieldset class="fieldset">
                                    <label
                                        for="entry-name-{entry.id}"
                                        class="fieldset-legend text-sm">Name</label
                                    >
                                    <input
                                        type="text"
                                        id="entry-name-{entry.id}"
                                        class="input input-sm w-full"
                                        value={entry.name}
                                        oninput={(e) =>
                                            updateEntry(entry.id, { name: e.currentTarget.value })}
                                    />
                                </fieldset>
                                <fieldset class="fieldset">
                                    <label
                                        for="entry-priority-{entry.id}"
                                        class="fieldset-legend text-sm">Priority</label
                                    >
                                    <input
                                        type="number"
                                        id="entry-priority-{entry.id}"
                                        class="input input-sm w-full"
                                        value={entry.priority}
                                        oninput={(e) =>
                                            updateEntry(entry.id, {
                                                priority: parseInt(e.currentTarget.value) || 0,
                                            })}
                                    />
                                </fieldset>
                            </div>

                            <fieldset class="fieldset">
                                <label
                                    for="entry-content-{entry.id}"
                                    class="fieldset-legend text-sm">Content</label
                                >
                                <textarea
                                    id="entry-content-{entry.id}"
                                    class="textarea w-full h-24"
                                    value={entry.content}
                                    oninput={(e) =>
                                        updateEntry(entry.id, { content: e.currentTarget.value })}
                                    placeholder="Lore content to inject..."
                                ></textarea>
                            </fieldset>

                            <fieldset class="fieldset">
                                <label
                                    for="entry-condition-{entry.id}"
                                    class="fieldset-legend text-sm">Condition</label
                                >
                                <select
                                    id="entry-condition-{entry.id}"
                                    class="select select-sm w-full"
                                    value={entry.condition[0]?.type || "always"}
                                    onchange={(e) => {
                                        const value = e.currentTarget.value;
                                        if (value === "always") {
                                            updateEntry(entry.id, {
                                                condition: [{ type: "always" }],
                                            });
                                        } else if (value === "regex_match") {
                                            updateEntry(entry.id, {
                                                condition: [
                                                    {
                                                        type: "regex_match",
                                                        regexPattern: "",
                                                        regexFlags: "g",
                                                    },
                                                ],
                                            });
                                        } else if (value === "plain_text_match") {
                                            updateEntry(entry.id, {
                                                condition: [
                                                    {
                                                        type: "plain_text_match",
                                                        text: "",
                                                    },
                                                ],
                                            });
                                        }
                                    }}
                                >
                                    <option value="always">Always</option>
                                    <option value="plain_text_match">Plain Text Match</option>
                                    <option value="regex_match">Regex Match</option>
                                </select>
                            </fieldset>

                            <div class="flex justify-end">
                                <button
                                    class="btn btn-sm btn-error btn-outline gap-1"
                                    onclick={() => deleteEntry(entry.id)}
                                >
                                    <TrashIcon size={14} /> Delete
                                </button>
                            </div>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
</div>
