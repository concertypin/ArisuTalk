<script lang="ts">
    import type { Snippet } from "svelte";

    type Props = {
        subpageName: string;
        children: Snippet;
    };

    let { subpageName, children }: Props = $props();
</script>

<div class="space-y-6">
    <h3 class="text-lg font-semibold">{subpageName}</h3>
    {@render children()}
</div>
