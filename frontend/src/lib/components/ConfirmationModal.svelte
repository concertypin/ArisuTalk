<script lang="ts">
import { t } from "$root/i18n";
import { AlertTriangle } from "lucide-svelte";
import { onDestroy, onMount } from "svelte";

import {
	confirmationModalData,
	isConfirmationModalVisible,
} from "../stores/ui";

function handleCancel() {
	isConfirmationModalVisible.set(false);
	confirmationModalData.set({ title: "", message: "", onConfirm: null });
}

function handleConfirm() {
	if ($confirmationModalData.onConfirm) {
		$confirmationModalData.onConfirm();
	}
	handleCancel(); // Close modal after confirm
}

function handleKeydown(event: KeyboardEvent) {
	if (event.key === "Escape") {
		handleCancel();
	}
}

onMount(() => {
	window.addEventListener("keydown", handleKeydown);
});

onDestroy(() => {
	window.removeEventListener("keydown", handleKeydown);
});
</script>

{#if $isConfirmationModalVisible}
    <div
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]"
    >
        <div
            role="dialog"
            aria-modal="true"
            tabindex="0"
            class="bg-gray-800 rounded-2xl p-6 w-full max-w-sm mx-4 text-center"
            on:click|stopPropagation
            on:keydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleConfirm();
                }
            }}
        >
            <div
                class="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4"
            >
                <AlertTriangle
                    class="w-6 h-6 {$confirmationModalData.onConfirm
                        ? 'text-red-400'
                        : 'text-blue-400'}"
                />
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">
                {$confirmationModalData.title}
            </h3>
            <p class="text-sm text-gray-300 mb-6 whitespace-pre-wrap">
                {$confirmationModalData.message}
            </p>
            <div class="flex justify-stretch space-x-3">
                <button
                    on:click={handleCancel}
                    class="flex-1 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                    {$confirmationModalData.onConfirm
                        ? t("confirm.cancel")
                        : t("confirm.confirm")}
                </button>
                {#if $confirmationModalData.onConfirm}
                    <button
                        on:click={handleConfirm}
                        class="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                        {t("common.confirm")}
                    </button>
                {/if}
            </div>
        </div>
    </div>
{/if}
