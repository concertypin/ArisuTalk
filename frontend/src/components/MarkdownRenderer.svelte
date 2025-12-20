<!--
  @component MarkdownRenderer
  Renders markdown content safely using svelte-markdown.
  Uses dynamic import for code-splitting.
-->
<script lang="ts">
    import { onMount } from "svelte";

    interface Props {
        source: string;
    }

    let { source }: Props = $props();

    let SvelteMarkdown: typeof import("svelte-markdown").default | null = $state(null);
    let loading = $state(true);
    let error = $state("");

    onMount(async () => {
        try {
            const module = await import("svelte-markdown");
            SvelteMarkdown = module.default;
        } catch (e) {
            console.error("Failed to load markdown renderer:", e);
            error = "Failed to load markdown renderer";
        } finally {
            loading = false;
        }
    });
</script>

{#if loading}
    <span class="loading loading-spinner loading-xs"></span>
{:else if error}
    <span class="text-error text-sm">{error}</span>
{:else if SvelteMarkdown}
    <div class="prose prose-sm max-w-none">
        <SvelteMarkdown {source} />
    </div>
{:else}
    <!-- Fallback: plain text -->
    <p>{source}</p>
{/if}
