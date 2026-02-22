<script lang="ts">
    /**
     * @component CharacterPromptSettings
     * AI prompt configuration: description prompt and author's note.
     * Features expandable textarea (small at first, large on click).
     */
    import type { Character } from "@arisutalk/character-spec/v0/Character";
    import CornersOut from "phosphor-svelte/lib/CornersOut";
    import CornersIn from "phosphor-svelte/lib/CornersIn";
    import { merge } from "lodash-es";

    type Props = {
        character: Character;
        onChange: (character: Character) => void;
    };

    const { character, onChange }: Props = $props();

    let isDescriptionExpanded = $state(false);
    let isAuthorsNoteExpanded = $state(false);

    function updatePromptField<K extends keyof Character["prompt"]>(
        field: K,
        value: Character["prompt"][K]
    ) {
        onChange(
            merge({}, character, {
                prompt: { [field]: value },
            })
        );
    }
</script>

<div class="space-y-6">
    <h3 class="text-lg font-semibold">Prompt Configuration</h3>

    <fieldset class="fieldset w-full">
        <div class="flex items-center justify-between">
            <label for="prompt-desc" class="fieldset-legend">Character Prompt Description</label>
            <button
                type="button"
                class="btn btn-ghost btn-xs"
                onclick={() => (isDescriptionExpanded = !isDescriptionExpanded)}
                aria-label={isDescriptionExpanded ? "Collapse" : "Expand"}
            >
                {#if isDescriptionExpanded}
                    <CornersIn size={14} />
                {:else}
                    <CornersOut size={14} />
                {/if}
            </button>
        </div>
        <textarea
            id="prompt-desc"
            class="textarea w-full transition-all duration-200"
            class:h-24={!isDescriptionExpanded}
            class:h-96={isDescriptionExpanded}
            value={character.prompt.description}
            oninput={(e) => updatePromptField("description", e.currentTarget.value)}
            onfocus={() => (isDescriptionExpanded = true)}
            placeholder="Full character description for AI context..."
        ></textarea>
        <div class="label">
            <span class="label-text-alt"
                >Detailed character description sent to the AI. Include personality, background, and
                behavior instructions.</span
            >
        </div>
    </fieldset>

    <fieldset class="fieldset w-full">
        <div class="flex items-center justify-between">
            <label for="prompt-authors-note" class="fieldset-legend">Author's Note</label>
            <button
                type="button"
                class="btn btn-ghost btn-xs"
                onclick={() => (isAuthorsNoteExpanded = !isAuthorsNoteExpanded)}
                aria-label={isAuthorsNoteExpanded ? "Collapse" : "Expand"}
            >
                {#if isAuthorsNoteExpanded}
                    <CornersIn size={14} />
                {:else}
                    <CornersOut size={14} />
                {/if}
            </button>
        </div>
        <textarea
            id="prompt-authors-note"
            class="textarea w-full transition-all duration-200"
            class:h-16={!isAuthorsNoteExpanded}
            class:h-48={isAuthorsNoteExpanded}
            value={character.prompt.authorsNote || ""}
            oninput={(e) => updatePromptField("authorsNote", e.currentTarget.value || undefined)}
            onfocus={() => (isAuthorsNoteExpanded = true)}
            placeholder="Optional author's note..."
        ></textarea>
        <div class="label">
            <span class="label-text-alt"
                >Inserted as a mocked user message. Use for directing the AI's focus or style.</span
            >
        </div>
    </fieldset>
</div>
