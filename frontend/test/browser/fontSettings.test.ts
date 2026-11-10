import { test, expect } from "vitest";
import { render } from "vitest-browser-svelte";
import GeneralSettings from "@/components/settingSubpage/GeneralSettings.svelte";
import { settings } from "@/lib/stores/settings.svelte";

test("changes font size and family", async () => {
    const screen = render(GeneralSettings);

    // Change Font Size
    const sizeSlider = screen.getByRole("slider");
    await sizeSlider.fill("20");
    // fill might trigger input, but if not we might need to dispatch event manually if the bind:value relies on it
    // In vitest-browser with playwright, fill usually works for text. For range, it might be tricky.
    // Let's try explicit event dispatch if needed, but fill is best first try.

    // Wait for store update
    await new Promise((r) => setTimeout(r, 100));

    expect(settings.value.fontSize).toBe(20);

    // Change Font Family
    const familySelect = screen.getByLabelText("Font Family");
    await familySelect.selectOptions("Monospace");

    await new Promise((r) => setTimeout(r, 100));
    expect(settings.value.fontFamily).toBe("monospace");
});
