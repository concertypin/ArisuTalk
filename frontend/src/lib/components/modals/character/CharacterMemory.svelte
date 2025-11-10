<script>
    import { t } from "$root/i18n";
    import { PlusCircle, Trash2 } from "lucide-svelte";

    export let memories = [];

    function addMemory() {
        memories = [...memories, ""];
    }

    function deleteMemory(index) {
        memories = memories.filter((_, i) => i !== index);
    }

    function updateMemory(index, value) {
        memories[index] = value;
        // Svelte needs a reassignment to trigger reactivity for arrays
        memories = memories;
    }
</script>

<details class="group border-t border-gray-700/50 pt-4">
    <summary class="flex items-center justify-between cursor-pointer list-none">
        <span class="text-base font-medium text-gray-200"
            >{t("characterModal.memory")}</span
        >
        <slot name="chevron" />
    </summary>
    <div class="pt-4 space-y-2">
        {#each memories as memory, i}
            <div class="flex items-center gap-2">
                <input
                    type="text"
                    class="memory-input flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm"
                    value={memory}
                    on:input={(e) => updateMemory(i, e.target.value)}
                    placeholder={t("characterModal.memoryPlaceholder")}
                />
                <button
                    on:click={() => deleteMemory(i)}
                    class="p-2 text-gray-400 hover:text-red-400"
                >
                    <Trash2 class="w-4 h-4" />
                </button>
            </div>
        {/each}
        <button
            on:click={addMemory}
            class="mt-3 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2"
        >
            <PlusCircle class="w-4 h-4" />
            {t("characterModal.addMemory")}
        </button>
    </div>
</details>
