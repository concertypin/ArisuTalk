<script lang="ts">
    import { characterStore } from "../stores/characterStore.svelte";
    import CharacterCard from "./CharacterCard.svelte";
    import { getCardParseWorker } from "@/lib/workers/workerClient";
    import { OpFSAssetStorageAdapter } from "../adapters/assetStorage/OpFSAssetStorageAdapter";
    import { transfer } from "comlink";
    import { remapAssetToUint8Array, collectTransferableBuffers } from "../utils/assetEncoding";

    interface Props {
        onEdit: (index: number) => void;
    }

    let { onEdit }: Props = $props();
    let worker = getCardParseWorker();

    async function handleDelete(index: number) {
        const modal = document.getElementById("delete-confirm-modal") as HTMLDialogElement;
        if (!modal) {
            console.error("Delete confirmation modal not found");
            return;
        }

        // Store the index to be deleted
        modal.dataset.deleteIndex = index.toString();

        // Show the modal
        modal.showModal();
    }

    async function confirmDelete() {
        const modal = document.getElementById("delete-confirm-modal") as HTMLDialogElement;
        if (!modal) return;

        const idxStr = modal.dataset.deleteIndex;
        if (!idxStr) {
            console.error("No delete index set on modal");
            modal.close();
            return;
        }
        const index = Number(idxStr);
        if (!Number.isFinite(index)) {
            console.error("Invalid delete index on modal:", idxStr);
            modal.close();
            return;
        }
        await characterStore.remove(index);

        // Close the modal
        modal.close();
    }

    async function arrayBufferLikeToBlob(
        data: ArrayBufferLike | Blob,
        type: string = "application/octet-stream"
    ): Promise<Blob> {
        if (data instanceof Blob) {
            return data;
        }
        if (data instanceof ArrayBuffer) {
            return new Blob([data], { type });
        }
        throw new Error("Not expected branch. Basically unreachable.");
    }

    async function handleExport(index: number) {
        // Export character at index
        // Cloning first to avoid mutating store data.
        const char = structuredClone($state.snapshot(characterStore.characters[index]));

        // Remap all assets to use Uint8Array for binary data
        const assetStorage = new OpFSAssetStorageAdapter();
        const newAssets = await Promise.all(
            char.assets.assets.map((asset) => remapAssetToUint8Array(asset, assetStorage))
        );
        char.assets.assets = newAssets;

        // Collect all ArrayBuffers from Uint8Array assets for transfer (zero-copy)
        const transferables = collectTransferableBuffers(newAssets);

        const result = await (await worker).exportCharacter(transfer(char, transferables));
        // this is now ready to download or save.
        // ensure we have a Blob for createObjectURL; worker may return an ArrayBuffer/SharedArrayBuffer

        const blob = await arrayBufferLikeToBlob(result, "application/octet-stream");

        const url = URL.createObjectURL(blob);
        //download as file
        const a = document.createElement("a");
        a.href = url;
        a.download = `${char.name || "character"}.arisc`; // Browser will handle invalid filename chars
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
</script>

<!-- DaisyUI Modal for Delete Confirmation -->
<dialog id="delete-confirm-modal" class="modal">
    <div class="modal-box">
        <h3 class="font-bold text-lg">Delete Character</h3>
        <p class="py-4">
            Are you sure you want to delete this character? This action cannot be undone.
        </p>
        <div class="modal-action">
            <form method="dialog">
                <!-- if there is a button in form, it will close the modal -->
                <button class="btn btn-ghost">Cancel</button>
                <button class="btn btn-error" onclick={confirmDelete}>Delete</button>
            </form>
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
    {#each characterStore.characters as character, index (character.id)}
        <CharacterCard
            {character}
            onEdit={() => onEdit(index)}
            onDelete={() => handleDelete(index)}
            onExport={() => handleExport(index)}
            onMove={(dir: number) => characterStore.reorder(index, index + dir)}
            isFirst={index === 0}
            isLast={index === characterStore.characters.length - 1}
        />
    {/each}
</div>

{#if characterStore.characters.length === 0}
    <div class="text-center p-10 opacity-50">
        No characters found. Import or create one based on your heart!
    </div>
{/if}
