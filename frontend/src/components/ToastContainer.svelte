<script lang="ts">
    import { toastStore } from "@/lib/stores/toast.svelte";
    import XIcon from "phosphor-svelte/lib/XIcon";

    const alertClass = {
        info: "alert-info",
        success: "alert-success",
        warning: "alert-warning",
        error: "alert-error",
    } as const satisfies Record<string, string>;
</script>

<!--
  @component ToastContainer
  Displays toast notifications using DaisyUI alert components.
  Should be placed in App.svelte or layout.
-->
<div class="toast toast-end toast-bottom z-50">
    {#each toastStore.toasts as toast (toast.id)}
        <!-- An error interrupts the screen reader (alert); the other types wait their turn (status). -->
        <div
            class="alert {alertClass[toast.type]} shadow-lg"
            role={toast.type === "error" ? "alert" : "status"}
        >
            <span>{toast.message}</span>
            <button
                class="btn btn-ghost btn-xs btn-circle"
                aria-label="Close"
                onclick={() => toastStore.dismiss(toast.id)}
            >
                <XIcon class="w-4 h-4" size={16} />
            </button>
        </div>
    {/each}
</div>
