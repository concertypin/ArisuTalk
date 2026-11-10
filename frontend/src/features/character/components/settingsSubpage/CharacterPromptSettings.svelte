<script lang="ts">
    /**
     * @component CharacterPromptSettings
     * AI prompt configuration: description prompt and author's note.
     * Features expandable textarea (small at first, large on click).
     */
    import type { Character } from "@arisutalk/character-spec/v0/Character";
    import CornersOut from "phosphor-svelte/lib/CornersOutIcon";
    import CornersIn from "phosphor-svelte/lib/CornersInIcon";
    import BookOpen from "phosphor-svelte/lib/BookOpenIcon";
    import { merge } from "lodash-es";
    import PromptTemplateManager from "@/features/promptTemplate/components/PromptTemplateManager.svelte";
    import { estimateTokens } from "@/lib/utils/tokenCounter";
    import CharacterSettings from "./CharacterSettings.svelte";

    import type { TContext, TProps } from "./types.ts";

    let { context }: TProps<TContext> = $props();

    let { getCharacter, onCharacterChange } = $derived(context());

    let character = $derived(getCharacter());

    let descriptionTokens = $derived(estimateTokens(character.prompt.description));
    let authorsNoteTokens = $derived(estimateTokens(character.prompt.authorsNote ?? ""));

    let isDescriptionExpanded = $state(false);
    let showTemplateManager = $state(false);

    function onApplyTemplate(prompts: { system: string; generation: string; lore?: string }) {
        onCharacterChange(
            merge({}, character, {
                prompt: {
                    description: prompts.system,
                    authorsNote: prompts.lore || undefined,
                },
            })
        );
    }
    let isAuthorsNoteExpanded = $state(false);

    function updatePromptField<K extends keyof Character["prompt"]>(
        field: K,
        value: Character["prompt"][K]
    ) {
        onCharacterChange(
            merge({}, character, {
                prompt: { [field]: value },
            })
        );
    }
</script>

<CharacterSettings subpageName="Prompt Configuration">
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
            <span class="label-text-alt badge badge-ghost badge-sm"
                >~{descriptionTokens} tokens</span
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
            <span class="label-text-alt badge badge-ghost badge-sm"
                >~{authorsNoteTokens} tokens</span
            >
        </div>
    </fieldset>

    {#if showTemplateManager}
        <div class="border-t border-base-300 pt-4">
            <PromptTemplateManager
                onApply={onApplyTemplate}
                currentPrompts={{
                    system: character.prompt.description,
                    generation: "",
                    lore: character.prompt.authorsNote,
                }}
            />
        </div>
    {/if}

    <button
        type="button"
        class="btn btn-ghost btn-sm"
        onclick={() => (showTemplateManager = !showTemplateManager)}
    >
        <BookOpen size={16} />
        {showTemplateManager ? "Hide Templates" : "Load Template"}
    </button>
</CharacterSettings>
