<script lang="ts">
import { t } from "$root/i18n";
import type {
	ReplaceHook,
	ReplaceHookType,
	ReplaceHooksConfig,
} from "$types/replaceHook";

import {
	addHook,
	deleteHook,
	moveHookDown,
	moveHookUp,
	replaceHooks,
	updateHook,
} from "../../stores/replaceHooks";
import HookEditor from "./HookEditor.svelte";

let selectedType: ReplaceHookType = "input";
let editingHook: ReplaceHook | null = null;
let isAddingNew = false;

$: hooks = $replaceHooks[
	`${selectedType}Hooks` as keyof ReplaceHooksConfig
] satisfies ReplaceHook[];

function handleAddHook() {
	isAddingNew = true;
	editingHook = null;
}

function handleEditHook(hook: ReplaceHook) {
	editingHook = hook;
	isAddingNew = false;
}

function handleSaveHook(hook: ReplaceHook) {
	if (isAddingNew) {
		addHook(hook);
	} else if (editingHook) {
		updateHook(selectedType, hook.id, hook);
	}
	editingHook = null;
	isAddingNew = false;
}

function handleDeleteHook(hookId: string) {
	if (confirm(t("modal.replaceHooks.deleteConfirm"))) {
		deleteHook(selectedType, hookId);
	}
}

function handleMoveUp(hookId: string) {
	moveHookUp(selectedType, hookId);
}

function handleMoveDown(hookId: string) {
	moveHookDown(selectedType, hookId);
}

function getHookTypeLabel(type: ReplaceHookType): string {
	const labels: Record<ReplaceHookType, string> = {
		input: t("modal.replaceHooks.inputType"),
		output: t("modal.replaceHooks.outputType"),
		request: t("modal.replaceHooks.requestType"),
		display: t("modal.replaceHooks.displayType"),
	};
	return labels[type];
}

function getHookTypeDescription(type: ReplaceHookType): string {
	const descriptions: Record<ReplaceHookType, string> = {
		input: t("modal.replaceHooks.inputDesc"),
		output: t("modal.replaceHooks.outputDesc"),
		request: t("modal.replaceHooks.requestDesc"),
		display: t("modal.replaceHooks.displayDesc"),
	};
	return descriptions[type];
}
</script>

