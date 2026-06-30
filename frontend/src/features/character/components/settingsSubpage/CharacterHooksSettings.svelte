<script lang="ts">
    /**
     * @component CharacterHooksSettings
     * Advanced settings: runtime configuration and replace hooks.
     * Fully editable hooks for display, input, output, request.
     */
    import type { Character } from "@arisutalk/character-spec/v0/Character";
    import PlusIcon from "phosphor-svelte/lib/PlusIcon";
    import TrashIcon from "phosphor-svelte/lib/TrashIcon";
    import CaretDownIcon from "phosphor-svelte/lib/CaretDownIcon";
    import CaretUpIcon from "phosphor-svelte/lib/CaretUpIcon";
    import WarningIcon from "phosphor-svelte/lib/WarningIcon";
    import { withCharacter } from "@/lib/utils/characterState";

    type ReplaceHook = Character["executables"]["replaceHooks"];
    type HookType = keyof ReplaceHook;
    type HookEntity = ReplaceHook[HookType][number];

    type Props = {
        character: Character;
        onChange: (character: Character) => void;
    };

    const { character, onChange }: Props = $props();

    let activeHookType = $state<HookType>("display");
    let expandedHookIndex = $state<number | null>(null);

    const hookTypes: { type: HookType; label: string; description: string }[] = [
        {
            type: "display",
            label: "Display",
            description: "Transform text when rendering messages",
        },
        { type: "input", label: "Input", description: "Transform user input before processing" },
        { type: "output", label: "Output", description: "Transform AI output after generation" },
        { type: "request", label: "Request", description: "Transform text before sending to AI" },
    ];

    function updateRuntimeSetting<K extends keyof Character["executables"]["runtimeSetting"]>(
        field: K,
        value: Character["executables"]["runtimeSetting"][K]
    ) {
        onChange(
            withCharacter(character, (draft) => {
                draft.executables.runtimeSetting[field] = value;
            })
        );
    }

    function getHooks(type: HookType): HookEntity[] {
        return character.executables.replaceHooks[type];
    }

    function addHook(type: HookType) {
        const newHook: HookEntity = {
            input: "",
            output: "",
            meta: {
                type: "string",
                caseSensitive: false,
                isInputPatternScripted: false,
                isOutputScripted: false,
                priority: 0,
            },
        };
        onChange(
            withCharacter(character, (draft) => {
                draft.executables.replaceHooks[type].push(newHook);
                expandedHookIndex = draft.executables.replaceHooks[type].length - 1;
            })
        );
    }

    function updateHook(type: HookType, index: number, newHook: HookEntity) {
        onChange(
            withCharacter(character, (draft) => {
                draft.executables.replaceHooks[type][index] = newHook;
            })
        );
    }

    function deleteHook(type: HookType, index: number) {
        onChange(
            withCharacter(character, (draft) => {
                draft.executables.replaceHooks[type].splice(index, 1);
            })
        );
        if (expandedHookIndex !== null) {
            if (expandedHookIndex === index) {
                expandedHookIndex = null;
            } else if (expandedHookIndex > index) {
                expandedHookIndex--;
            }
        }
    }

    function toggleExpand(index: number) {
        expandedHookIndex = expandedHookIndex === index ? null : index;
    }
</script>

