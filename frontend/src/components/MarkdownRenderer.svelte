<!--
  @component MarkdownRenderer
  Renders markdown content safely using svelte-markdown.
  Uses dynamic import for code-splitting with {#await} block.
-->
<script lang="ts">
    interface Props {
        source: string;
    }
    let { source }: Props = $props();

    const svelteMarkdownPromise = import("svelte-markdown").catch((err) => {
        console.error("Failed to load markdown renderer:", err);
        return null;
    });
</script>

{#await svelteMarkdownPromise}
    <span class="loading loading-spinner loading-xs"></span>
{:then module}
    {#if module?.default}
        {@const SvelteMarkdown = module.default}
        <div class="prose prose-sm max-w-none">
            <SvelteMarkdown {source} />
        </div>
    {:else}
        <span class="text-error text-sm">Failed to load markdown renderer</span>
        <!-- Fallback: plain text -->
        <p>{source}</p>
    {/if}
{/await}
