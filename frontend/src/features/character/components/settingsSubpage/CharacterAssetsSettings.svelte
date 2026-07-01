<script lang="ts">
    /**
     * @component CharacterAssetsSettings
     * Asset management: upload, preview, naming, delete, and reorder.
     */
    import { SvelteMap } from "svelte/reactivity";
    import type { Character } from "@arisutalk/character-spec/v0/Character";
    import type { AssetEntity } from "@arisutalk/character-spec/v0/Character/Assets";
    import { merge } from "lodash-es";
    import UploadSimple from "phosphor-svelte/lib/UploadSimpleIcon";
    import Trash from "phosphor-svelte/lib/TrashIcon";
    import CaretDown from "phosphor-svelte/lib/CaretDownIcon";
    import CaretUp from "phosphor-svelte/lib/CaretUpIcon";
    import DotsSixVertical from "phosphor-svelte/lib/DotsSixVerticalIcon";
    import { getAssetStorage } from "@/features/character/adapters/assetStorage/assetStorageResolver";
    import { Logger } from "@common/logger/Logger";

    type Props = {
        character: Character;
        onChange: (character: Character) => void;
    };

    let { character, onChange }: Props = $props();

    let fileInput = $state<HTMLInputElement>();
    let expandOtherAssets = $state(false);
    let duplicateNameError = $state<string | null>(null);
    let draggedIndex = $state<number | null>(null);
    let assetPreviews = new SvelteMap<string, string>();

    const assetStorage = getAssetStorage();

    // Load asset preview URLs
    $effect(() => {
        const loadPreviews = async () => {
            for (const asset of character.assets.assets) {
                if (typeof asset.data === "string" && asset.data.startsWith("local:")) {
                    try {
                        await assetStorage.init();
                        const url = await assetStorage.getAssetUrl(new URL(asset.data));
                        assetPreviews.set(asset.id, url);
                    } catch (e) {
                        Logger.error("Failed to load asset preview:", asset.id, e);
                    }
                }
            }
        };
        void loadPreviews();
    });

    const imageAssets = $derived(
        character.assets.assets.filter((a) => a.mimeType.startsWith("image/"))
    );
    const otherAssets = $derived(
        character.assets.assets.filter((a) => !a.mimeType.startsWith("image/"))
    );

    async function handleFileUpload(e: Event) {
        const input = e.target;
        if (!(input instanceof HTMLInputElement)) return;
        const files = input.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        const baseName = file.name;

        try {
            await assetStorage.init();

            // Use ID-based filename to avoid collision even if names are duplicate
            const id = crypto.randomUUID();
            const extension = baseName.split(".").pop();
            // If extension exists, keep it. Otherwise just use ID.
            const storageName = extension && baseName.includes(".") ? `${id}.${extension}` : id;

            const localUrl = await assetStorage.saveAsset(storageName, file);

            const newAsset: AssetEntity = {
                id,
                name: baseName,
                mimeType: file.type,
                data: localUrl.toString(),
            };

            onChange(
                merge({}, character, {
                    assets: {
                        assets: [...character.assets.assets, newAsset],
                    },
                })
            );

            Logger.info("Asset uploaded:", baseName, file.type);
        } catch (err) {
            Logger.error("Failed to upload asset:", err);
            duplicateNameError = "Failed to upload asset. Please try again.";
            setTimeout(() => (duplicateNameError = null), 3000);
        }

        input.value = "";
    }

    function updateAssetName(index: number, newName: string) {
        // No duplicate check needed as per new spec (v0.0.17)
        const updatedAssets = [...character.assets.assets];
        updatedAssets[index] = { ...updatedAssets[index], name: newName };

        onChange(
            merge({}, character, {
                assets: { assets: updatedAssets },
            })
        );
    }

    async function deleteAsset(index: number) {
        const asset = character.assets.assets[index];

        // Cleanup storage in background
        if (typeof asset.data === "string" && asset.data.startsWith("local:")) {
            void assetStorage.deleteAsset(new URL(asset.data)).catch((e) => {
                Logger.error("Failed to delete asset from storage:", e);
            });
        }

        const updatedAssets = character.assets.assets.filter((_, i) => i !== index);
        onChange(
            merge({}, character, {
                assets: { assets: updatedAssets },
            })
        );

        Logger.info("Asset deleted:", asset.name);
    }

    function handleDragStart(index: number) {
        draggedIndex = index;
    }

    function handleDragOver(e: DragEvent, targetIndex: number) {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === targetIndex) return;

        const updatedAssets = [...character.assets.assets];
        const [draggedItem] = updatedAssets.splice(draggedIndex, 1);
        updatedAssets.splice(targetIndex, 0, draggedItem);

        draggedIndex = targetIndex;

        onChange(
            merge({}, character, {
                assets: { assets: updatedAssets },
            })
        );
    }

    function handleDragEnd() {
        draggedIndex = null;
    }
</script>

