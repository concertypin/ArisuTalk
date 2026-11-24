import { test, expect, describe, vi } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import MessageActions from "@/components/chat/MessageActions.svelte";

describe("MessageActions Component", () => {
    describe("while editing", () => {
        test("the save button names Enter, the key that really saves", () => {
            render(MessageActions, { props: { isEditing: true } });

            const save = screen.getByRole("button", { name: "Save edit (Enter)" });

            expect(save).toBeInTheDocument();
            // The old tooltip promised Ctrl+Enter, although plain Enter submits.
            expect(save.getAttribute("title")).not.toMatch(/ctrl/i);
        });

        test("save and cancel call their callbacks", async () => {
            const user = userEvent.setup();
            const onConfirmEdit = vi.fn();
            const onCancelEdit = vi.fn();
            render(MessageActions, { props: { isEditing: true, onConfirmEdit, onCancelEdit } });

            await user.click(screen.getByRole("button", { name: "Save edit (Enter)" }));
            await user.click(screen.getByRole("button", { name: "Cancel edit (Esc)" }));

            expect(onConfirmEdit).toHaveBeenCalledOnce();
            expect(onCancelEdit).toHaveBeenCalledOnce();
        });
    });

    describe("delete confirmation", () => {
        test("the first click only asks for confirmation", async () => {
            const user = userEvent.setup();
            const onDelete = vi.fn();
            render(MessageActions, { props: { onDelete } });

            await user.click(screen.getByRole("button", { name: "Delete message" }));

            expect(onDelete).not.toHaveBeenCalled();
            expect(
                await screen.findByRole("button", { name: "Click again to confirm delete" })
            ).toBeInTheDocument();
        });

        test("the confirm button is styled as destructive, unlike the neutral ones", async () => {
            const user = userEvent.setup();
            render(MessageActions, {});
            await user.click(screen.getByRole("button", { name: "Delete message" }));

            const confirm = await screen.findByRole("button", {
                name: "Click again to confirm delete",
            });
            const cancel = screen.getByRole("button", { name: "Cancel delete" });

            expect(confirm).toHaveClass("btn-error");
            expect(confirm).toHaveClass("animate-pulse");
            expect(confirm).not.toHaveClass("btn-ghost");
            expect(cancel).toHaveClass("btn-ghost");
            expect(cancel).not.toHaveClass("btn-error");
        });

        test("the second click deletes", async () => {
            const user = userEvent.setup();
            const onDelete = vi.fn();
            render(MessageActions, { props: { onDelete } });

            await user.click(screen.getByRole("button", { name: "Delete message" }));
            await user.click(
                await screen.findByRole("button", { name: "Click again to confirm delete" })
            );

            expect(onDelete).toHaveBeenCalledOnce();
            expect(
                await screen.findByRole("button", { name: "Delete message" })
            ).toBeInTheDocument();
        });

        test("cancelling returns to the normal buttons without deleting", async () => {
            const user = userEvent.setup();
            const onDelete = vi.fn();
            render(MessageActions, { props: { onDelete } });

            await user.click(screen.getByRole("button", { name: "Delete message" }));
            await user.click(await screen.findByRole("button", { name: "Cancel delete" }));

            expect(onDelete).not.toHaveBeenCalled();
            expect(await screen.findByRole("button", { name: "Delete message" })).not.toHaveClass(
                "btn-error"
            );
        });
    });

    describe("default buttons", () => {
        test("regenerate is offered for assistant messages only", () => {
            const assistant = render(MessageActions, { props: { isAssistant: true } });
            expect(screen.getByRole("button", { name: "Regenerate response" })).toBeInTheDocument();
            assistant.unmount();

            render(MessageActions, { props: { isAssistant: false } });
            expect(
                screen.queryByRole("button", { name: "Regenerate response" })
            ).not.toBeInTheDocument();
        });

        test("edit and regenerate call their callbacks", async () => {
            const user = userEvent.setup();
            const onEdit = vi.fn();
            const onRegenerate = vi.fn();
            render(MessageActions, { props: { isAssistant: true, onEdit, onRegenerate } });

            await user.click(screen.getByRole("button", { name: "Edit message" }));
            await user.click(screen.getByRole("button", { name: "Regenerate response" }));

            expect(onEdit).toHaveBeenCalledOnce();
            expect(onRegenerate).toHaveBeenCalledOnce();
        });
    });
});
