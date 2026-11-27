import { test, expect } from "vitest";
import PlaceholderIcon from "phosphor-svelte/lib/PlaceholderIcon";
import GearIcon from "phosphor-svelte/lib/GearIcon";
import { preload } from "@/components/dialog/settingsPreload";
import { parseMarkdown } from "@/lib/utils/markdown";

/** Preloads one markdown template and returns the HTML of its page. */
function preloadMarkdownHtml(text: string): string {
    const { tabList, pageMap } = preload([{ type: "markdown", text }]);
    const page = pageMap[tabList[0].id];
    if (page.type !== "markdown") throw new Error("markdown page expected");
    return page.html;
}

test("markdown pages are compiled with the shared markdown module", () => {
    const text = "<thinking>x</thinking> ~~y~~";

    expect(preloadMarkdownHtml(text)).toBe(parseMarkdown(text));
});

test("tabs get the given label and icon, or the placeholder defaults", () => {
    const { tabList } = preload([
        { type: "markdown", text: "# A", label: "First", icon: GearIcon },
        { type: "markdown", text: "# B" },
    ]);

    expect(tabList.map((tab) => tab.label)).toEqual(["First", "Untitled"]);
    expect(tabList.map((tab) => tab.icon)).toEqual([GearIcon, PlaceholderIcon]);
});
