import { test, expect, describe, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import ButtonTestWrapper from "./ButtonTestWrapper.svelte";

describe("Button Component", () => {
    test("renders with accessible name and is visible", async () => {
        // Arrange
        const { getByRole } = render(ButtonTestWrapper, {
            label: "Click me",
        });

        // Act / Assert
        const button = getByRole("button", { name: "Click me" });
        await expect.element(button).toBeVisible();
    });

    test("calls onclick handler when clicked", async () => {
        // Arrange
        const handler = vi.fn();
        const { getByRole } = render(ButtonTestWrapper, {
            label: "Press",
            onclick: handler,
        });

        const button = getByRole("button", { name: "Press" });

        // Act
        await button.click();

        // Assert
        expect(handler).toHaveBeenCalledTimes(1);
    });

    test("respects variant prop", async () => {
        // Arrange
        const { getByRole } = render(ButtonTestWrapper, {
            label: "Secondary",
            variant: "secondary",
        });

        // Act / Assert
        const button = getByRole("button", { name: "Secondary" });
        await expect.element(button).toHaveClass(/btn-secondary/);
    });

    test("respects size prop", async () => {
        // Arrange
        const { getByRole } = render(ButtonTestWrapper, {
            label: "Small",
            size: "sm",
        });

        // Act / Assert
        const button = getByRole("button", { name: "Small" });
        await expect.element(button).toHaveClass(/btn-sm/);
    });

    test("renders disabled when disabled prop is true", async () => {
        // Arrange
        const { getByRole } = render(ButtonTestWrapper, {
            label: "Disabled",
            disabled: true,
        });

        // Act / Assert
        const button = getByRole("button", { name: "Disabled" });
        await expect.element(button).toHaveAttribute("disabled");
    });
});