<div class="space-y-6">
    <h3 class="text-lg font-semibold">Assets</h3>

    <!-- Upload Section -->
    <fieldset class="fieldset w-full">
        <label for="asset-upload" class="fieldset-legend">Upload Asset</label>
        <div class="flex gap-2">
            <input
                bind:this={fileInput}
                type="file"
                id="asset-upload"
                class="file-input file-input-bordered flex-1"
                onchange={handleFileUpload}
            />
            <button
                class="btn btn-primary"
                onclick={() => fileInput?.click()}
                aria-label="Upload Asset"
            >
                <UploadSimple size={18} />
                Upload
            </button>
        </div>
    </fieldset>

    <!-- Duplicate Name Error Toast -->
    {#if duplicateNameError}
        <div role="alert" class="alert alert-error">
            <span>{duplicateNameError}</span>
        </div>
    {/if}

    <!-- Image Assets Grid -->
    {#if imageAssets.length > 0}
        <div class="space-y-2">
            <h4 class="font-medium">Images</h4>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                {#each imageAssets as asset, _ (asset.id)}
                    {@const globalIndex = character.assets.assets.indexOf(asset)}
                    {@const previewUrl = assetPreviews.get(asset.id)}
                    <div
                        class="border border-base-300 rounded-lg p-3 bg-base-100 cursor-move"
                        draggable="true"
                        ondragstart={() => handleDragStart(globalIndex)}
                        ondragover={(e) => handleDragOver(e, globalIndex)}
                        ondragend={handleDragEnd}
                        role="button"
                        tabindex="0"
                    >
                        <div class="flex items-start gap-2 mb-2">
                            <DotsSixVertical size={16} class="text-base-content/50 mt-1" />
                            <div class="flex-1 min-w-0">
                                <input
                                    type="text"
                                    class="input input-sm w-full"
                                    value={asset.name}
                                    oninput={(e) =>
                                        updateAssetName(globalIndex, e.currentTarget.value)}
                                    placeholder="Asset name"
                                />
                            </div>
                            <button
                                class="btn btn-ghost btn-sm btn-square"
                                onclick={() => deleteAsset(globalIndex)}
                                aria-label="Delete asset"
                            >
                                <Trash size={16} />
                            </button>
                        </div>
                        {#if previewUrl}
                            <img
                                src={previewUrl}
                                alt={asset.name}
                                class="w-full h-32 object-cover rounded"
                            />
                        {:else}
                            <div
                                class="w-full h-32 bg-base-200 rounded flex items-center justify-center"
                            >
                                <span class="text-sm text-base-content/50">Loading...</span>
                            </div>
                        {/if}
                        <p class="text-xs text-base-content/50 mt-2 truncate">{asset.mimeType}</p>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Other Assets (Collapsed) -->
    {#if otherAssets.length > 0}
        <div class="border border-base-300 rounded-lg overflow-hidden bg-base-100">
            <div
                class="flex items-center justify-between p-3 bg-base-200/50 cursor-pointer hover:bg-base-200"
                onclick={() => (expandOtherAssets = !expandOtherAssets)}
                onkeydown={(e) => e.key === "Enter" && (expandOtherAssets = !expandOtherAssets)}
                role="button"
                tabindex="0"
            >
                <h4 class="font-medium">Other Assets ({otherAssets.length})</h4>
                {#if expandOtherAssets}
                    <CaretUp size={16} />
                {:else}
                    <CaretDown size={16} />
                {/if}
            </div>

            {#if expandOtherAssets}
                <div class="p-3 space-y-2">
                    {#each otherAssets as asset (asset.id)}
                        {@const globalIndex = character.assets.assets.indexOf(asset)}
                        <div
                            class="flex items-center gap-2 p-2 border border-base-300 rounded bg-base-100 cursor-move"
                            draggable="true"
                            ondragstart={() => handleDragStart(globalIndex)}
                            ondragover={(e) => handleDragOver(e, globalIndex)}
                            ondragend={handleDragEnd}
                            role="button"
                            tabindex="0"
                        >
                            <DotsSixVertical size={16} class="text-base-content/50" />
                            <div class="flex-1 min-w-0">
                                <input
                                    type="text"
                                    class="input input-sm w-full"
                                    value={asset.name}
                                    oninput={(e) =>
                                        updateAssetName(globalIndex, e.currentTarget.value)}
                                    placeholder="Asset name"
                                />
                                <p class="text-xs text-base-content/50 mt-1">{asset.mimeType}</p>
                            </div>
                            <button
                                class="btn btn-ghost btn-sm btn-square"
                                onclick={() => deleteAsset(globalIndex)}
                                aria-label="Delete asset"
                            >
                                <Trash size={16} />
                            </button>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}

    <!-- Empty State -->
    {#if character.assets.assets.length === 0}
        <div class="text-center py-8 text-base-content/50">
            <p>No assets yet.</p>
            <p class="text-sm">Upload images or other files to embed in your character.</p>
        </div>
    {/if}
</div>
