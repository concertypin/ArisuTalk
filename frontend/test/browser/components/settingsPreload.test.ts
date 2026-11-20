import { test, expect } from "vitest";
import { marked } from "marked";
import { preload } from "@/components/dialog/settingsPreload";
// Imported on purpose: loading MessageBubble must not change how other markdown is compiled.
import "@/components/chat/MessageBubble.svelte";

/** Preloads one markdown page and returns its compiled HTML. */
function compile(text: string): string {
    const { tabList, pageMap } = preload([{ contents: { type: "markdown", text } }]);
    const page = pageMap[tabList[0].id];
    if (page.type !== "markdown") throw new Error("markdown page expected");
    return page.text;
}

test("markdown pages keep standard line handling after MessageBubble is loaded", () => {
    // MessageBubble turns single newlines into <br>. That is its own setting, not a global one.
    expect(compile("a\nb")).not.toContain("<br");
    expect(marked.defaults.breaks).toBe(false);
});

test("markdown pages still render GFM", () => {
    expect(compile("| h |\n| - |\n| c |")).toContain("<table>");
});
