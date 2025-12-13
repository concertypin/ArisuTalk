<!--
  @component Button
  Reusable button component with variants using DaisyUI.
-->
<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        /** Button variant */
        variant?: "primary" | "secondary" | "ghost" | "neutral";
        /** Button size */
        size?: "xs" | "sm" | "md" | "lg";
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
        size = "md",
        disabled = false,
        type = "button",
        onclick,
        children,
    }: Props = $props();

    const variantClasses: Record<typeof variant, string> = {
        primary: "btn-primary",
        secondary: "btn-secondary",
        ghost: "btn-ghost",
        neutral: "btn-neutral",
    };

    const sizeClasses: Record<typeof size, string> = {
        xs: "btn-xs",
        sm: "btn-sm",
        md: "",
        lg: "btn-lg",
    };
</script>

<button class="btn {variantClasses[variant]} {sizeClasses[size]}" {type} {disabled} {onclick}>
    {@render children()}
</button>
