<script lang="ts">
    import { CloudUpload } from "@lucide/svelte";
    import { characterStore } from "../stores/characterStore.svelte";
    import { type Character } from "@arisutalk/character-spec/v0/Character";

    interface Props {
        character?: Character;
        onSave?: () => void;
        onCancel?: () => void;
        onSubmit?: (character: Character) => void;
    }

    let { character = undefined, onSave, onCancel, onSubmit }: Props = $props();

    let name = $state("");
    let description = $state("");
    let isImporting = $state(false);
    let error = $state("");

    $effect(() => {
        name = character?.name ?? "";
        description = character?.description ?? "";
    });

    async function handleSubmit(e: Event) {
        e.preventDefault();

        if (!name.trim()) {
            error = "Name is required";
            return;
        }

        const newCharacter: Character = {
            ...character, // Keep existing fields if editing
            assets: character?.assets || { assets: [] },
            specVersion: 0,
            id: character?.id || crypto.randomUUID(),
            name: name,
            description: description,
            prompt: character?.prompt || {
                description: "",
                authorsNote: "",
                lorebook: {
                    config: { tokenLimit: 0 },
                    data: [],
                },
            },
            executables: character?.executables || {
                runtimeSetting: { mem: undefined },
                replaceHooks: {
                    display: [],
                    input: [],
                    output: [],
                    request: [],
                },
            },
            metadata: character?.metadata || {
                author: undefined,
                license: "",
                version: undefined,
                distributedOn: undefined,
                additionalInfo: undefined,
            },
        };

        onSubmit?.(newCharacter);

        onSave?.();
        reset();
    }

    function reset() {
        name = "";
        description = "";
        error = "";
    }

    async function handleFileChange(e: Event & { currentTarget: HTMLInputElement }) {
        const input = e.currentTarget;
        if (input.files && input.files.length > 0) {
            isImporting = true;
            error = "";
            try {
                const result = await characterStore.importCharacter(input.files[0]);
                if (result.success) {
                    onSave?.();
                    reset();
                } else {
                    error = result.error || "Import failed";
                }
            } finally {
                isImporting = false;
                // Reset the file input so the same file can be re-imported
                try {
                    input.value = "";
                } catch {
                    // ignore
                }
            }
        }
    }
</script>

<div class="p-6">
    <h3 class="font-bold text-lg mb-4">{character ? "Edit Character" : "New Character"}</h3>

    {#if error}
        <div class="alert alert-error mb-4">
            <span>{error}</span>
        </div>
    {/if}

    <div class="mt-2">
        <div role="tablist" class="tabs tabs-lifted">
            <input type="radio" name="create_mode" class="tab" aria-label="Create New" checked />
            <div role="tabpanel" class="tab-content bg-base-100 border-base-300 rounded-box p-6">
                <form onsubmit={handleSubmit} class="space-y-4">
                    <fieldset class="fieldset w-full">
                        <legend class="fieldset-legend">Name</legend>
                        <input
                            type="text"
                            id="char_name"
                            bind:value={name}
                            placeholder="e.g. Arisu"
                            class="input w-full"
                        />
                    </fieldset>

                    <fieldset class="fieldset w-full">
                        <legend class="fieldset-legend">Description</legend>
                        <textarea
                            id="char_desc"
                            bind:value={description}
                            class="textarea h-32 w-full"
                            placeholder="Character description..."
                        ></textarea>
                    </fieldset>

                    <div class="modal-action mt-6">
                        <button type="button" class="btn btn-neutral" onclick={onCancel}
                            >Cancel</button
                        >
                        <button type="submit" class="btn btn-primary px-8">Save Character</button>
                    </div>
                </form>
            </div>

            <input type="radio" name="create_mode" class="tab" aria-label="Import Card" />
            <div role="tabpanel" class="tab-content bg-base-100 border-base-300 rounded-box p-6">
                <div class="flex flex-col items-center gap-6 py-8">
                    <div
                        class="w-full max-w-sm border-2 border-dashed border-base-300 rounded-xl bg-base-100 hover:bg-base-200 transition-colors cursor-pointer relative flex flex-col items-center justify-center p-8 text-center group"
                    >
                        <input
                            type="file"
                            onchange={handleFileChange}
                            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            accept=".arisc,.arisp"
                        />
                        <div
                            class="mb-3 p-4 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform"
                        >
                            <CloudUpload />
                        </div>
                        <h4 class="font-bold text-lg mb-1">Click to Upload</h4>
                        <p class="text-sm opacity-60">
                            or drag and drop Character Card (.arisc/.arisp)
                        </p>
                    </div>

                    {#if isImporting}
                        <div class="flex items-center gap-2 text-primary">
                            <span class="loading loading-spinner loading-md"></span>
                            <span class="text-sm font-medium">Importing character...</span>
                        </div>
                    {/if}

                    {#if error}
                        <div class="alert alert-error text-sm py-2 w-full max-w-sm mt-2">
                            {error}
                        </div>
                    {/if}
                </div>
                <div class="modal-action">
                    <button type="button" class="btn btn-neutral" onclick={onCancel}>Cancel</button>
                </div>
            </div>
        </div>
    </div>
</div>
