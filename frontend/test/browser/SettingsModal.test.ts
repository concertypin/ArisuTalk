import { test, expect, describe, vi, beforeEach } from "vitest";
import { render } from "vitest-browser-svelte";
import SettingsModal from "@/components/SettingsModal.svelte";
import { settings } from "@/lib/stores/settings.svelte";
import { uiState } from "@/lib/stores/ui.svelte";
import { SettingsSchema } from "@/lib/types/IDataModel";

describe("SettingsModal Component", () => {
    beforeEach(() => {
        // Reset stores
        settings.value = SettingsSchema.parse({});
        // We need to ensure settings.save is mockable or we just let it run (it will try to call adapter)
        // Better to mock the adapter or the save method.
        // Since we import the instance, we can spy on it.
        vi.spyOn(settings, "save").mockResolvedValue(undefined);

        uiState.settingsModalOpen = true;
        vi.spyOn(uiState, "closeSettingsModal");
    });

    test("renders correctly", async () => {
        const { getByRole, getByLabelText } = render(SettingsModal);

        // Use getByRole for heading to be more specific
        await expect.element(getByRole("heading", { name: "Settings", level: 2 })).toBeVisible();
        await expect.element(getByLabelText("General Settings")).toBeVisible();
    });

    test("switches tabs", async () => {
        const { getByText, getByRole } = render(SettingsModal);

        // Initial tab is General
        await expect.element(getByRole("heading", { name: "General Settings" })).toBeVisible();

        // Switch to LLM
        await getByText("Models (LLM)").click();
        await expect.element(getByRole("heading", { name: "LLM Configuration" })).toBeVisible();

        // Switch to Advanced
        await getByText("Advanced").click();
        await expect.element(getByRole("heading", { name: "Advanced Settings" })).toBeVisible();
    });

    test("adds new LLM config", async () => {
        const { getByText } = render(SettingsModal);

        await getByText("Models (LLM)").click();

        // Before: no configs
        expect(settings.value.llmConfigs.length).toBe(0);

        // Click Add Model
        await getByText("Add Model").click();

        // After: one config added
        expect(settings.value.llmConfigs.length).toBe(1);
        expect(settings.value.llmConfigs[0].name).toBe("Model 1");
    });
});
