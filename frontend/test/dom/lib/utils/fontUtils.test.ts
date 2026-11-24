import { test, expect } from "vitest";
import { loadFont } from "@/lib/utils/fontUtils";

test("loadFont adds link tag for Google Fonts", () => {
    // Clean up before test
    const existing = document.getElementById("font-roboto");
    if (existing) existing.remove();

    loadFont("Roboto");

    const link = document.getElementById("font-roboto") as HTMLLinkElement;
    expect(link).toBeTruthy();
    expect(link.tagName).toBe("LINK");
    expect(link.href).toContain("fonts.googleapis.com");
    expect(link.href).toContain("family=Roboto");
});

test("loadFont ignores system fonts", () => {
    loadFont("system-ui");
    const link = document.getElementById("font-system-ui");
    expect(link).toBeNull();
});

test("loadFont does not add duplicate link tags", () => {
    // Clean up before test
    const existing = document.getElementById("font-open-sans");
    if (existing) existing.remove();

    loadFont("Open Sans");

    // Call again
    loadFont("Open Sans");

    const links = document.querySelectorAll("#font-open-sans");
    expect(links.length).toBe(1);
});

test("loadFont ignores unknown fonts (implicitly handled by system check logic but good to verify)", () => {
    loadFont("Unknown Font");
    const link = document.getElementById("font-unknown-font");
    expect(link).toBeNull();
});
