<script lang="ts" module>
    import { toastStore } from "@/lib/stores/toast.svelte";
    import XIcon from "phosphor-svelte/lib/XIcon";

    const alertClass: Record<string, string> = {
        info: "alert-info",
        success: "alert-success",
        warning: "alert-warning",
        error: "alert-error",
    };
</script>

<!--
  @component ToastContainer
  Displays toast notifications using DaisyUI alert components.
  Should be placed in App.svelte or layout.
-->
<div class="toast toast-end toast-bottom z-50">
    {#each toastStore.toasts as toast (toast.id)}
        <div class="alert {alertClass[toast.type]} shadow-lg">
            <span>{toast.message}</span>
            <button
                class="btn btn-ghost btn-xs btn-circle"
                onclick={() => toastStore.dismiss(toast.id)}
            >
                <XIcon class="w-4 h-4" size={16} />
            </button>
        </div>
    {/each}
</div>
