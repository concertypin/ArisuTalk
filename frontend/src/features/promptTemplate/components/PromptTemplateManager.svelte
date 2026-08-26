<script lang="ts">
    /**
     * @component PromptTemplateManager
     * Manage saved prompt templates for characters and global settings.
     * Allows creating, editing, deleting, previewing, and applying templates.
     */
    import { promptTemplateStore } from "@/features/promptTemplate/stores/promptTemplateStore.svelte";
    import type { PromptTemplate } from "@/features/promptTemplate";
    import FloppyDisk from "phosphor-svelte/lib/FloppyDiskIcon";
    import Plus from "phosphor-svelte/lib/PlusIcon";
    import Trash from "phosphor-svelte/lib/TrashIcon";
    import PencilSimple from "phosphor-svelte/lib/PencilSimpleIcon";
    import Eye from "phosphor-svelte/lib/EyeIcon";
    import X from "phosphor-svelte/lib/XIcon";
    import Copy from "phosphor-svelte/lib/CopyIcon";
    import { estimateTokens } from "@/lib/utils/tokenCounter";
    import { Logger } from "@common/logger/Logger";

    type Props = {
        /** Callback when a template is applied. Receives the template's prompts. */
        onApply?: (prompts: PromptTemplate["prompts"]) => void;
        /** Optional current prompt values to pre-fill when creating a template. */
        currentPrompts?: PromptTemplate["prompts"];
    };

    let { onApply, currentPrompts }: Props = $props();

    // --- Dialog state ---
    let isOpen = $state(false);
    let editingTemplate = $state<PromptTemplate | null>(null);
    let previewingTemplate = $state<PromptTemplate | null>(null);

    // --- Form state (for create/edit) ---
    let formName = $state("");
    let formDescription = $state("");
    let formPrompts = $state<PromptTemplate["prompts"]>({
        system: "",
        generation: "",
        lore: "",
    });
    let isFormValid = $derived(formName.trim().length > 0);

    let formSystemTokens = $derived(estimateTokens(formPrompts.system));
    let formGenerationTokens = $derived(estimateTokens(formPrompts.generation));
    let formLoreTokens = $derived(estimateTokens(formPrompts.lore ?? ""));
    let isEditing = $derived(editingTemplate !== null);

    function openCreate() {
        editingTemplate = null;
        formName = "";
        formDescription = "";
        formPrompts = {
            system: currentPrompts?.system ?? "",
            generation: currentPrompts?.generation ?? "",
            lore: currentPrompts?.lore ?? "",
        };
        isOpen = true;
    }

    function openEdit(template: PromptTemplate) {
        editingTemplate = template;
        formName = template.name;
        formDescription = template.description;
        formPrompts = { ...template.prompts };
        isOpen = true;
    }

    function close() {
        isOpen = false;
        editingTemplate = null;
        previewingTemplate = null;
    }

    async function handleSave() {
        if (!isFormValid) return;
        try {
            if (isEditing && editingTemplate) {
                await promptTemplateStore.update(editingTemplate.id, {
                    name: formName.trim(),
                    description: formDescription.trim(),
                    prompts: formPrompts,
                });
            } else {
                await promptTemplateStore.create({
                    name: formName.trim(),
                    description: formDescription.trim(),
                    prompts: formPrompts,
                });
            }
            close();
        } catch (err) {
            Logger.error("Failed to save prompt template", err);
        }
    }

    async function handleDelete(id: string) {
        try {
            await promptTemplateStore.delete(id);
            if (previewingTemplate?.id === id) {
                previewingTemplate = null;
            }
        } catch (err) {
            Logger.error("Failed to delete prompt template", err);
        }
    }

    function handleApply(template: PromptTemplate) {
        onApply?.(template.prompts);
    }

    // Wait for store to load on first render
    $effect(() => {
        void promptTemplateStore.initPromise;
    });
</script>

