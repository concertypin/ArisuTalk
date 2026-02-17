<script lang="ts">
    import Button from "@/components/ui/Button.svelte";

    interface Props {
        variant?: "primary" | "secondary" | "ghost" | "neutral";
        size?: "xs" | "sm" | "md" | "lg";
        disabled?: boolean;
        type?: "button" | "submit" | "reset";
        onclick?: () => void;
        label: string;
    }

    let { variant, size, disabled, type, onclick, label }: Props = $props();
</script>

<Button {variant} {size} {disabled} {type} {onclick}>
    {label}
</Button>
