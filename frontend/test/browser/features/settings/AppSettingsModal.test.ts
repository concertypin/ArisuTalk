import { test, expect, describe, vi, beforeEach } from "vitest";
import { renderWithAppContext, createTestAppContext } from "@test/utils/appContext.svelte";
import AppSettingsModal from "@/components/AppSettingsModal.svelte";
import { settings } from "@/lib/stores/settings.svelte";
import { SettingsSchema } from "@/lib/types/IDataModel";
import { Logger } from "@common/logger/Logger";

describe("AppSettingsModal Component", () => {
    /** Mounts the modal the way `Home` does: while the app context marks it as open. */
    function renderModal() {
        return renderWithAppContext(
            AppSettingsModal,
            {},
            createTestAppContext({ appSettingsOpen: true })
        );
    }

    beforeEach(() => {
        // Reset stores
        settings.value = SettingsSchema.parse({});
        // Avoid touching the storage adapter, the tests only care about the call.
        vi.spyOn(settings, "save").mockResolvedValue(undefined);
        vi.spyOn(Logger, "structured").mockImplementation(() => {});
    });

    test("logs modal.open on mount", async () => {
        renderModal();

        expect(Logger.structured).toHaveBeenCalledWith(
            "modal.open",
            expect.objectContaining({
                modalName: "AppSettingsModal",
            })
        );
    });

    test("saves settings, closes through the app context and logs modal.close on close", async () => {
        const { getByLabelText, appContext } = renderModal();

        await getByLabelText("Close").click();

        expect(settings.save).toHaveBeenCalledOnce();
        expect(appContext.appSettingsOpen).toBe(false);
        expect(Logger.structured).toHaveBeenCalledWith(
            "modal.close",
            expect.objectContaining({
                modalName: "AppSettingsModal",
            })
        );
    });

    test("closes from the footer button too", async () => {
        const { getByText, appContext } = renderModal();

        // The header button only has an aria-label, so the text matches the footer button.
        await getByText("Close", { exact: true }).click();

        expect(appContext.appSettingsOpen).toBe(false);
    });

    test("renders correctly", async () => {
        const { getByRole } = renderModal();

        await expect
            .element(getByRole("heading", { name: "App Settings", level: 2 }))
            .toBeVisible();
        // General is the first tab, so its page is shown initially.
        await expect
            .element(getByRole("heading", { name: "General Settings", level: 3 }))
            .toBeVisible();
    });

    test("switches tabs", async () => {
        const { getByRole } = renderModal();

        // Initial tab is General
        await expect.element(getByRole("heading", { name: "General Settings" })).toBeVisible();

        // Switch to LLM
        await getByRole("button", { name: "LLM Configuration" }).click();
        await expect.element(getByRole("heading", { name: "LLM Configuration" })).toBeVisible();

        // Switch to Advanced
        await getByRole("button", { name: "Advanced", exact: true }).click();
        await expect.element(getByRole("heading", { name: "Advanced Settings" })).toBeVisible();
        await expect.element(getByRole("combobox")).toBeVisible();
    });

    test("adds new LLM config", async () => {
        const { getByRole, getByText } = renderModal();

        await getByRole("button", { name: "LLM Configuration" }).click();

        // Before: no configs
        expect(settings.value.llmConfigs.length).toBe(0);

        // Click Add Model
        await getByText("Add Model").click();

        // After: one config added
        expect(settings.value.llmConfigs.length).toBe(1);
        expect(settings.value.llmConfigs[0].name).toBe("Model 1");
    });
});
