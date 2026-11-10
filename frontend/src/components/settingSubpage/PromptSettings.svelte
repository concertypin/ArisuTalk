<script lang="ts">
    import { settings } from "@/lib/stores/settings.svelte";
    import BookOpen from "phosphor-svelte/lib/BookOpenIcon";
    import PromptTemplateManager from "@/features/promptTemplate/components/PromptTemplateManager.svelte";

    let showTemplateManager = $state(false);

    /** Canonical section definitions. */
    const SECTION_DEFS = [
        {
            key: "system" as const,
            label: "System Prompt",
            desc: "Base generation prompt from this page",
        },
        {
            key: "character" as const,
            label: "Character",
            desc: "Character persona (prompt.description)",
        },
        { key: "persona" as const, label: "Persona", desc: "User persona description" },
        { key: "lore" as const, label: "Lore", desc: "Active lorebook entries (always-on)" },
    ];

    /** Section key union type. */
    type SectionKey = (typeof SECTION_DEFS)[number]["key"];

    /**
     * Get the enabled state for a section.
     * Defaults to `true` if no override exists.
     */
    function isSectionEnabled(key: SectionKey): boolean {
        const override = settings.value.prompt.promptSections?.find((s) => s.key === key);
        return override?.enabled ?? true;
    }

    /** Whether all prompt sections are disabled. */
    const allDisabled = $derived(SECTION_DEFS.every((s) => !isSectionEnabled(s.key)));

    /** Toggle a section on/off. */
    function toggleSection(key: SectionKey) {
        const current = settings.value.prompt.promptSections ?? [];
        const idx = current.findIndex((s) => s.key === key);
        settings.value.prompt.promptSections =
            idx >= 0
                ? current.map((s, i) => (i === idx ? { key, enabled: !s.enabled } : s))
                : [...current, { key, enabled: false }];
        void settings.save();
    }

    function onApplyTemplate(prompts: { system: string; generation: string; lore?: string }) {
        settings.value.prompt.generationPrompt =
            prompts.generation || settings.value.prompt.generationPrompt;
        void settings.save();
    }
</script>

<div class="space-y-6">
    <h3 class="text-lg font-semibold">Prompt Settings</h3>

    <!-- System Prompt -->
    <fieldset class="fieldset w-full">
        <legend class="fieldset-legend">System Prompt</legend>
        <textarea
            id="prompt-system"
            class="textarea h-32 w-full"
            bind:value={settings.value.prompt.generationPrompt}
            placeholder="You are a helpful assistant..."
        ></textarea>
        <div class="label">
            <span class="label-text-alt"
                >This is the default system prompt used for new chats. Supports magic pattern syntax <code
                    >{"{| ... |}"}</code
                >.</span
            >
        </div>
    </fieldset>

    <!-- Prompt Sections -->
    <fieldset class="fieldset w-full">
        <legend class="fieldset-legend">Prompt Sections</legend>
        <p class="text-xs text-base-content/60 mb-3">
            Toggle which sections are included in the assembled system prompt sent to the LLM.
            Disabled sections are omitted entirely.
        </p>
        {#if allDisabled}
            <div class="alert alert-warning text-xs py-2 mb-3">
                All sections are disabled. The LLM will receive no system prompt.
            </div>
        {/if}
        <div class="space-y-2">
            {#each SECTION_DEFS as section (section.key)}
                {@const descId = `section-desc-${section.key}`}
                <label class="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        class="toggle toggle-sm toggle-primary"
                        aria-label={section.label}
                        aria-describedby={descId}
                        checked={isSectionEnabled(section.key)}
                        onchange={() => toggleSection(section.key)}
                    />
                    <div class="flex flex-col">
                        <span class="text-sm font-medium">{section.label}</span>
                        <span id={descId} class="text-xs text-base-content/50">{section.desc}</span>
                    </div>
                </label>
            {/each}
        </div>
    </fieldset>

    {#if showTemplateManager}
        <div class="border-t border-base-300 pt-4">
            <PromptTemplateManager
                onApply={onApplyTemplate}
                currentPrompts={{
                    system: "",
                    generation: settings.value.prompt.generationPrompt,
                    lore: "",
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
</div>
