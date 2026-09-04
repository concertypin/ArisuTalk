<script module>
    import PencilIcon from "phosphor-svelte/lib/PencilIcon";
    import TrashIcon from "phosphor-svelte/lib/TrashIcon";
    import ArrowClockwiseIcon from "phosphor-svelte/lib/ArrowClockwiseIcon";
    import CheckIcon from "phosphor-svelte/lib/CheckIcon";
    import XIcon from "phosphor-svelte/lib/XIcon";
    import type { Component } from "svelte";

    const noOp = () => undefined;
</script>

<!--
  @component MessageActions
  Action buttons for message edit/delete/regenerate.
  Shows on hover and provides controls for message manipulation.
-->
<script lang="ts">
    let {
        isEditing = false,
        isAssistant = false,
        onEdit = noOp,
        onDelete = noOp,
        onRegenerate = noOp,
        onConfirmEdit = noOp,
        onCancelEdit = noOp,
    }: {
        /** Whether this message is currently being edited */
        isEditing?: boolean;
        /** is AI Assistant's message? */
        isAssistant?: boolean;
        /** Callback when edit button is clicked */
        onEdit?: () => void;
        /** Callback when delete button is clicked */
        onDelete?: () => void;
        /** Callback when regenerate button is clicked (assistant messages only) */
        onRegenerate?: () => void;
        /** Callback when edit is confirmed */
        onConfirmEdit?: () => void;
        /** Callback when edit is cancelled */
        onCancelEdit?: () => void;
    } = $props();

    // Delete confirmation state
    let isConfirmingDelete = $state(false);

    // Auto-reset delete confirmation with proper cleanup
    $effect(() => {
        if (isConfirmingDelete) {
            const timeoutId = setTimeout(() => {
                isConfirmingDelete = false;
            }, 3000);

            return () => {
                clearTimeout(timeoutId);
            };
        }
    });

    /**
     * Handles the delete button click.
     * On first click, enters confirmation mode. On second click, performs deletion.
     */
    function handleDeleteClick() {
        if (isConfirmingDelete) {
            onDelete();
            isConfirmingDelete = false;
        } else {
            isConfirmingDelete = true;
        }
    }

    /**
     * Cancels the delete confirmation and resets the state.
     */
    function cancelDelete() {
        isConfirmingDelete = false;
    }
</script>

{#snippet Button(onclick: () => void, title: string, Icon: Component, textType?: string)}
    <button class="btn btn-xs btn-ghost btn-circle" {onclick} {title}>
        <Icon class="w-3.5 h-3.5 {textType ?? ''}" />
    </button>
{/snippet}

<div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
    {#if isEditing}
        {@render Button(onConfirmEdit, "Save edit (Ctrl+Enter)", CheckIcon, "text-success")}
        {@render Button(onCancelEdit, "Cancel edit (Esc)", XIcon, "text-error")}
    {:else if isConfirmingDelete}
        {@render Button(handleDeleteClick, "Click again to confirm delete", TrashIcon)}
        {@render Button(cancelDelete, "Cancel delete", XIcon)}
    {:else}
        {@render Button(onEdit, "Edit message", PencilIcon)}
        {@render Button(handleDeleteClick, "Delete message", TrashIcon)}
        {#if isAssistant}
            {@render Button(onRegenerate, "Regenerate response", ArrowClockwiseIcon)}
        {/if}
    {/if}
</div>
