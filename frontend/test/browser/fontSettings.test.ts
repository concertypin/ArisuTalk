import { test, expect, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import GeneralSettings from "@/components/settingSubpage/GeneralSettings.svelte";
import { settings } from "@/lib/stores/settings.svelte";

test("changes font size and family", async () => {
    const screen = render(GeneralSettings);

    // Change Font Size
    const sizeSlider = screen.getByRole("slider");
    await sizeSlider.fill("20");

    // Wait for store update to propagate
    await vi.waitFor(() => {
        expect(settings.value.fontSize).toBe(20);
    });

    // Change Font Family
    const familySelect = screen.getByLabelText("Font Family");
    await familySelect.selectOptions("Monospace");

    await vi.waitFor(() => {
        expect(settings.value.fontFamily).toBe("monospace");
    });
});
