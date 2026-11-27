import { describe, it, expect } from "vitest";
import { parseChatMarkdown, parseMarkdown } from "@/lib/utils/markdown";

describe("parseMarkdown", () => {
    it.concurrent("does not turn a single newline into <br>", () => {
        expect(parseMarkdown("a\nb")).not.toContain("<br");
    });

    it.concurrent("escapes inline HTML so it shows as text", () => {
        expect(parseMarkdown("<thinking>plan</thinking>")).toBe(
            "<p>&lt;thinking&gt;plan&lt;/thinking&gt;</p>\n"
        );
    });

    it.concurrent("escapes block HTML so it shows as text", () => {
        expect(parseMarkdown("<div>\nbox\n</div>")).toBe("<p>&lt;div&gt;\nbox\n&lt;/div&gt;</p>\n");
    });

    it.concurrent("does not touch angle brackets inside code", () => {
        expect(parseMarkdown("`Vec<T>`")).toBe("<p><code>Vec&lt;T&gt;</code></p>\n");
    });

    it.concurrent("escapes raw HTML next to markdown syntax", () => {
        expect(parseMarkdown('**bold** <b onclick="x()">raw</b>')).toBe(
            "<p><strong>bold</strong> &lt;b onclick=&quot;x()&quot;&gt;raw&lt;/b&gt;</p>\n"
        );
    });
});

describe("parseChatMarkdown", () => {
    it.concurrent("turns a single newline into a line break", () => {
        expect(parseChatMarkdown("a\nb")).toBe("<p>a<br>b</p>\n");
    });

    it.concurrent("escapes raw HTML like parseMarkdown", () => {
        expect(parseChatMarkdown("<thinking>plan</thinking>")).toBe(
            "<p>&lt;thinking&gt;plan&lt;/thinking&gt;</p>\n"
        );
    });
});
