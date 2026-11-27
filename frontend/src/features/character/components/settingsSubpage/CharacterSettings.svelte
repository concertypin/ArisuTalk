<script lang="ts">
    import type { Snippet } from "svelte";

    let {
        subpageName,
        children,
    }: {
        subpageName: string;
        children: Snippet;
    } = $props();
</script>

<div class="space-y-6">
    <h3 class="text-lg font-semibold">{subpageName}</h3>
    {@render children()}
</div>
