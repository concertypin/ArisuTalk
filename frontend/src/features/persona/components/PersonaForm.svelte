<script lang="ts">
    import { personaStore } from "../stores/personaStore.svelte";
    import { PersonaSchema, type Persona } from "../schema";
    import PlusIcon from "phosphor-svelte/lib/PlusIcon";
    import UserIcon from "phosphor-svelte/lib/UserIcon";
    import FileTextIcon from "phosphor-svelte/lib/FileTextIcon";
    import NoteIcon from "phosphor-svelte/lib/NoteIcon";
    import PencilSimpleIcon from "phosphor-svelte/lib/PencilSimpleIcon";
    import ShieldIcon from "phosphor-svelte/lib/ShieldIcon";
    import { ZodError } from "zod";

    type Props = {
        persona?: Persona;
        onSave: () => void;
        onCancel: () => void;
    };

    let { persona = undefined, onSave, onCancel }: Props = $props();

    let name = $state("");
    let description = $state("");
    let note = $state("");
    let allowLowLevelAccess = $state(false);
    let error = $state("");

    $effect(() => {
        if (persona) {
            name = persona.name;
            description = persona.description;
            note = persona.note || "";
            allowLowLevelAccess = persona.allowLowLevelAccess ?? false;
        } else {
            name = "";
            description = "";
            note = "";
            allowLowLevelAccess = false;
        }
    });

    async function handleSubmit(e: Event) {
        e.preventDefault();
        try {
            const newPersona = {
                id: persona?.id || crypto.randomUUID(),
                name,
                description,
                note: note || undefined,
                allowLowLevelAccess,
                assets: { assets: [], inlays: [] },
            };

            const validated = PersonaSchema.parse(newPersona);
            if (persona) {
                personaStore.update(persona.id, validated);
            } else {
                personaStore.add(validated);
            }
            onSave();
        } catch (err: unknown) {
            if (err instanceof ZodError) {
                const firstIssue = err.issues[0];
                error = firstIssue?.message ?? "Validation failed";
            } else if (err instanceof Error) {
                error = err.message ?? "Unknown error";
            } else {
                error = "Unknown error";
            }
        }
    }
</script>

<div class="flex flex-col h-full">
    <div class="flex items-center gap-2 mb-6 pb-2 border-b border-base-300">
        {#if persona}
            <PencilSimpleIcon class="w-5 h-5 text-primary" />
            <h3 class="font-bold text-lg">Edit Persona</h3>
        {:else}
            <PlusIcon class="w-5 h-5 text-primary" />
            <h3 class="font-bold text-lg">Create New Persona</h3>
        {/if}
    </div>

    <form onsubmit={handleSubmit} class="space-y-4 flex-1 overflow-y-auto p-1">
        {#if error}
            <div class="alert alert-error text-sm py-2 shadow-sm rounded-lg">
                <span>{error}</span>
            </div>
        {/if}

        <fieldset class="fieldset w-full">
            <label for="p_name" class="fieldset-legend flex items-center gap-2">
                <UserIcon size={16} /> Name (Display Name)
            </label>
            <input
                type="text"
                id="p_name"
                bind:value={name}
                class="input w-full"
                placeholder="e.g. User-kun"
            />
        </fieldset>

        <fieldset class="fieldset w-full">
            <label for="p_desc" class="fieldset-legend flex items-center gap-2">
                <FileTextIcon size={16} /> Description (For AI)
                <span class="text-xs opacity-60 ml-auto">Visible to character</span>
            </label>
            <textarea
                id="p_desc"
                bind:value={description}
                class="textarea h-32 w-full"
                placeholder="Describe this persona for the AI..."
            ></textarea>
        </fieldset>

        <fieldset class="fieldset w-full">
            <label for="p_note" class="fieldset-legend flex items-center gap-2">
                <NoteIcon size={16} /> Note (Private)
            </label>
            <textarea
                id="p_note"
                bind:value={note}
                class="textarea h-20 w-full"
                placeholder="Personal notes (not sent to AI)..."
            ></textarea>
        </fieldset>

        <fieldset class="fieldset w-full">
            <label for="p_low_level" class="fieldset-legend flex items-center gap-2">
                <ShieldIcon size={16} /> Low-Level Access
            </label>
            <div class="flex items-center gap-4 bg-base-200 p-3 rounded-lg border border-base-300">
                <input
                    type="checkbox"
                    id="p_low_level"
                    bind:checked={allowLowLevelAccess}
                    class="toggle toggle-warning"
                />
                <div class="flex flex-col">
                    <span class="text-sm font-medium">Allow script network access</span>
                    <span class="text-xs opacity-60"
                        >Grant permission for character scripts to make network requests.</span
                    >
                </div>
            </div>
        </fieldset>

        <div class="modal-action pt-4 border-t border-base-200 mt-6">
            <button type="button" class="btn btn-neutral" onclick={onCancel}>Cancel</button>
            <button type="submit" class="btn btn-primary px-8">Save Persona</button>
        </div>
    </form>
</div>
