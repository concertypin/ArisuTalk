import { test, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import GeneralSettings from "@/components/settingSubpage/GeneralSettings.svelte";
import { settings } from "@/lib/stores/settings.svelte";

test("changes font size and family", async () => {
    const user = userEvent.setup();
    render(GeneralSettings);

    // Change Font Size. user-event cannot drive a range input, so dispatch the input event directly.
    const sizeSlider = screen.getByRole("slider");
    await fireEvent.input(sizeSlider, { target: { value: "20" } });

    await waitFor(() => expect(settings.value.fontSize).toBe(20));

    // Change Font Family
    const familySelect = screen.getByLabelText("Font Family");
    await user.selectOptions(familySelect, "Monospace");

    await waitFor(() => expect(settings.value.fontFamily).toBe("monospace"));
});
