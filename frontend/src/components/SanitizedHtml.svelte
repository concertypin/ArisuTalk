<!--
  @component SanitizedHtml
  Renders an untrusted HTML string (e.g. the output of `marked`) after sanitizing it with the
  HTML Sanitizer API (`Element.setHTML`) and the markdown allowlist. Browsers without the API get
  the polyfill from `@/lib/polyfills/setHTML`, which is installed before the app mounts. If
  `setHTML` is missing anyway, the HTML is shown as plain text. No `{@html}` is needed.
-->
<script lang="ts">
    import { MARKDOWN_SANITIZER } from "@/lib/utils/markdownSanitizer";

    type Props = {
        /** HTML to render. It is always sanitized before being attached to the DOM. */
        html: string;
        /** Class names for the wrapper element. */
        class?: string;
    };

    let { html, class: className = "" }: Props = $props();

    function render(node: HTMLElement) {
        // `html` is read here, so the attachment re-runs whenever it changes.
        if (typeof node.setHTML === "function") {
            node.setHTML(html, { sanitizer: MARKDOWN_SANITIZER });
        } else {
            // Never fall back to innerHTML: unsanitized markup is worse than unformatted text.
            node.textContent = html;
        }
    }
</script>

<div class={className} {@attach render}></div>