{#if isOpen}
    <!-- Create/Edit modal overlay -->
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onclick={() => close()}
        role="presentation"
    >
        <div
            class="modal-box max-w-2xl max-h-[80vh] flex flex-col"
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => {
                if (e.key === "Escape") close();
            }}
            role="dialog"
            aria-modal="true"
            tabindex="0"
            aria-label={isEditing ? "Edit template" : "New template"}
        >
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-bold">
                    {isEditing ? "Edit Template" : "New Template"}
                </h3>
                <button
                    type="button"
                    class="btn btn-ghost btn-sm btn-square"
                    onclick={() => close()}
                    aria-label="Close"
                >
                    <X size={20} />
                </button>
            </div>

            <div class="space-y-3 overflow-y-auto flex-1">
                <!-- Name -->
                <fieldset class="fieldset">
                    <label class="fieldset-label" for="template-name">Name</label>
                    <input
                        id="template-name"
                        type="text"
                        class="input w-full"
                        placeholder="My prompt template"
                        bind:value={formName}
                    />
                </fieldset>

                <!-- Description -->
                <fieldset class="fieldset">
                    <label class="fieldset-label" for="template-desc">Description (optional)</label>
                    <input
                        id="template-desc"
                        type="text"
                        class="input w-full"
                        placeholder="What is this template for?"
                        bind:value={formDescription}
                    />
                </fieldset>

                <!-- System prompt -->
                <fieldset class="fieldset">
                    <label class="fieldset-label" for="template-system"
                        >Character Description Prompt</label
                    >
                    <textarea
                        id="template-system"
                        class="textarea w-full h-24"
                        placeholder="System prompt / character description..."
                        bind:value={formPrompts.system}
                    ></textarea>
                    <span class="label-text-alt badge badge-ghost badge-xs"
                        >~{formSystemTokens} tokens</span
                    >
                </fieldset>

                <!-- Generation prompt -->
                <fieldset class="fieldset">
                    <label class="fieldset-label" for="template-generation"
                        >Generation / Instruction Prompt</label
                    >
                    <textarea
                        id="template-generation"
                        class="textarea w-full h-20"
                        bind:value={formPrompts.generation}
                    ></textarea>
                    <span class="label-text-alt badge badge-ghost badge-xs"
                        >~{formGenerationTokens} tokens</span
                    >
                </fieldset>

                <!-- Lore / Author's note -->
                <fieldset class="fieldset">
                    <label class="fieldset-label" for="template-lore"
                        >Lore / Author's Note (optional)</label
                    >
                    <textarea
                        id="template-lore"
                        class="textarea w-full h-16"
                        placeholder="Optional lore entries or author's note..."
                        bind:value={formPrompts.lore}
                    ></textarea>
                    <span class="label-text-alt badge badge-ghost badge-xs"
                        >~{formLoreTokens} tokens</span
                    >
                </fieldset>
            </div>

            <div class="modal-action">
                <button type="button" class="btn btn-ghost" onclick={() => close()}>Cancel</button>
                <button
                    type="button"
                    class="btn btn-primary"
                    disabled={!isFormValid}
                    onclick={handleSave}
                >
                    <FloppyDisk size={18} />
                    {isEditing ? "Save Changes" : "Save Template"}
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Template list -->
<div class="space-y-4">
    <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Prompt Templates</h3>
        <button type="button" class="btn btn-primary btn-sm" onclick={openCreate}>
            <Plus size={16} />
            New Template
        </button>
    </div>

    {#if !promptTemplateStore.loaded}
        <div class="flex justify-center py-8">
            <span class="loading loading-spinner loading-md"></span>
        </div>
    {:else if promptTemplateStore.templates.length === 0}
        <div class="text-center py-8 text-base-content/60">
            <p>No saved prompt templates yet.</p>
            <p class="text-sm mt-1">Create one to quickly apply prompt presets to characters.</p>
        </div>
    {:else}
        <div class="space-y-3">
            {#each promptTemplateStore.templates as template (template.id)}
                <div class="card bg-base-200 shadow-sm">
                    <div class="card-body p-4">
                        <div class="flex items-start justify-between">
                            <div class="flex-1 min-w-0">
                                <h4 class="font-semibold truncate">{template.name}</h4>
                                {#if template.description}
                                    <p class="text-sm text-base-content/70 line-clamp-2">
                                        {template.description}
                                    </p>
                                {/if}
                                <div class="flex flex-wrap gap-2 mt-2 text-xs text-base-content/50">
                                    <span title="Has character description prompt"
                                        >system: {template.prompts.system ? "✓" : "—"}</span
                                    >
                                    <span title="Has generation prompt"
                                        >generation: {template.prompts.generation ? "✓" : "—"}</span
                                    >
                                    <span title="Has lore/author's note"
                                        >lore: {template.prompts.lore ? "✓" : "—"}</span
                                    >
                                </div>
                            </div>

                            <div class="flex items-center gap-1 shrink-0 ml-2">
                                <!-- Preview -->
                                <button
                                    type="button"
                                    class="btn btn-ghost btn-xs btn-square"
                                    onclick={() => (previewingTemplate = template)}
                                    aria-label="Preview"
                                >
                                    <Eye size={16} />
                                </button>
                                <!-- Apply -->
                                <button
                                    type="button"
                                    class="btn btn-ghost btn-xs btn-square text-success"
                                    onclick={() => handleApply(template)}
                                    aria-label="Apply template"
                                >
                                    <Copy size={16} />
                                </button>
                                <!-- Edit -->
                                <button
                                    type="button"
                                    class="btn btn-ghost btn-xs btn-square"
                                    onclick={() => openEdit(template)}
                                    aria-label="Edit template"
                                >
                                    <PencilSimple size={16} />
                                </button>
                                <!-- Delete -->
                                <button
                                    type="button"
                                    class="btn btn-ghost btn-xs btn-square text-error"
                                    onclick={() => handleDelete(template.id)}
                                    aria-label="Delete template"
                                >
                                    <Trash size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<!-- Preview modal -->
{#if previewingTemplate}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onclick={() => (previewingTemplate = null)}
        role="presentation"
    >
        <div
            class="modal-box max-w-xl max-h-[80vh] flex flex-col"
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => {
                if (e.key === "Escape") previewingTemplate = null;
            }}
            role="dialog"
            aria-modal="true"
            tabindex="0"
            aria-label="Preview template"
        >
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-bold">{previewingTemplate.name}</h3>
                <button
                    type="button"
                    class="btn btn-ghost btn-sm btn-square"
                    onclick={() => (previewingTemplate = null)}
                    aria-label="Close preview"
                >
                    <X size={20} />
                </button>
            </div>

            <div class="overflow-y-auto flex-1 space-y-3">
                {#if previewingTemplate.description}
                    <div>
                        <span class="text-sm font-medium text-base-content/70">Description</span>
                        <p class="text-sm">{previewingTemplate.description}</p>
                    </div>
                {/if}

                <div>
                    <span class="text-sm font-medium text-base-content/70"
                        >Character / System Prompt</span
                    >
                    {#if previewingTemplate.prompts.system}
                        <pre
                            class="mt-1 p-3 bg-base-300 rounded-lg text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">{previewingTemplate
                                .prompts.system}</pre>
                    {:else}
                        <pre
                            class="mt-1 p-3 bg-base-300 rounded-lg text-sm whitespace-pre-wrap max-h-48 overflow-y-auto"><span
                                class="italic text-base-content/40">(empty)</span
                            ></pre>
                    {/if}
                </div>

                <div>
                    <span class="text-sm font-medium text-base-content/70"
                        >Generation / Instruction Prompt</span
                    >
                    {#if previewingTemplate.prompts.generation}
                        <pre
                            class="mt-1 p-3 bg-base-300 rounded-lg text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">{previewingTemplate
                                .prompts.generation}</pre>
                    {:else}
                        <pre
                            class="mt-1 p-3 bg-base-300 rounded-lg text-sm whitespace-pre-wrap max-h-32 overflow-y-auto"><span
                                class="italic text-base-content/40">(empty)</span
                            ></pre>
                    {/if}
                </div>

                {#if previewingTemplate.prompts.lore}
                    <div>
                        <span class="text-sm font-medium text-base-content/70"
                            >Lore / Author's Note</span
                        >
                        <pre
                            class="mt-1 p-3 bg-base-300 rounded-lg text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">{previewingTemplate
                                .prompts.lore}</pre>
                    </div>
                {/if}
            </div>

            <div class="modal-action">
                <button
                    type="button"
                    class="btn btn-primary"
                    onclick={() => {
                        handleApply(previewingTemplate!);
                        previewingTemplate = null;
                    }}
                >
                    <Copy size={18} />
                    Apply Template
                </button>
                <button
                    type="button"
                    class="btn btn-ghost"
                    onclick={() => (previewingTemplate = null)}
                >
                    Close
                </button>
            </div>
        </div>
    </div>
{/if}
