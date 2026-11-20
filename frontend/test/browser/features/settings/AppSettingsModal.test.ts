import { test, expect, describe, vi, beforeEach, afterEach } from "vitest";
import { renderWithAppContext, createTestAppContext } from "@test/utils/appContext.svelte";
import AppSettingsModal from "@/components/AppSettingsModal.svelte";
import { settings } from "@/lib/stores/settings.svelte";
import { SettingsSchema } from "@/lib/types/IDataModel";
import { Logger } from "@common/logger/Logger";
import { userEvent } from "vitest/browser";
import { flushSync } from "svelte";

describe("AppSettingsModal Component", () => {
    /** Mounts the modal the way `Home` does: while the app context marks it as open. */
    function renderModal() {
        return renderWithAppContext(
            AppSettingsModal,
            {},
            createTestAppContext({ appSettingsOpen: true })
        );
    }

    afterEach(() => {
        // The spies sit on singletons, so they must not leak into the next test.
        vi.restoreAllMocks();
    });

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

    test("highlights the active tab with menu-active and moves it on click", async () => {
        const { getByRole } = renderModal();

        const general = getByRole("button", { name: "General" });
        const llm = getByRole("button", { name: "LLM Configuration" });

        await expect.element(general).toHaveClass("menu-active");
        await expect.element(llm).not.toHaveClass("menu-active");

        await llm.click();

        await expect.element(llm).toHaveClass("menu-active");
        await expect.element(general).not.toHaveClass("menu-active");
    });

    describe("autosave", () => {
        test("does not save before anything changed", async () => {
            renderModal();

            await new Promise((r) => setTimeout(r, 500));

            expect(settings.save).not.toHaveBeenCalled();
        });

        test("saves a changed setting without closing the modal", async () => {
            const { getByRole, appContext } = renderModal();

            await userEvent.selectOptions(getByRole("combobox", { name: "Font Family" }), "Roboto");

            await vi.waitFor(() => expect(settings.save).toHaveBeenCalledOnce());
            expect(settings.value.fontFamily).toBe("Roboto");
            expect(appContext.appSettingsOpen).toBe(true);
        });

        test("debounces rapid changes into one save", async () => {
            renderModal();

            // Both changes happen within one task, so the test cannot race the debounce delay
            // (real clicks round-trip through Playwright and can take longer than it under load).
            // `flushSync` runs the autosave effect once per change instead of once for both.
            settings.value.fontFamily = "Roboto";
            flushSync();
            settings.value.fontFamily = "Lato";
            flushSync();

            await vi.waitFor(() => expect(settings.save).toHaveBeenCalled());
            await new Promise((r) => setTimeout(r, 500));

            expect(settings.save).toHaveBeenCalledOnce();
            expect(settings.value.fontFamily).toBe("Lato");
        });

        test("closing flushes the pending change and cancels the timer", async () => {
            const { getByLabelText } = renderModal();

            // Change and close within one task, for the same reason as above: the change is
            // still pending when the modal closes, no matter how slow the machine is.
            settings.value.fontFamily = "Roboto";
            flushSync();
            const closeButton = getByLabelText("Close").element();
            if (!(closeButton instanceof HTMLElement))
                throw new Error("Close is not an HTML element");
            closeButton.click();
            await new Promise((r) => setTimeout(r, 500));

            // One save from closing; the debounce timer must not save a second time.
            expect(settings.save).toHaveBeenCalledOnce();
        });
    });
});
