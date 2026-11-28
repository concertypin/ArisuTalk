import { describe, it, expect, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { toastStore, type ToastMessage } from "@/lib/stores/toast.svelte";
import ToastContainer from "@/components/ToastContainer.svelte";

/** Removes every toast and its pending timer, so tests do not leak into each other. */
function clearToasts() {
    for (const id of toastStore.toasts.map((toast) => toast.id)) toastStore.dismiss(id);
}

describe("ToastContainer", () => {
    afterEach(clearToasts);

    it("renders no toast while the store has none", () => {
        render(ToastContainer);

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it.each([
        ["info", "status", "alert-info"],
        ["success", "status", "alert-success"],
        ["warning", "status", "alert-warning"],
        ["error", "alert", "alert-error"],
    ] as const satisfies ReadonlyArray<
        readonly [ToastMessage["type"], "alert" | "status", string]
    >)("shows a %s toast with the %s role and the %s style", (type, role, className) => {
        toastStore.show(type, `${type} 메시지`, 0);
        render(ToastContainer);

        const toast = screen.getByRole(role);
        expect(toast).toHaveTextContent(`${type} 메시지`);
        expect(toast).toHaveClass("alert", className);
    });

    it("shows toasts added after it was mounted, in the order they were added", async () => {
        render(ToastContainer);

        toastStore.show("info", "첫째", 0);
        toastStore.show("success", "둘째", 0);

        await screen.findByText("둘째");
        const [first, second, ...rest] = screen.getAllByRole("status");
        expect(first).toHaveTextContent("첫째");
        expect(second).toHaveTextContent("둘째");
        expect(rest).toEqual([]);
    });

    it("dismisses only the toast whose close button was clicked", async () => {
        const user = userEvent.setup();
        toastStore.show("info", "남겨 두세요", 0);
        toastStore.show("warning", "닫아 주세요", 0);
        render(ToastContainer);

        const [, closeSecond] = screen.getAllByRole("button", { name: "Close" });
        await user.click(closeSecond);

        await waitFor(() => expect(screen.queryByText("닫아 주세요")).not.toBeInTheDocument());
        expect(screen.getByRole("status")).toHaveTextContent("남겨 두세요");
        expect(toastStore.toasts.map((t) => t.message)).toEqual(["남겨 두세요"]);
    });

    it("removes a toast from the screen when it times out", async () => {
        render(ToastContainer);

        toastStore.show("success", "잠깐 보임", 50);
        await screen.findByRole("status");

        await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
        expect(toastStore.toasts).toHaveLength(0);
    });
});
