import { test, expect, describe, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import LogLevelSelector from "@/components/ui/LogLevelSelector.svelte";
import { Logger } from "@common/logger/Logger";

describe("LogLevelSelector Component", () => {
    beforeEach(() => {
        vi.spyOn(Logger, "setLevel").mockImplementation(() => {});
        vi.spyOn(Logger, "getLevel").mockReturnValue("info");
    });

    test("renders correctly with current level", () => {
        render(LogLevelSelector);

        const select = screen.getByRole("combobox");
        expect(select).toBeInTheDocument();
        expect(select).toHaveValue("info");
    });

    test("updates log level on change", async () => {
        const user = userEvent.setup();
        render(LogLevelSelector);

        const select = screen.getByRole("combobox");
        await user.selectOptions(select, "debug");

        expect(Logger.setLevel).toHaveBeenCalledWith("debug");
    });
});
