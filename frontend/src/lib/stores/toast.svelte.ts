/**
 * Simple toast notification store using Svelte 5 runes.
 */

export interface ToastMessage {
    id: string;
    type: "info" | "success" | "warning" | "error";
    message: string;
}

class ToastStore {
    toasts = $state<ToastMessage[]>([]);
    private timers = new Map<string, ReturnType<typeof setTimeout>>();

    /**
     * Shows a toast notification.
     * @param type - The type of toast (info, success, warning, error).
     * @param message - The message to display.
     * @param duration - Duration in ms before auto-dismiss (default: 3000).
     */
    show(type: ToastMessage["type"], message: string, duration = 3000) {
        const id = crypto.randomUUID();
        this.toasts.push({ id, type, message });

        if (duration > 0) {
            const timer = setTimeout(() => this.dismiss(id), duration);
            this.timers.set(id, timer);
        }
    }

    /** Convenience method for error toasts */
    error(message: string, duration = 5000) {
        this.show("error", message, duration);
    }

    /** Convenience method for success toasts */
    success(message: string, duration = 3000) {
        this.show("success", message, duration);
    }

    /** Convenience method for info toasts */
    info(message: string, duration = 3000) {
        this.show("info", message, duration);
    }

    /** Convenience method for warning toasts */
    warning(message: string, duration = 4000) {
        this.show("warning", message, duration);
    }

    /** Dismisses a toast by ID */
    dismiss(id: string) {
        const index = this.toasts.findIndex((t) => t.id === id);
        if (index !== -1) {
            this.toasts.splice(index, 1);
        }
        // Clear timer if exists to prevent orphaned timeouts
        if (this.timers.has(id)) {
            clearTimeout(this.timers.get(id));
            this.timers.delete(id);
        }
    }
}

export const toastStore = new ToastStore();
