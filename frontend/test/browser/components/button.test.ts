import { test, expect, describe, vi } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import ButtonTestWrapper from "../wrappers/ButtonTestWrapper.svelte";

describe("Button Component", () => {
    test("calls onclick handler when clicked", async () => {
        // Arrange
        const user = userEvent.setup();
        const handler = vi.fn();
        render(ButtonTestWrapper, { props: { label: "Press", onclick: handler } });

        const button = screen.getByRole("button", { name: "Press" });

        // Act
        await user.click(button);

        // Assert
        expect(handler).toHaveBeenCalledTimes(1);
    });

    test("respects variant prop", () => {
        // Arrange
        render(ButtonTestWrapper, { props: { label: "Secondary", variant: "secondary" } });

        // Act / Assert
        const button = screen.getByRole("button", { name: "Secondary" });
        expect(button).toHaveClass("btn-secondary");
    });

    test("respects size prop", () => {
        // Arrange
        render(ButtonTestWrapper, { props: { label: "Small", size: "sm" } });

        // Act / Assert
        const button = screen.getByRole("button", { name: "Small" });
        expect(button).toHaveClass("btn-sm");
    });

    test("renders disabled when disabled prop is true", () => {
        // Arrange
        render(ButtonTestWrapper, { props: { label: "Disabled", disabled: true } });

        // Act / Assert
        const button = screen.getByRole("button", { name: "Disabled" });
        expect(button).toBeDisabled();
    });
});
