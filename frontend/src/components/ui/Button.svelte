<!--
  @component Button
  Reusable button component with variants.
-->
<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        /** Button variant */
        variant?: "primary" | "secondary" | "ghost";
        /** Disabled state */
        disabled?: boolean;
        /** Button type */
        type?: "button" | "submit" | "reset";
        /** Click handler */
        onclick?: () => void;
        /** Button content */
        children: Snippet;
    }

    let {
        variant = "primary",
        disabled = false,
        type = "button",
        onclick,
        children,
    }: Props = $props();
</script>

<button class="btn btn-{variant}" class:disabled {type} {disabled} {onclick}>
    {@render children()}
</button>

<style>
    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-xs);
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
        font-weight: 500;
        transition: all var(--transition-fast);
        cursor: pointer;
    }

    .btn-primary {
        background-color: var(--color-accent);
        color: var(--color-text-primary);
    }

    .btn-primary:hover:not(.disabled) {
        background-color: var(--color-accent-hover);
    }

    .btn-secondary {
        background-color: var(--color-bg-tertiary);
        border: 1px solid var(--color-border);
        color: var(--color-text-primary);
    }

    .btn-secondary:hover:not(.disabled) {
        background-color: var(--color-border);
    }

    .btn-ghost {
        background-color: transparent;
        color: var(--color-text-secondary);
    }

    .btn-ghost:hover:not(.disabled) {
        background-color: var(--color-bg-tertiary);
        color: var(--color-text-primary);
    }

    .disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
