<script lang="ts">
    /**
     * @component CharacterHooksSettings
     * Advanced settings: runtime configuration and replace hooks.
     * Fully editable hooks for display, input, output, request.
     */
    import type { Character } from "@arisutalk/character-spec/v0/Character";
    import Plus from "phosphor-svelte/lib/PlusIcon";
    import Trash from "phosphor-svelte/lib/TrashIcon";
    import CaretDown from "phosphor-svelte/lib/CaretDownIcon";
    import CaretUp from "phosphor-svelte/lib/CaretUpIcon";
    import Warning from "phosphor-svelte/lib/WarningIcon";
    import { merge, cloneDeep } from "lodash-es";
    import CharacterSettings from "./CharacterSettings.svelte";

    type ReplaceHook = Character["executables"]["replaceHooks"];
    type HookType = keyof ReplaceHook;
    type HookEntity = ReplaceHook[HookType][number];

    import type { TContext, TProps } from "./types.ts";

    let { context }: TProps<TContext> = $props();

    let { getCharacter, onCharacterChange } = $derived(context());

    let character = $derived(getCharacter());

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
        const newChar = cloneDeep(character);
        newChar.executables.runtimeSetting[field] = value;
        onCharacterChange(newChar);
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
        const newChar = cloneDeep(character);
        newChar.executables.replaceHooks[type].push(newHook);
        onCharacterChange(newChar);
        expandedHookIndex = character.executables.replaceHooks[type].length;
    }

    function updateHook(type: HookType, index: number, updates: Partial<HookEntity>) {
        const newChar = cloneDeep(character);
        const hook = newChar.executables.replaceHooks[type][index];
        newChar.executables.replaceHooks[type][index] = merge(hook, updates);
        onCharacterChange(newChar);
    }

    function deleteHook(type: HookType, index: number) {
        const newChar = cloneDeep(character);
        newChar.executables.replaceHooks[type].splice(index, 1);
        onCharacterChange(newChar);
        expandedHookIndex = null;
    }

    function toggleExpand(index: number) {
        expandedHookIndex = expandedHookIndex === index ? null : index;
    }
</script>

<CharacterSettings subpageName="Advanced Settings">
    <div class="alert alert-warning">
        <Warning size={18} />
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
            <Plus size={16} /> Add Hook
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
                            <CaretUp size={16} />
                        {:else}
                            <CaretDown size={16} />
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
                                                    meta: {
                                                        ...hook.meta,
                                                        type: "string",
                                                        caseSensitive: true,
                                                    },
                                                });
                                            } else {
                                                updateHook(activeHookType, index, {
                                                    meta: {
                                                        ...hook.meta,
                                                        type: "regex",
                                                        flag: "g",
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
                                                    meta: merge({}, hook.meta, {
                                                        caseSensitive: e.currentTarget.checked,
                                                    }),
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
                                    <Trash size={14} /> Delete
                                </button>
                            </div>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
</CharacterSettings>