<div class="space-y-6">
    <h3 class="text-lg font-semibold">Advanced Settings</h3>

    <div class="alert alert-warning">
        <WarningIcon size={18} />
        <span
            >These are advanced settings. Incorrect configuration may affect character behavior.</span
        >
    </div>

    <!-- Runtime Settings -->
    <div class="collapse collapse-arrow bg-base-200">
        <input type="checkbox" />
        <div class="collapse-title font-medium">Runtime Settings</div>
        <div class="collapse-content space-y-4">
            <fieldset class="fieldset">
                <label for="runtime-mem" class="fieldset-legend text-sm">Memory (MB)</label>
                <input
                    type="number"
                    id="runtime-mem"
                    class="input input-sm w-32"
                    value={character.executables.runtimeSetting.mem || ""}
                    oninput={(e) =>
                        updateRuntimeSetting("mem", parseInt(e.currentTarget.value) || undefined)}
                    placeholder="Default"
                    min="1"
                />
            </fieldset>

            <fieldset class="fieldset">
                <label for="runtime-timeout" class="fieldset-legend text-sm">Timeout (ms)</label>
                <input
                    type="number"
                    id="runtime-timeout"
                    class="input input-sm w-32"
                    value={character.executables.runtimeSetting.timeout || 30000}
                    oninput={(e) =>
                        updateRuntimeSetting("timeout", parseInt(e.currentTarget.value) || 30000)}
                    min="1000"
                    step="1000"
                />
            </fieldset>
        </div>
    </div>

    <!-- Replace Hooks -->
    <div class="divider">Replace Hooks</div>

    <div role="tablist" class="tabs tabs-bordered">
        {#each hookTypes as ht (ht.type)}
            <button
                type="button"
                role="tab"
                class="tab"
                class:tab-active={activeHookType === ht.type}
                onclick={() => {
                    activeHookType = ht.type;
                    expandedHookIndex = null;
                }}
            >
                {ht.label}
                <span class="badge badge-sm ml-1">{getHooks(ht.type).length}</span>
            </button>
        {/each}
    </div>

    <p class="text-sm text-base-content/60">
        {hookTypes.find((h) => h.type === activeHookType)?.description}
    </p>

    <div class="flex justify-end">
        <button class="btn btn-sm btn-primary gap-1" onclick={() => addHook(activeHookType)}>
            <PlusIcon size={16} /> Add Hook
        </button>
    </div>

    {#if getHooks(activeHookType).length === 0}
        <div class="text-center py-8 text-base-content/50">
            <p>No {activeHookType} hooks.</p>
        </div>
    {:else}
        <div class="space-y-2">
            {#each getHooks(activeHookType) as hook, index (index)}
                <div class="border border-base-300 rounded-lg overflow-hidden bg-base-100">
                    <div
                        class="flex items-center gap-2 p-3 bg-base-200/50 cursor-pointer hover:bg-base-200"
                        onclick={() => toggleExpand(index)}
                        onkeydown={(e) => e.key === "Enter" && toggleExpand(index)}
                        role="button"
                        tabindex="0"
                    >
                        <span class="flex-1 font-mono text-sm truncate">
                            {hook.input || "(empty pattern)"} → {hook.output || "(empty)"}
                        </span>
                        <span class="badge badge-sm badge-ghost">{hook.meta.type}</span>
                        {#if expandedHookIndex === index}
                            <CaretUpIcon size={16} />
                        {:else}
                            <CaretDownIcon size={16} />
                        {/if}
                    </div>

                    {#if expandedHookIndex === index}
                        <div class="p-4 space-y-4 border-t border-base-300">
                            <fieldset class="fieldset">
                                <label for="hook-input-{index}" class="fieldset-legend text-sm"
                                    >Input Pattern</label
                                >
                                <input
                                    type="text"
                                    id="hook-input-{index}"
                                    class="input input-sm w-full font-mono"
                                    value={hook.input}
                                    oninput={(e) =>
                                        updateHook(activeHookType, index, {
                                            ...hook,
                                            input: e.currentTarget.value,
                                        })}
                                    placeholder="Pattern to match..."
                                />
                            </fieldset>

                            <fieldset class="fieldset">
                                <label for="hook-output-{index}" class="fieldset-legend text-sm"
                                    >Replacement</label
                                >
                                <input
                                    type="text"
                                    id="hook-output-{index}"
                                    class="input input-sm w-full font-mono"
                                    value={hook.output}
                                    oninput={(e) =>
                                        updateHook(activeHookType, index, {
                                            ...hook,
                                            output: e.currentTarget.value,
                                        })}
                                    placeholder="Replacement text..."
                                />
                            </fieldset>

                            <div class="grid grid-cols-2 gap-4">
                                <fieldset class="fieldset">
                                    <label for="hook-type-{index}" class="fieldset-legend text-sm"
                                        >Type</label
                                    >
                                    <select
                                        id="hook-type-{index}"
                                        class="select select-sm w-full"
                                        value={hook.meta.type}
                                        onchange={(e) => {
                                            const newType = e.currentTarget
                                                .value as HookEntity["meta"]["type"];
                                            if (newType === hook.meta.type) return;
                                            if (newType === "string") {
                                                updateHook(activeHookType, index, {
                                                    ...hook,
                                                    meta: {
                                                        ...hook.meta,
                                                        type: "string",
                                                        caseSensitive: true,
                                                    },
                                                });
                                            } else {
                                                updateHook(activeHookType, index, {
                                                    ...hook,
                                                    meta: {
                                                        type: "regex",
                                                        flag: "g",
                                                        isInputPatternScripted:
                                                            hook.meta.isInputPatternScripted,
                                                        isOutputScripted:
                                                            hook.meta.isOutputScripted,
                                                        priority: hook.meta.priority,
                                                    },
                                                });
                                            }
                                        }}
                                    >
                                        <option value="string">String</option>
                                        <option value="regex">Regex</option>
                                    </select>
                                </fieldset>
                                <fieldset class="fieldset">
                                    <label
                                        for="hook-priority-{index}"
                                        class="fieldset-legend text-sm">Priority</label
                                    >
                                    <input
                                        type="number"
                                        id="hook-priority-{index}"
                                        class="input input-sm w-full"
                                        value={hook.meta.priority}
                                        oninput={(e) =>
                                            updateHook(activeHookType, index, {
                                                ...hook,
                                                meta: {
                                                    ...hook.meta,
                                                    priority: parseInt(e.currentTarget.value) || 0,
                                                },
                                            })}
                                    />
                                </fieldset>
                            </div>

                            <div class="flex flex-wrap gap-2">
                                {#if hook.meta.type === "string"}
                                    <label class="label cursor-pointer gap-2">
                                        <input
                                            type="checkbox"
                                            class="checkbox checkbox-sm"
                                            checked={hook.meta.caseSensitive}
                                            onchange={(e) =>
                                                updateHook(activeHookType, index, {
                                                    ...hook,
                                                    meta: {
                                                        type: "string" as const,
                                                        caseSensitive: e.currentTarget.checked,
                                                        isInputPatternScripted:
                                                            hook.meta.isInputPatternScripted,
                                                        isOutputScripted:
                                                            hook.meta.isOutputScripted,
                                                        priority: hook.meta.priority,
                                                    },
                                                })}
                                        />
                                        <span class="label-text text-sm">Case Sensitive</span>
                                    </label>
                                {/if}
                                <label class="label cursor-pointer gap-2">
                                    <input
                                        type="checkbox"
                                        class="checkbox checkbox-sm"
                                        checked={hook.meta.isOutputScripted}
                                        onchange={(e) =>
                                            updateHook(activeHookType, index, {
                                                ...hook,
                                                meta: {
                                                    ...hook.meta,
                                                    isOutputScripted: e.currentTarget.checked,
                                                },
                                            })}
                                    />
                                    <span class="label-text text-sm">Scripted Output</span>
                                </label>
                            </div>

                            <div class="flex justify-end">
                                <button
                                    class="btn btn-sm btn-error btn-outline gap-1"
                                    onclick={() => deleteHook(activeHookType, index)}
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
