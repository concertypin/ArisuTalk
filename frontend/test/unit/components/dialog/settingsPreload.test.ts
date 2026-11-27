import { describe, it, expect } from "vitest";
import CheckIcon from "phosphor-svelte/lib/CheckIcon";
import GearIcon from "phosphor-svelte/lib/GearIcon";
import { preload } from "@/components/dialog/settingsPreload";

// Markdown pages and the label and icon defaults are covered in test/browser/components/settingsPreload.test.ts.
describe("settings dialog preload", () => {
    it("returns empty collections for no templates", () => {
        expect(preload([])).toEqual({ tabList: [], pageMap: {} });
    });

    it("gives every tab a unique id and keeps the template order", () => {
        const { tabList } = preload([
            { type: "markdown", text: "# 하나", label: "하나" },
            { type: "markdown", text: "# 둘", label: "둘" },
            { type: "markdown", text: "# 셋", label: "셋" },
        ]);

        expect(tabList.map((tab) => tab.label)).toEqual(["하나", "둘", "셋"]);
        expect(new Set(tabList.map((tab) => tab.id)).size).toBe(3);
    });

    it("keys each page by the id of its tab", () => {
        const { tabList, pageMap } = preload([
            { type: "markdown", text: "# 하나" },
            { type: "markdown", text: "# 둘" },
        ]);

        expect(Object.keys(pageMap).sort()).toEqual(tabList.map((tab) => tab.id).sort());
    });

    it("keeps the given component for component and static pages", () => {
        const { tabList, pageMap } = preload([
            { type: "component", component: CheckIcon },
            { type: "static", component: GearIcon },
        ]);

        expect(pageMap[tabList[0].id]).toEqual({ type: "component", component: CheckIcon });
        expect(pageMap[tabList[1].id]).toEqual({ type: "static", component: GearIcon });
    });
});
