<script lang="ts">
    import { uiState } from "@/lib/stores/ui.svelte";
    import Button from "@/components/ui/Button.svelte";
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

<!-- 
    The dialog element acts as the modal window.
    We reset some default styles and apply our own.
    The ::backdrop pseudo-element handles the background dimming.
-->
<dialog
    bind:this={dialog}
    class="w-full max-w-md bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden p-0 backdrop:bg-black/50 backdrop:backdrop-blur-sm text-white"
    onclose={close}
    onclick={handleBackdropClick}
>
    <!-- Header -->
    <header class="flex items-center justify-between p-4 border-b border-gray-800">
        <h2 class="text-lg font-semibold">Settings</h2>
        <button
            class="text-gray-400 hover:text-white focus:outline-none"
            onclick={close}
            type="button"
            aria-label="Close settings"
        >
            <X />
        </button>
    </header>

    <!-- Body -->
    <div class="p-6 space-y-4">
        <div>
            <label for="username" class="block text-sm font-medium text-gray-300 mb-1"
                >Username</label
            >
            <input
                id="username"
                type="text"
                class="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-indigo-500"
                placeholder="Enter your name"
            />
        </div>
        <div>
            <label for="theme" class="block text-sm font-medium text-gray-300 mb-1">Theme</label>
            <select
                id="theme"
                class="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-indigo-500"
            >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
            </select>
        </div>
    </div>

    <!-- Footer -->
    <footer class="p-4 border-t border-gray-800 bg-gray-800/50 flex justify-end">
        <Button onclick={close}>Save</Button>
    </footer>
</dialog>

<style>
    /* Reset dialog default styling adjustments */
    dialog {
        margin: auto; /* Centers the dialog */
    }

    dialog::backdrop {
        animation: fade-in 0.2s ease-out;
    }

    dialog[open] {
        animation: slide-up 0.3s ease-out;
    }

    @keyframes fade-in {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes slide-up {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
</style>