<div class="hook-manager">
    <div class="header">
        <h2>{t("modal.replaceHooks.title")}</h2>
        <p class="subtitle">{t("modal.replaceHooks.subtitle")}</p>
    </div>

    {#if editingHook || isAddingNew}
        <HookEditor
            hook={editingHook}
            hookType={selectedType}
            onSave={handleSaveHook}
            onCancel={() => {
                editingHook = null;
                isAddingNew = false;
            }}
        />
    {:else}
        <div class="type-selector">
            {#each ["input", "output", "request", "display"] as type (type)}
                <button
                    class="type-button"
                    class:active={selectedType === type}
                    on:click={() => (selectedType = type as ReplaceHookType)}
                >
                    <span class="label"
                        >{getHookTypeLabel(type as ReplaceHookType)}</span
                    >
                    <span class="count"
                        >{$replaceHooks[
                            (type + "Hooks") as keyof ReplaceHooksConfig
                        ].length}</span
                    >
                </button>
            {/each}
        </div>

        <div class="type-description">
            {getHookTypeDescription(selectedType)}
        </div>

        <div class="hooks-list">
            {#if hooks.length === 0}
                <div class="empty-state">
                    <p>{t("modal.replaceHooks.noHooks")}</p>
                </div>
            {:else}
                <div class="hooks-container">
                    {#each hooks as hook, index (hook.id)}
                        <div class="hook-item">
                            <div class="hook-header">
                                <div class="hook-info">
                                    <h3>{hook.name}</h3>
                                    <p class="hook-description">
                                        {hook.description}
                                    </p>
                                    <span class="rule-count"
                                        >{hook.rules.length}
                                        {t("modal.replaceHooks.rules")}</span
                                    >
                                </div>
                                <div class="hook-status">
                                    <span
                                        class="enabled-badge"
                                        class:disabled={!hook.enabled}
                                    >
                                        {hook.enabled
                                            ? t("common.enabled")
                                            : t("common.disabled")}
                                    </span>
                                    <span class="priority-badge"
                                        >#{index + 1}</span
                                    >
                                </div>
                            </div>

                            <div class="hook-actions">
                                <button
                                    class="action-btn edit"
                                    on:click={() => handleEditHook(hook)}
                                    title={t("common.edit")}
                                >
                                    ✎
                                </button>

                                {#if index > 0}
                                    <button
                                        class="action-btn move-up"
                                        on:click={() => handleMoveUp(hook.id)}
                                        title={t("modal.replaceHooks.moveUp")}
                                    >
                                        ↑
                                    </button>
                                {/if}

                                {#if index < hooks.length - 1}
                                    <button
                                        class="action-btn move-down"
                                        on:click={() => handleMoveDown(hook.id)}
                                        title={t("modal.replaceHooks.moveDown")}
                                    >
                                        ↓
                                    </button>
                                {/if}

                                <button
                                    class="action-btn delete"
                                    on:click={() => handleDeleteHook(hook.id)}
                                    title={t("common.delete")}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        <div class="footer">
            <button class="btn-primary" on:click={handleAddHook}>
                + {t("modal.replaceHooks.addHook")}
            </button>
        </div>
    {/if}
</div>

<style>
    .hook-manager {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 1.5rem;
        max-width: 800px;
        margin: 0 auto;
    }

    .header {
        text-align: center;
        margin-bottom: 1rem;
    }

    .header h2 {
        margin: 0;
        font-size: 1.5rem;
    }

    .subtitle {
        margin: 0.5rem 0 0 0;
        opacity: 0.7;
        font-size: 0.9rem;
    }

    .type-selector {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 0.5rem;
    }

    .type-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.3rem;
        padding: 0.8rem;
        border: 2px solid var(--color-border, #374151);
        background: var(--color-bg-secondary, #1f2937);
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.85rem;
        color: var(--color-text, #ffffff);
    }

    .type-button:hover {
        border-color: var(--color-primary, #3b82f6);
        background: var(--color-bg-tertiary, #374151);
    }

    .type-button.active {
        border-color: var(--color-primary, #3b82f6);
        background: var(--color-primary, #3b82f6);
        color: white;
    }

    .type-button .label {
        font-weight: 500;
    }

    .type-button .count {
        font-size: 0.75rem;
        opacity: 0.7;
    }

    .type-description {
        padding: 0.8rem 1rem;
        background: var(--color-bg-info, #1e293b);
        border-left: 3px solid var(--color-primary, #3b82f6);
        border-radius: 0.3rem;
        font-size: 0.9rem;
        color: var(--color-text-secondary, #9ca3af);
    }

    .hooks-list {
        min-height: 200px;
    }

    .empty-state {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        color: var(--color-text-secondary, #9ca3af);
        font-style: italic;
    }

    .hooks-container {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
    }

    .hook-item {
        padding: 1rem;
        border: 1px solid var(--color-border, #374151);
        border-radius: 0.5rem;
        background: var(--color-bg-secondary, #1f2937);
        transition: all 0.2s ease;
        color: var(--color-text, #ffffff);
    }

    .hook-item:hover {
        border-color: var(--color-primary, #3b82f6);
        background: var(--color-bg-tertiary, #374151);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .hook-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.8rem;
    }

    .hook-info h3 {
        margin: 0;
        font-size: 1rem;
    }

    .hook-description {
        margin: 0.3rem 0 0 0;
        font-size: 0.85rem;
        opacity: 0.8;
        color: var(--color-text-secondary, #9ca3af);
    }

    .rule-count {
        display: inline-block;
        margin-top: 0.3rem;
        padding: 0.2rem 0.6rem;
        background: var(--color-bg-accent, #374151);
        border-radius: 0.3rem;
        font-size: 0.8rem;
        color: var(--color-text, #ffffff);
    }

    .hook-status {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        align-items: flex-end;
    }

    .enabled-badge {
        padding: 0.3rem 0.6rem;
        border-radius: 0.3rem;
        font-size: 0.8rem;
        font-weight: 500;
        background: var(--color-success-bg, #065f46);
        color: var(--color-success, #10b981);
    }

    .enabled-badge.disabled {
        background: var(--color-danger-bg, #7f1d1d);
        color: var(--color-danger, #ef4444);
    }

    .priority-badge {
        padding: 0.3rem 0.6rem;
        border-radius: 0.3rem;
        font-size: 0.8rem;
        font-weight: 500;
        background: var(--color-bg-accent, #374151);
        color: var(--color-text-secondary, #9ca3af);
    }

    .hook-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .action-btn {
        padding: 0.4rem 0.8rem;
        border: 1px solid var(--color-border, #374151);
        border-radius: 0.3rem;
        background: var(--color-bg-secondary, #1f2937);
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.9rem;
        min-width: 40px;
        color: var(--color-text, #ffffff);
    }

    .action-btn:hover {
        background: var(--color-bg-tertiary, #374151);
    }

    .action-btn.edit {
        color: var(--color-primary, #007bff);
    }

    .action-btn.edit:hover {
        background: var(--color-primary, #007bff);
        color: white;
    }

    .action-btn.move-up,
    .action-btn.move-down {
        color: var(--color-warning, #ff9800);
    }

    .action-btn.move-up:hover,
    .action-btn.move-down:hover {
        background: var(--color-warning, #ff9800);
        color: white;
    }

    .action-btn.delete {
        color: var(--color-danger, #dc3545);
    }

    .action-btn.delete:hover {
        background: var(--color-danger, #dc3545);
        color: white;
    }

    .footer {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--color-border, #374151);
    }

    .btn-primary {
        flex: 1;
        padding: 0.8rem 1rem;
        background: var(--color-primary, #3b82f6);
        color: white;
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    .btn-primary:hover {
        background: var(--color-primary-dark, #2563eb);
    }

    .btn-primary:active {
        transform: scale(0.98);
    }
</style>
