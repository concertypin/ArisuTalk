<!--
  @component SanitizedHtml
  Renders an untrusted HTML string (e.g. the output of `marked`) after sanitizing it with DOMPurify.
  The sanitized result is attached as a DOM fragment, so no `{@html}` is needed.
-->
<script lang="ts">
    import DOMPurify from "dompurify";

    let {
        html,
        class: className = "",
    }: {
        /** HTML to render. It is always sanitized before being attached to the DOM. */
        html: string;
        /** Class names for the wrapper element. */
        class?: string;
    } = $props();

    function render(node: HTMLElement) {
        node.replaceChildren(DOMPurify.sanitize(html, { RETURN_DOM_FRAGMENT: true }));
    }
</script>

<div class={className} {@attach render}></div>
