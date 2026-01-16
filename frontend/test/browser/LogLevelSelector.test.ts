import { test, expect, describe, vi, beforeEach } from "vitest";
import { render } from "vitest-browser-svelte";
import LogLevelSelector from "@/components/ui/LogLevelSelector.svelte";
import { Logger } from "@common/logger/Logger";

describe.concurrent("LogLevelSelector Component", () => {
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
});
