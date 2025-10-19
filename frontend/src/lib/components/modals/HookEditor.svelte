<script lang="ts">
    import { t } from "../../../i18n";
    import type { ReplaceHook, ReplaceRule } from "../../../types/replaceHook";
    import { generateId } from "../../stores/replaceHooks";
    import RuleItem from "./RuleItem.svelte";

    export let hook: ReplaceHook | null;
    export let hookType: "input" | "output" | "request" | "display";
    export let onSave: (hook: ReplaceHook) => void;
    export let onCancel: () => void;

    let formData = hook || {
        id: generateId(),
        name: "",
        description: "",
        type: hookType,
        enabled: true,
        priority: 0,
        rules: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    let editingRuleIndex: number | null = null;

    function addRule() {
        const newRule: ReplaceRule = {
            id: generateId(),
            name: "",
            enabled: true,
            from: "",
            to: "",
            useRegex: false,
            caseSensitive: false,
        };
        formData.rules = [...formData.rules, newRule];
    }

    function deleteRule(index: number) {
        formData.rules = formData.rules.filter((_, i) => i !== index);
    }

    function updateRule(index: number, rule: ReplaceRule) {
        formData.rules[index] = rule;
        editingRuleIndex = null;
    }

    function handleSave() {
        if (!formData.name.trim()) {
            alert(t("modal.replaceHooks.nameRequired"));
            return;
        }

        if (formData.rules.length === 0) {
            alert(t("modal.replaceHooks.rulesRequired"));
            return;
        }

        formData.updatedAt = Date.now();
        onSave(formData);
    }

    function toggleEnabled() {
        formData.enabled = !formData.enabled;
    }
</script>

<div class="hook-editor">
    <div class="editor-header">
        <h3>
            {hook
                ? t("modal.replaceHooks.editHook")
                : t("modal.replaceHooks.newHook")}
        </h3>
    </div>

    <div class="form-section">
        <label>
            <span class="label-text">{t("modal.replaceHooks.hookName")}</span>
            <input
                type="text"
                class="input-field"
                placeholder={t("modal.replaceHooks.hookNamePlaceholder")}
                bind:value={formData.name}
            />
        </label>

        <label>
            <span class="label-text"
                >{t("modal.replaceHooks.hookDescription")}</span
            >
            <textarea
                class="textarea-field"
                placeholder={t("modal.replaceHooks.hookDescriptionPlaceholder")}
                bind:value={formData.description}
                rows="2"
            ></textarea>
        </label>

        <label class="checkbox-label">
            <input
                type="checkbox"
                checked={formData.enabled}
                on:change={toggleEnabled}
            />
            <span>{t("modal.replaceHooks.enableHook")}</span>
        </label>
    </div>

    <div class="rules-section">
        <div class="section-header">
            <h4>{t("modal.replaceHooks.rules")}</h4>
            <span class="rule-count">{formData.rules.length}</span>
        </div>

        {#if formData.rules.length === 0}
            <div class="empty-rules">
                <p>{t("modal.replaceHooks.noRules")}</p>
            </div>
        {:else}
            <div class="rules-list">
                {#each formData.rules as rule, index (rule.id)}
                    {#if editingRuleIndex === index}
                        <RuleItem
                            {rule}
                            isEditing={true}
                            onSave={(updatedRule) =>
                                updateRule(index, updatedRule)}
                            onCancel={() => (editingRuleIndex = null)}
                            onDelete={() => deleteRule(index)}
                        />
                    {:else}
                        <RuleItem
                            {rule}
                            isEditing={false}
                            onEdit={() => (editingRuleIndex = index)}
                            onDelete={() => deleteRule(index)}
                        />
                    {/if}
                {/each}
            </div>
        {/if}

        <button class="btn-add-rule" on:click={addRule}>
            + {t("modal.replaceHooks.addRule")}
        </button>
    </div>

    <div class="editor-footer">
        <button class="btn-cancel" on:click={onCancel}>
            {t("common.cancel")}
        </button>
        <button class="btn-save" on:click={handleSave}>
            {t("common.save")}
        </button>
    </div>
</div>

<style>
    .hook-editor {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 1.5rem;
        background: var(--color-bg-secondary, #1f2937);
        border-radius: 0.5rem;
        border: 1px solid var(--color-border, #374151);
        color: var(--color-text, #ffffff);
    }

    .editor-header {
        padding-bottom: 1rem;
        border-bottom: 2px solid var(--color-border, #374151);
    }

    .editor-header h3 {
        margin: 0;
        font-size: 1.1rem;
    }

    .form-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    label {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .label-text {
        font-weight: 500;
        font-size: 0.9rem;
        color: var(--color-text, #ffffff);
    }

    .input-field,
    .textarea-field {
        padding: 0.6rem 0.8rem;
        border: 1px solid var(--color-border, #374151);
        border-radius: 0.3rem;
        font-family: inherit;
        font-size: 0.9rem;
        background: var(--color-bg-primary, #111827);
        color: var(--color-text, #ffffff);
    }

    .input-field:focus,
    .textarea-field:focus {
        outline: none;
        border-color: var(--color-primary, #3b82f6);
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .textarea-field {
        resize: vertical;
    }

    .checkbox-label {
        flex-direction: row;
        align-items: center;
        gap: 0.6rem;
    }

    .checkbox-label input {
        margin: 0;
        width: 18px;
        height: 18px;
        cursor: pointer;
    }

    .rules-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
        background: var(--color-bg-primary, #111827);
        border-radius: 0.5rem;
        border: 1px solid var(--color-border, #374151);
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 0.8rem;
        border-bottom: 1px solid var(--color-border, #374151);
    }

    .section-header h4 {
        margin: 0;
        font-size: 0.95rem;
        color: var(--color-text, #ffffff);
    }

    .rule-count {
        padding: 0.2rem 0.6rem;
        background: var(--color-bg-accent, #374151);
        border-radius: 0.3rem;
        font-size: 0.8rem;
        font-weight: 500;
        color: var(--color-text, #ffffff);
    }

    .empty-rules {
        text-align: center;
        padding: 1.5rem;
        color: var(--color-text-secondary, #9ca3af);
        font-style: italic;
    }

    .rules-list {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
    }

    .btn-add-rule {
        padding: 0.6rem 1rem;
        border: 2px dashed var(--color-primary, #3b82f6);
        background: transparent;
        color: var(--color-primary, #3b82f6);
        border-radius: 0.3rem;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    .btn-add-rule:hover {
        background: var(--color-primary, #3b82f6);
        color: white;
    }

    .editor-footer {
        display: flex;
        gap: 0.8rem;
        padding-top: 1rem;
        border-top: 1px solid var(--color-border, #374151);
    }

    .btn-cancel,
    .btn-save {
        flex: 1;
        padding: 0.7rem 1rem;
        border: none;
        border-radius: 0.3rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .btn-cancel {
        background: var(--color-bg-secondary, #374151);
        color: var(--color-text, #ffffff);
    }

    .btn-cancel:hover {
        background: var(--color-bg-tertiary, #4b5563);
    }

    .btn-save {
        background: var(--color-primary, #3b82f6);
        color: white;
    }

    .btn-save:hover {
        background: var(--color-primary-dark, #2563eb);
    }

    .btn-save:active {
        transform: scale(0.98);
    }
</style>
