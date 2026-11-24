import { test, expect, describe, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { renderWithAppContext, createTestAppContext } from "@test/utils/appContext.svelte";
import AppSettingsModal from "@/components/AppSettingsModal.svelte";
import { settings } from "@/lib/stores/settings.svelte";
import { SettingsSchema } from "@/lib/types/IDataModel";
import { Logger } from "@common/logger/Logger";
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

    test("logs modal.open on mount", () => {
        renderModal();

        expect(Logger.structured).toHaveBeenCalledWith(
            "modal.open",
            expect.objectContaining({
                modalName: "AppSettingsModal",
            })
        );
    });

    test("saves settings, closes through the app context and logs modal.close on close", async () => {
        const user = userEvent.setup();
        const { appContext } = renderModal();

        await user.click(screen.getByLabelText("Close"));

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
        const user = userEvent.setup();
        const { appContext } = renderModal();

        // The header button only has an aria-label, so the text matches the footer button.
        await user.click(screen.getByText("Close", { exact: true }));

        expect(appContext.appSettingsOpen).toBe(false);
    });

    test("renders correctly", () => {
        renderModal();

        // The dialog is open: jsdom evaluates the `open` attribute through its built-in dialog
        // styles, so a modal that never called `showModal()` would be hidden here.
        expect(screen.getByRole("dialog")).toBeVisible();
        expect(screen.getByRole("heading", { name: "App Settings", level: 2 })).toBeInTheDocument();
        // General is the first tab, so its page is shown initially.
        expect(
            screen.getByRole("heading", { name: "General Settings", level: 3 })
        ).toBeInTheDocument();
    });

    test("switches tabs", async () => {
        const user = userEvent.setup();
        renderModal();

        // Initial tab is General
        expect(screen.getByRole("heading", { name: "General Settings" })).toBeInTheDocument();

        // Switch to LLM
        await user.click(screen.getByRole("button", { name: "LLM Configuration" }));
        expect(screen.getByRole("heading", { name: "LLM Configuration" })).toBeInTheDocument();

        // Switch to Advanced
        await user.click(screen.getByRole("button", { name: "Advanced" }));
        expect(screen.getByRole("heading", { name: "Advanced Settings" })).toBeInTheDocument();
        expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    test("adds new LLM config", async () => {
        const user = userEvent.setup();
        renderModal();

        await user.click(screen.getByRole("button", { name: "LLM Configuration" }));

        // Before: no configs
        expect(settings.value.llmConfigs.length).toBe(0);

        // Click Add Model
        await user.click(screen.getByText("Add Model"));

        // After: one config added
        expect(settings.value.llmConfigs.length).toBe(1);
        expect(settings.value.llmConfigs[0].name).toBe("Model 1");
    });

    test("highlights the active tab with menu-active and moves it on click", async () => {
        const user = userEvent.setup();
        renderModal();

        const general = screen.getByRole("button", { name: "General" });
        const llm = screen.getByRole("button", { name: "LLM Configuration" });

        expect(general).toHaveClass("menu-active");
        expect(llm).not.toHaveClass("menu-active");

        await user.click(llm);

        expect(llm).toHaveClass("menu-active");
        expect(general).not.toHaveClass("menu-active");
    });

    describe("autosave", () => {
        test("does not save before anything changed", async () => {
            renderModal();

            // A sleep is the only way to show that nothing happens. It must outlast the 300ms
            // autosave debounce, or a wrongly scheduled save would not have fired yet.
            await new Promise((r) => setTimeout(r, 500));

            expect(settings.save).not.toHaveBeenCalled();
        });

        test("saves a changed setting without closing the modal", async () => {
            const user = userEvent.setup();
            const { appContext } = renderModal();

            await user.selectOptions(
                screen.getByRole("combobox", { name: "Font Family" }),
                "Roboto"
            );

            await waitFor(() => expect(settings.save).toHaveBeenCalledOnce());
            expect(settings.value.fontFamily).toBe("Roboto");
            expect(appContext.appSettingsOpen).toBe(true);
        });

        test("debounces rapid changes into one save", async () => {
            renderModal();

            // Both changes happen within one task, so the test cannot race the debounce delay
            // (real clicks yield to the event loop between steps and can take longer than it under load).
            // `flushSync` runs the autosave effect once per change instead of once for both.
            settings.value.fontFamily = "Roboto";
            flushSync();
            settings.value.fontFamily = "Lato";
            flushSync();

            await waitFor(() => expect(settings.save).toHaveBeenCalled());
            // Negative check: no second save may follow. Waits longer than the 300ms debounce.
            await new Promise((r) => setTimeout(r, 500));

            expect(settings.save).toHaveBeenCalledOnce();
            expect(settings.value.fontFamily).toBe("Lato");
        });

        test("closing flushes the pending change and cancels the timer", async () => {
            renderModal();

            // Change and close within one task, for the same reason as above: the change is
            // still pending when the modal closes, no matter how slow the machine is.
            settings.value.fontFamily = "Roboto";
            flushSync();
            const closeButton = screen.getByLabelText("Close");
            if (!(closeButton instanceof HTMLElement))
                throw new Error("Close is not an HTML element");
            closeButton.click();
            // Negative check: a leaked debounce timer would fire within 300ms, so wait longer.
            await new Promise((r) => setTimeout(r, 500));

            // One save from closing; the debounce timer must not save a second time.
            expect(settings.save).toHaveBeenCalledOnce();
        });
    });
});
