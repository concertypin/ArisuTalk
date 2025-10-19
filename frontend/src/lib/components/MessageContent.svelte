<script lang="ts">
    /**
     * MessageContent Component
     * Applies display hooks to message content for rendering
     * Does not modify the actual message in storage
     */
    import { onMount } from "svelte";
    import { applyDisplayHooks } from "../services/replaceHookService";

    export let content: string = "";
    export let messageId: number | null = null;

    let displayContent = content;
    let isLoading = false;

    onMount(async () => {
        if (!content) return;

        isLoading = true;
        try {
            const result = await applyDisplayHooks(content);
            displayContent = result.modified;
        } catch (error) {
            console.error("Error applying display hooks:", error);
            displayContent = content;
        } finally {
            isLoading = false;
        }
    });

    // Watch for content changes
    $: if (content !== displayContent) {
        onMount(async () => {
            if (!content) return;

            isLoading = true;
            try {
                const result = await applyDisplayHooks(content);
                displayContent = result.modified;
            } catch (error) {
                console.error("Error applying display hooks:", error);
                displayContent = content;
            } finally {
                isLoading = false;
            }
        });
    }
</script>

{#if isLoading}
    <div class="text-gray-400 italic">
        <slot name="loading">Loading...</slot>
    </div>
{:else}
    <div id="message-content-{messageId}">
        {@html displayContent}
    </div>
{/if}
