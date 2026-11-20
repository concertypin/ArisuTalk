import { test, expect, describe, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import MessageActions from "@/components/chat/MessageActions.svelte";

describe("MessageActions Component", () => {
    describe("while editing", () => {
        test("the save button names Enter, the key that really saves", async () => {
            const screen = render(MessageActions, { isEditing: true });

            const save = screen.getByRole("button", { name: "Save edit (Enter)" });

            await expect.element(save).toBeInTheDocument();
            // The old tooltip promised Ctrl+Enter, although plain Enter submits.
            expect(save.element().getAttribute("title")).not.toMatch(/ctrl/i);
        });

        test("save and cancel call their callbacks", async () => {
            const onConfirmEdit = vi.fn();
            const onCancelEdit = vi.fn();
            const screen = render(MessageActions, { isEditing: true, onConfirmEdit, onCancelEdit });

            await screen.getByRole("button", { name: "Save edit (Enter)" }).click();
            await screen.getByRole("button", { name: "Cancel edit (Esc)" }).click();

            expect(onConfirmEdit).toHaveBeenCalledOnce();
            expect(onCancelEdit).toHaveBeenCalledOnce();
        });
    });

    describe("delete confirmation", () => {
        test("the first click only asks for confirmation", async () => {
            const onDelete = vi.fn();
            const screen = render(MessageActions, { onDelete });

            await screen.getByRole("button", { name: "Delete message" }).click();

            expect(onDelete).not.toHaveBeenCalled();
            await expect
                .element(screen.getByRole("button", { name: "Click again to confirm delete" }))
                .toBeInTheDocument();
        });

        test("the confirm button is styled as destructive, unlike the neutral ones", async () => {
            const screen = render(MessageActions, {});
            await screen.getByRole("button", { name: "Delete message" }).click();

            const confirm = screen.getByRole("button", { name: "Click again to confirm delete" });
            const cancel = screen.getByRole("button", { name: "Cancel delete" });

            await expect.element(confirm).toHaveClass("btn-error");
            await expect.element(confirm).toHaveClass("animate-pulse");
            await expect.element(confirm).not.toHaveClass("btn-ghost");
            await expect.element(cancel).toHaveClass("btn-ghost");
            await expect.element(cancel).not.toHaveClass("btn-error");
        });

        test("the second click deletes", async () => {
            const onDelete = vi.fn();
            const screen = render(MessageActions, { onDelete });

            await screen.getByRole("button", { name: "Delete message" }).click();
            await screen.getByRole("button", { name: "Click again to confirm delete" }).click();

            expect(onDelete).toHaveBeenCalledOnce();
            await expect
                .element(screen.getByRole("button", { name: "Delete message" }))
                .toBeInTheDocument();
        });

        test("cancelling returns to the normal buttons without deleting", async () => {
            const onDelete = vi.fn();
            const screen = render(MessageActions, { onDelete });

            await screen.getByRole("button", { name: "Delete message" }).click();
            await screen.getByRole("button", { name: "Cancel delete" }).click();

            expect(onDelete).not.toHaveBeenCalled();
            await expect
                .element(screen.getByRole("button", { name: "Delete message" }))
                .not.toHaveClass("btn-error");
        });
    });

    describe("default buttons", () => {
        test("regenerate is offered for assistant messages only", async () => {
            const assistant = render(MessageActions, { isAssistant: true });
            await expect
                .element(assistant.getByRole("button", { name: "Regenerate response" }))
                .toBeInTheDocument();
            await assistant.unmount();

            const user = render(MessageActions, { isAssistant: false });
            await expect
                .element(user.getByRole("button", { name: "Regenerate response" }))
                .not.toBeInTheDocument();
        });

        test("edit and regenerate call their callbacks", async () => {
            const onEdit = vi.fn();
            const onRegenerate = vi.fn();
            const screen = render(MessageActions, { isAssistant: true, onEdit, onRegenerate });

            await screen.getByRole("button", { name: "Edit message" }).click();
            await screen.getByRole("button", { name: "Regenerate response" }).click();

            expect(onEdit).toHaveBeenCalledOnce();
            expect(onRegenerate).toHaveBeenCalledOnce();
        });
    });
});
