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

    const variants = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-500",
        secondary: "bg-gray-800 border border-gray-700 text-white hover:bg-gray-700",
        ghost: "bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white",
    };
</script>

<button
    class="inline-flex items-center justify-center gap-1 px-4 py-2 rounded text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed {variants[
        variant
    ]}"
    {type}
    {disabled}
    {onclick}
>
    {@render children()}
</button>
