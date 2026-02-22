<!--
  @component MessageActions
  Action buttons for message edit/delete/regenerate.
  Shows on hover and provides controls for message manipulation.
-->
<script lang="ts">
    import Pencil from "phosphor-svelte/lib/Pencil";
    import Trash from "phosphor-svelte/lib/Trash";
    import ArrowClockwise from "phosphor-svelte/lib/ArrowClockwise";
    import Check from "phosphor-svelte/lib/Check";
    import X from "phosphor-svelte/lib/X";
    import type { Message } from "@arisutalk/character-spec/v0/Character/Message";

    type Props = {
        /** The message this actions component is for */
        message: Message;
        /** Whether this message is currently being edited */
        isEditing?: boolean;
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
    };

    const {
        message,
        isEditing = false,
        onEdit,
        onDelete,
        onRegenerate,
        onConfirmEdit,
        onCancelEdit,
    }: Props = $props();

    const isAssistant = $derived(message.role === "assistant");

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
            onDelete?.();
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

<div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
    {#if isEditing}
        <button
            class="btn btn-xs btn-ghost btn-circle"
            onclick={onConfirmEdit}
            title="Save edit (Ctrl+Enter)"
        >
            <Check class="w-3.5 h-3.5 text-success" />
        </button>
        <button
            class="btn btn-xs btn-ghost btn-circle"
            onclick={onCancelEdit}
            title="Cancel edit (Esc)"
        >
            <X class="w-3.5 h-3.5 text-error" />
        </button>
    {:else if isConfirmingDelete}
        <button
            class="btn btn-xs btn-error btn-circle animate-pulse"
            onclick={handleDeleteClick}
            title="Click again to confirm delete"
        >
            <Trash class="w-3.5 h-3.5" />
        </button>
        <button
            class="btn btn-xs btn-ghost btn-circle"
            onclick={cancelDelete}
            title="Cancel delete"
        >
            <X class="w-3.5 h-3.5" />
        </button>
    {:else}
        <button class="btn btn-xs btn-ghost btn-circle" onclick={onEdit} title="Edit message">
            <Pencil class="w-3.5 h-3.5" />
        </button>
        <button
            class="btn btn-xs btn-ghost btn-circle"
            onclick={handleDeleteClick}
            title="Delete message"
        >
            <Trash class="w-3.5 h-3.5" />
        </button>
        {#if isAssistant}
            <button
                class="btn btn-xs btn-ghost btn-circle"
                onclick={onRegenerate}
                title="Regenerate response"
            >
                <ArrowClockwise class="w-3.5 h-3.5" />
            </button>
        {/if}
    {/if}
</div>
