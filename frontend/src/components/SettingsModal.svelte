<script lang="ts">
    import { uiState } from "@/lib/stores/ui.svelte";
    import { X } from "@lucide/svelte";
    let dialog: HTMLDialogElement;

    $effect(() => {
        // App.svelte conditionally renders this component.
        // When it mounts, we show the modal immediately.
        dialog?.showModal();
    });

    function close() {
        dialog?.close();
        uiState.closeSettingsModal();
    }

    function handleBackdropClick(e: MouseEvent) {
        // If the click is on the dialog itself (the backdrop area in native dialogs), close it.
        // We need to check if the click target is strictly the dialog element.
        if (e.target === dialog) {
            close();
        }
    }
</script>

<dialog bind:this={dialog} class="modal" onclose={close} onclick={handleBackdropClick}>
    <div class="modal-box border border-base-300">
        <!-- Header -->
        <header class="flex items-center justify-between pb-4 border-b border-base-300">
            <h2 class="text-lg font-semibold">Settings</h2>
            <button
                class="btn btn-ghost btn-sm btn-square"
                onclick={close}
                type="button"
                aria-label="Close settings"
            >
                <X size={20} />
            </button>
        </header>

        <!-- Body -->
        <div class="py-6 space-y-4">
            <fieldset class="fieldset w-full">
                <legend class="fieldset-legend">Username</legend>
                <input
                    id="username"
                    type="text"
                    class="input w-full"
                    placeholder="Enter your name"
                />
            </fieldset>

            <fieldset class="fieldset w-full">
                <legend class="fieldset-legend">Theme</legend>
                <select id="theme" class="select w-full">
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="system">System</option>
                </select>
            </fieldset>
        </div>

        <!-- Footer -->
        <div class="modal-action pt-4 border-t border-base-300">
            <button class="btn btn-primary" onclick={close}>Save</button>
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>
