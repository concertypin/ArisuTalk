<script lang="ts">
import type { Snippet } from "svelte";

/**
 * MessageContent Component
 * Applies display hooks to message content for rendering
 * Does not modify the actual message in storage
 */
import { applyDisplayHooks } from "../services/replaceHookService";

let {
	content,
	messageId,
	loadingSnippet,
}: { content: string; messageId: number | null; loadingSnippet?: Snippet } =
	$props();

let displayContent = $state(content);
let isLoading = $state(false);

$effect(() => {
	if (!content) return;

	isLoading = true;
	applyDisplayHooks(content)
		.then((result) => {
			displayContent = result.modified;
			isLoading = false;
		})
		.catch((error) => {
			console.error("Error applying display hooks:", error);
			displayContent = content;
			isLoading = false;
		});
});
</script>

{#if isLoading}
    <div class="text-gray-400 italic">
        {#if loadingSnippet}
            {@render loadingSnippet()}
        {:else}
            Loading...
        {/if}
    </div>
{:else}
    <div id="message-content-{messageId}">
        {@html displayContent}
    </div>
{/if}
