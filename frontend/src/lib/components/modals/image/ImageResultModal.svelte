<script lang="ts">
    import { createEventDispatcher, onMount, onDestroy } from "svelte";
    import { fade } from "svelte/transition";
    import { X, Info } from "lucide-svelte";

    export let isOpen = false;
    export let imageUrl = "";
    export let promptText = "";

    const dispatch = createEventDispatcher();

    function closeModal() {
        dispatch("close");
    }

    function handleKeydown(event) {
        if (event.key === "Escape") {
            closeModal();
        }
    }

    onMount(() => {
        window.addEventListener("keydown", handleKeydown);
    });

    onDestroy(() => {
        window.removeEventListener("keydown", handleKeydown);
    });
</script>

{#if isOpen}
    <div
        transition:fade={{ duration: 200 }}
        class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[9999] flex items-center justify-center"
    >
        <div
            role="dialog"
            aria-modal="true"
            tabindex="0"
            aria-labelledby="image-result-title"
            class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            on:click|stopPropagation
            on:keydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                }
            }}
        >
            <div
                class="border-b px-6 py-4 flex justify-between items-center sticky top-0 bg-white"
            >
                <h3
                    id="image-result-title"
                    class="text-xl font-semibold text-gray-900"
                >
                    외모 프롬프트 테스트 결과
                </h3>
                <button
                    on:click={closeModal}
                    class="text-gray-400 hover:text-gray-600"
                >
                    <X class="w-6 h-6" />
                </button>
            </div>

            <div class="p-6">
                <div class="mb-6 flex justify-center">
                    <img
                        src={imageUrl}
                        alt="생성된 이미지"
                        class="max-w-full h-auto rounded-lg shadow-lg"
                        style="max-height: 60vh;"
                    />
                </div>

                <div class="bg-gray-50 rounded-lg p-4">
                    <h4 class="text-sm font-semibold text-gray-700 mb-2">
                        사용된 프롬프트:
                    </h4>
                    <p class="text-sm text-gray-600 leading-relaxed break-all">
                        {promptText}
                    </p>
                </div>

                <div class="mt-4 text-center">
                    <span
                        class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                        Happy (행복)
                    </span>
                </div>
            </div>

            <div class="border-t px-6 py-4 flex justify-between">
                <div class="text-sm text-gray-500 flex items-center">
                    <Info class="w-4 h-4 mr-1" />
                    이 이미지는 테스트용이며 저장되지 않습니다
                </div>
                <button
                    on:click={closeModal}
                    class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                    닫기
                </button>
            </div>
        </div>
    </div>
{/if}
