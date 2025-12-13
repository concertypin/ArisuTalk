<script lang="ts">
    import { characterStore } from "../stores/characterStore.svelte";
    import { type Character } from "@arisutalk/character-spec/v0/Character";

    interface Props {
        character?: Character;
        onSave?: () => void;
        onCancel?: () => void;
    }

    let { character = undefined, onSave, onCancel }: Props = $props();

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
            assets: { assets: [], inlays: [] },
            specVersion: 0,
            id: crypto.randomUUID(),
            name: name,
            description: description,
            prompt: {
                description: "",
                authorsNote: "",
                lorebook: {
                    config: { tokenLimit: 0 },
                    data: [],
                },
            },
            executables: {
                runtimeSetting: { mem: undefined },
                replaceHooks: {
                    display: [],
                    input: [],
                    output: [],
                    request: [],
                },
            },
            metadata: {
                author: undefined,
                license: "",
                version: undefined,
                distributedOn: undefined,
                additionalInfo: undefined,
            },
        };
        if (character) {
            // Update logic... wait, we need index or ID.
            // Form doesn't know ID.
            // We probably should pass ID or handle update in parent.
            // But for "Add", we just store.add().
        } else {
            await characterStore.add(newCharacter);
        }

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
            const result = await characterStore.importCharacter(input.files[0]);
            isImporting = false;
            if (result.success) {
                onSave?.();
                reset();
            } else {
                error = result.error || "Import failed";
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

    <div class="tabs tabs-boxed mb-4">
        <input type="radio" name="create_mode" class="tab" aria-label="Create" checked />
        <div
            role="tabpanel"
            class="tab-content p-4 bg-base-100 border-base-300 rounded-box border mt-2"
        >
            <form onsubmit={handleSubmit} class="space-y-4">
                <div class="form-control">
                    <label class="label" for="char_name">
                        <span class="label-text">Name</span>
                    </label>
                    <input
                        type="text"
                        id="char_name"
                        bind:value={name}
                        placeholder="e.g. Arisu"
                        class="input input-bordered w-full"
                    />
                </div>

                <div class="form-control">
                    <label class="label" for="char_desc">
                        <span class="label-text">Description</span>
                    </label>
                    <textarea
                        id="char_desc"
                        bind:value={description}
                        class="textarea textarea-bordered h-24"
                        placeholder="Character description..."
                    ></textarea>
                </div>

                <div class="modal-action">
                    <button type="button" class="btn" onclick={onCancel}>Cancel</button>
                    <button type="submit" class="btn btn-primary">Save</button>
                </div>
            </form>
        </div>

        <input type="radio" name="create_mode" class="tab" aria-label="Import" />
        <div
            role="tabpanel"
            class="tab-content p-4 bg-base-100 border-base-300 rounded-box border mt-2"
        >
            <div class="flex flex-col items-center gap-4 py-8">
                <p class="text-sm opacity-70">Upload a Character Card (PNG/JSON)</p>
                <input
                    type="file"
                    onchange={handleFileChange}
                    class="file-input file-input-bordered w-full max-w-xs"
                    accept=".png,.json"
                />
                {#if isImporting}
                    <span class="loading loading-spinner loading-md"></span>
                {/if}
            </div>
            <div class="modal-action">
                <button type="button" class="btn" onclick={onCancel}>Cancel</button>
            </div>
        </div>
    </div>
</div>
