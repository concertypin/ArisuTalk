import { test, expect, describe, vi, beforeEach } from "vitest";
import { render } from "vitest-browser-svelte";
import LogLevelSelector from "@/components/ui/LogLevelSelector.svelte";
import { Logger } from "@common/logger/Logger";

describe("LogLevelSelector Component (advanced)", () => {
    beforeEach(() => {
        vi.spyOn(Logger, "setLevel").mockImplementation(() => {});
        vi.spyOn(Logger, "getLevel").mockReturnValue("info");
    });

    test("renders correctly with current level", async () => {
        const { getByRole } = render(LogLevelSelector);

        const select = getByRole("combobox");
        await expect.element(select).toBeVisible();
        await expect.element(select).toHaveValue("info");
    });

    test("updates log level on change", async () => {
        const { getByRole } = render(LogLevelSelector);

        const select = getByRole("combobox");
        await select.selectOptions("debug");

        expect(Logger.setLevel).toHaveBeenCalledWith("debug");
    });

    test("re-renders when Logger.getLevel changes", async () => {
        vi.mocked(Logger.getLevel).mockReturnValue("error");

        const { getByRole } = render(LogLevelSelector);

        const select = getByRole("combobox");
        await expect.element(select).toHaveValue("error");
    });

    test("resets to previous level after changing then reverting", async () => {
        const { getByRole } = render(LogLevelSelector);

        const select = getByRole("combobox");
        await select.selectOptions("warn");
        expect(Logger.setLevel).toHaveBeenCalledWith("warn");

        await select.selectOptions("info");
        expect(Logger.setLevel).toHaveBeenCalledWith("info");
    });

    test("sets all available log levels without error", async () => {
        const { getByRole } = render(LogLevelSelector);
        const select = getByRole("combobox");

        const levels = ["debug", "info", "warn", "error"] as const;
        for (const level of levels) {
            await select.selectOptions(level);
            expect(Logger.setLevel).toHaveBeenCalledWith(level);
        }
    });
});
