<script lang="ts">
    import { characterStore } from "../stores/characterStore.svelte";
    import CharacterCard from "./CharacterCard.svelte";
    import { getCardParseWorker } from "@/lib/workers/workerClient";
    import { OpFSAssetStorageAdapter } from "../adapters/assetStorage/OpFSAssetStorageAdapter";

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
    /**
     * Converts a Blob to a Base64 Data URL.
     * @license https://developer.mozilla.org/ko/docs/MDN/Writing_guidelines/Attrib_copyright_license
     * @copyright {@link https://developer.mozilla.org/ko/docs/Glossary/Base64} by MDN contributors
     */
    async function blobsToBase64DataUrl(
        bytes: Blob,
        type: string = "application/octet-stream"
    ): Promise<string> {
        return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => {
                const reason = reader.error ?? new Error("FileReader failed");
                reject(reason instanceof Error ? reason : new Error(String(reason)));
            };
            reader.readAsDataURL(new File([bytes], "", { type }));
        });
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
        // Since we need to remap local files to base64 urls,
        // cloning first to avoid mutating store data.
        const char = structuredClone(characterStore.characters[index]);

        // All of assets should be replaced with base64 url,
        // since others can't access our local files.
        type AssetsType = (typeof char.assets.assets)[number];

        async function remapAsBase64(i: AssetsType): Promise<AssetsType> {
            if (i.url.startsWith("data:")) {
                return i; // Already base64
            } else if (i.url.startsWith("http://") || i.url.startsWith("https://")) {
                return i; // Remote URL, leave as is.
            } else {
                // Local file, read as base64
                try {
                    const assetStorage = new OpFSAssetStorageAdapter();
                    await assetStorage.init();

                    const blob = await assetStorage.getAssetBlob(new URL(i.url));
                    const base64 = await blobsToBase64DataUrl(blob, i.mimeType);
                    return { ...i, url: base64 };
                } catch (e) {
                    console.error("Failed to fetch local file for export:", i.url, e);
                    throw e instanceof Error ? e : new Error(String(e));
                }
            }
        }
        const newAssets = await Promise.all(char.assets.assets.map(remapAsBase64));
        char.assets.assets = newAssets;

        const result = await (await worker).exportCharacter(char);
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
