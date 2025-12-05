<script lang="ts">
import { t } from "$root/i18n";
import type { ReplaceRule } from "$types/replaceHook";

export let rule: ReplaceRule;
export let isEditing = false;
export let onEdit: (() => void) | undefined = undefined;
export let onSave: ((rule: ReplaceRule) => void) | undefined = undefined;
export let onCancel: (() => void) | undefined = undefined;
export let onDelete: (() => void) | undefined = undefined;

let editData = { ...rule };

function handleSave() {
    if (!editData.from.trim()) {
        alert(t("modal.replaceHooks.fromRequired"));
        return;
    }

    onSave?.(editData);
}

function handleCancel() {
    editData = { ...rule };
    onCancel?.();
}

function toggleEnabled() {
    if (isEditing) {
        editData.enabled = !editData.enabled;
    }
}

function toggleRegex() {
    if (isEditing) {
        editData.useRegex = !editData.useRegex;
    }
}

function toggleCaseSensitive() {
    if (isEditing) {
        editData.caseSensitive = !editData.caseSensitive;
    }
}
</script>

<div class="rule-item" class:editing={isEditing}>
    {#if !isEditing}
        <div class="rule-display">
            <div class="rule-content">
                <div class="rule-name">
                    <span
                        class="enabled-indicator"
                        class:disabled={!rule.enabled}>●</span
                    >
                    <span
                        >{rule.name ||
                            t("modal.replaceHooks.unnamedRule")}</span
                    >
                </div>
                <div class="rule-transformation">
                    <span class="from">{rule.from}</span>
                    <span class="arrow">→</span>
                    <span class="to">{rule.to}</span>
                </div>
                <div class="rule-flags">
                    {#if rule.useRegex}
                        <span class="flag regex"
                            >{t("modal.replaceHooks.regex")}</span
                        >
                    {/if}
                    {#if rule.caseSensitive}
                        <span class="flag case"
                            >{t("modal.replaceHooks.caseSensitive")}</span
                        >
                    {/if}
                </div>
            </div>
            <div class="rule-actions">
                <button
                    class="action-btn edit"
                    on:click={onEdit}
                    title={t("common.edit")}
                >
                    ✎
                </button>
                <button
                    class="action-btn delete"
                    on:click={onDelete}
                    title={t("common.delete")}
                >
                    ✕
                </button>
            </div>
        </div>
    {:else}
        <div class="rule-edit">
            <div class="edit-field">
                <label>
                    <span class="label-text"
                        >{t("modal.replaceHooks.ruleName")}</span
                    >
                    <input
                        type="text"
                        class="input-field"
                        placeholder={t(
                            "modal.replaceHooks.ruleNamePlaceholder"
                        )}
                        bind:value={editData.name}
                    />
                </label>
            </div>

            <div class="edit-row">
                <label class="edit-field">
                    <span class="label-text"
                        >{t("modal.replaceHooks.from")}</span
                    >
                    <input
                        type="text"
                        class="input-field"
                        placeholder={t("modal.replaceHooks.fromPlaceholder")}
                        bind:value={editData.from}
                    />
                </label>
                <label class="edit-field">
                    <span class="label-text">{t("modal.replaceHooks.to")}</span>
                    <input
                        type="text"
                        class="input-field"
                        placeholder={t("modal.replaceHooks.toPlaceholder")}
                        bind:value={editData.to}
                    />
                </label>
            </div>

            <div class="edit-flags">
                <label class="checkbox-flag">
                    <input
                        type="checkbox"
                        checked={editData.useRegex}
                        on:change={toggleRegex}
                    />
                    <span>{t("modal.replaceHooks.useRegex")}</span>
                </label>

                <label class="checkbox-flag">
                    <input
                        type="checkbox"
                        checked={editData.caseSensitive}
                        on:change={toggleCaseSensitive}
                    />
                    <span>{t("modal.replaceHooks.caseSensitive")}</span>
                </label>

                <label class="checkbox-flag">
                    <input
                        type="checkbox"
                        checked={editData.enabled}
                        on:change={toggleEnabled}
                    />
                    <span>{t("common.enabled")}</span>
                </label>
            </div>

            <div class="edit-actions">
                <button class="btn-cancel" on:click={handleCancel}>
                    {t("common.cancel")}
                </button>
                <button class="btn-save" on:click={handleSave}>
                    {t("common.save")}
                </button>
            </div>
        </div>
    {/if}
</div>

<style>
    .rule-item {
        padding: 0.8rem;
        border: 1px solid var(--color-border, #374151);
        border-radius: 0.3rem;
        background: var(--color-bg-primary, #111827);
        transition: all 0.2s ease;
    }

    .rule-item:hover:not(.editing) {
        border-color: var(--color-primary, #3b82f6);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
    }

    .rule-item.editing {
        background: var(--color-bg-tertiary, #374151);
        border-color: var(--color-primary, #3b82f6);
    }

    /* Display Mode */
    .rule-display {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }

    .rule-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .rule-name {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-weight: 500;
        font-size: 0.9rem;
    }

    .enabled-indicator {
        font-size: 0.6rem;
        color: var(--color-success, #28a745);
    }

    .enabled-indicator.disabled {
        color: var(--color-danger, #dc3545);
    }

    .rule-transformation {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
        font-family: monospace;
        background: var(--color-bg-accent, #374151);
        padding: 0.4rem 0.6rem;
        border-radius: 0.2rem;
        color: var(--color-text, #ffffff);
    }

    .from,
    .to {
        padding: 0 0.3rem;
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .from {
        color: var(--color-danger, #dc3545);
    }

    .to {
        color: var(--color-success, #28a745);
    }

    .arrow {
        color: var(--color-text-secondary, #999);
        font-weight: bold;
    }

    .rule-flags {
        display: flex;
        gap: 0.3rem;
        flex-wrap: wrap;
    }

    .flag {
        display: inline-block;
        padding: 0.2rem 0.5rem;
        border-radius: 0.2rem;
        font-size: 0.75rem;
        font-weight: 500;
    }

    .flag.regex {
        background: var(--color-info-bg, #0f172a);
        color: var(--color-info, #06b6d4);
    }

    .flag.case {
        background: var(--color-warning-bg, #1c1917);
        color: var(--color-warning, #f59e0b);
    }

    .rule-actions {
        display: flex;
        gap: 0.3rem;
    }

    .action-btn {
        padding: 0.4rem 0.6rem;
        border: 1px solid var(--color-border, #374151);
        background: transparent;
        cursor: pointer;
        border-radius: 0.2rem;
        transition: all 0.2s ease;
        color: var(--color-text, #ffffff);
    }

    .action-btn.edit {
        color: var(--color-primary, #3b82f6);
    }

    .action-btn.edit:hover {
        background: var(--color-primary, #3b82f6);
        color: white;
    }

    .action-btn.delete {
        color: var(--color-danger, #ef4444);
    }

    .action-btn.delete:hover {
        background: var(--color-danger, #ef4444);
        color: white;
    }

    /* Edit Mode */
    .rule-edit {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
    }

    .edit-field {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
    }

    .label-text {
        font-weight: 500;
        font-size: 0.8rem;
    }

    .input-field {
        padding: 0.5rem 0.6rem;
        border: 1px solid var(--color-border, #374151);
        border-radius: 0.2rem;
        font-family: monospace;
        font-size: 0.85rem;
        background: var(--color-bg-primary, #111827);
        color: var(--color-text, #ffffff);
    }

    .input-field:focus {
        outline: none;
        border-color: var(--color-primary, #3b82f6);
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .edit-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.8rem;
    }

    .edit-flags {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .checkbox-flag {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.85rem;
        cursor: pointer;
    }

    .checkbox-flag input {
        margin: 0;
        width: 16px;
        height: 16px;
        cursor: pointer;
    }

    .edit-actions {
        display: flex;
        gap: 0.6rem;
        padding-top: 0.6rem;
        border-top: 1px solid var(--color-border, #374151);
    }

    .btn-cancel,
    .btn-save {
        flex: 1;
        padding: 0.5rem;
        border: none;
        border-radius: 0.2rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.8rem;
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
</style>
