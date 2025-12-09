<script lang="ts">
import { t } from "$root/i18n";
import { HelpCircle } from "lucide-svelte";

interface Props {
    title: string;
    description: string;
    value: string;
}

let { title, description, value = $bindable() }: Props = $props();
let tooltipVisible = $state(false);
let tooltipX = $state(0);
let tooltipY = $state(0);
let tooltipEl = $state<HTMLElement | null>(null);
let tooltipTop = $state(0);

function showTooltip(event: Event) {
    tooltipVisible = true;
    if (event instanceof MouseEvent) {
        tooltipX = event.clientX;
        tooltipY = event.clientY;
    }
}

function hideTooltip() {
    tooltipVisible = false;
}

$effect(() => {
    if (tooltipVisible && tooltipEl) {
        const tooltipHeight = tooltipEl.clientHeight;
        if (tooltipY + tooltipHeight + 15 > window.innerHeight) {
            tooltipTop = tooltipY - tooltipHeight - 15;
        } else {
            tooltipTop = tooltipY + 15;
        }
    }
});
</script>

<div class="bg-gray-900/50 rounded-lg p-4">
    <div class="flex items-center gap-2">
        <h4 class="text-base font-semibold text-blue-300">{title}</h4>
        <div
            class="relative"
            role="button"
            tabindex="0"
            onmouseenter={showTooltip}
            onmouseleave={hideTooltip}
            onfocus={showTooltip}
            onblur={hideTooltip}
        >
            <HelpCircle class="w-4 h-4 text-gray-400 cursor-pointer" />
        </div>
    </div>
    <p class="text-xs text-gray-400 mb-4">{description}</p>
    <textarea
        bind:value
        class="w-full h-80 p-3 bg-gray-700 text-white rounded-lg text-sm font-mono"
    ></textarea>
</div>

{#if tooltipVisible}
    <div
        bind:this={tooltipEl}
        class="fixed z-[100] w-96 bg-gray-900 text-white text-xs rounded-lg p-4 shadow-lg border border-gray-700"
        style="left: {tooltipX + 15}px; top: {tooltipTop}px;"
    >
        <h5 class="font-bold mb-2">Magic Patterns</h5>
        <p>
            Magic Patterns are special patterns that can be used in the prompt
            to access character properties and current chatting log.
        </p>
        <p>
            Patterns start with <code>{@html "{|"}</code> and ends with
            <code>{@html "|}"}</code>. Inner text is command. Multi-line is
            supported.
        </p>
        <p>
            All patterns are interpreted, executed on sandboxed JavaScript
            engine, which means you can use any valid JavaScript syntax as long
            as it doesn't access outside of the sandbox.
        </p>
        <p>
            After you write the pattern, you MUST use <code>return</code> statement
            to make the pattern return something! If you don't, it will return empty
            string.
        </p>
        <p>
            There are no escape mechanism, and all <code>{@html "{|"}</code> and
            <code>{@html "|}"}</code> patterns will be treated as magic patterns.
        </p>
        <p>All properties are read-only, and you can't modify them.</p>
        <h6 class="font-bold mt-2 mb-1">Magic Patterns Context</h6>
        <ul class="list-disc list-inside">
            <li><code>console.log</code>: Logs a message to the console.</li>
            <li><code>character</code>: The character object.</li>
            <li><code>char</code>: Alias for <code>character.name</code>.</li>
            <li><code>persona</code>: The user's persona object.</li>
            <li><code>user</code>: Alias for <code>persona.name</code>.</li>
            <li>
                <code>chat(a, b)</code>: Function to access current chatting log
                from
                <code>a</code>-th to <code>b</code>-th.
            </li>
            <li>
                <code>sessionStorage</code>: Same as
                <code>window.sessionStorage</code>.
            </li>
        </ul>
    </div>
{/if}
