/**
 * @fileoverview Markdown to HTML for chat messages and character text, using `marked`.
 * The HTML still has to be sanitized when it is rendered, see `@/lib/utils/markdownSanitizer`.
 */
import { Marked, type Tokens } from "marked";

/** Escapes the characters that make text markup. */
function escapeHtml(text: string): string {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

/**
 * Creates a markdown compiler that shows raw HTML as text. AI replies and character cards are
 * not trusted to write markup, and `<thinking>` or `Vec<T>` must stay readable instead of
 * being swallowed as unknown tags.
 * @param options.breaks Whether a single newline becomes a `<br>`.
 */
function createMarkdown({ breaks }: { breaks: boolean }): Marked {
    return new Marked({
        gfm: true,
        breaks,
        renderer: {
            html(token: Tokens.HTML | Tokens.Tag) {
                const escaped = escapeHtml(token.text);
                return token.block
                    ? `<p>${escaped}</p>
`
                    : escaped;
            },
        },
    });
}

const standardMarkdown = createMarkdown({ breaks: false });
const chatMarkdown = createMarkdown({ breaks: true });

/**
 * Compiles GFM to HTML. Raw HTML in the text is escaped, so it shows as text.
 * The result is still sanitized when rendered, see `MARKDOWN_SANITIZER`.
 */
export function parseMarkdown(text: string): string {
    return standardMarkdown.parse(text, { async: false });
}

/** Like {@link parseMarkdown}, but a single newline becomes a line break, as in chat apps. */
export function parseChatMarkdown(text: string): string {
    return chatMarkdown.parse(text, { async: false });
}
