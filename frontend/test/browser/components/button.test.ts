import { test, expect, describe, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import ButtonTestWrapper from "@test/browser/wrappers/ButtonTestWrapper.svelte";

describe("Button Component (advanced)", () => {
    test("renders with accessible name and is visible", async () => {
        const { getByRole } = render(ButtonTestWrapper, {
            label: "Click me",
        });

        const button = getByRole("button", { name: "Click me" });
        await expect.element(button).toBeVisible();
    });

    test("calls onclick handler when clicked", async () => {
        const handler = vi.fn();
        const { getByRole } = render(ButtonTestWrapper, {
            label: "Press",
            onclick: handler,
        });

        const button = getByRole("button", { name: "Press" });
        await button.click();

        expect(handler).toHaveBeenCalledTimes(1);
    });

    test("does not call onclick when disabled", async () => {
        const handler = vi.fn();
        const { getByRole } = render(ButtonTestWrapper, {
            label: "Disabled",
            onclick: handler,
            disabled: true,
        });

        const button = getByRole("button", { name: "Disabled" });
        await button.click();

        expect(handler).not.toHaveBeenCalled();
    });

    test("handles multiple rapid clicks", async () => {
        const handler = vi.fn();
        const { getByRole } = render(ButtonTestWrapper, {
            label: "Rapid",
            onclick: handler,
        });

        const button = getByRole("button", { name: "Rapid" });
        await button.click();
        await button.click();
        await button.click();

        expect(handler).toHaveBeenCalledTimes(3);
    });

    test("respects variant prop", async () => {
        const { getByRole } = render(ButtonTestWrapper, {
            label: "Secondary",
            variant: "secondary",
        });

        const button = getByRole("button", { name: "Secondary" });
        await expect.element(button).toHaveClass(/btn-secondary/);
    });

    test("respects size prop", async () => {
        const { getByRole } = render(ButtonTestWrapper, {
            label: "Small",
            size: "sm",
        });

        const button = getByRole("button", { name: "Small" });
        await expect.element(button).toHaveClass(/btn-sm/);
    });

    test("renders disabled when disabled prop is true", async () => {
        const { getByRole } = render(ButtonTestWrapper, {
            label: "Disabled",
            disabled: true,
        });

        const button = getByRole("button", { name: "Disabled" });
        await expect.element(button).toHaveAttribute("disabled");
    });
});
