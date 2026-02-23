<script lang="ts">
    /**
     * @component CharacterBasicSettings
     * Basic character info: name, description, avatar.
     * Fields include helper text based on character-spec JSDoc.
     */
    import { SvelteMap, SvelteSet } from "svelte/reactivity";
    import { getAssetStorage } from "@/features/character/adapters/assetStorage/assetStorageResolver";
    import { Logger } from "@common/logger/Logger";
    import { IfNotExistBehavior } from "@/lib/interfaces";
    import type { Character } from "@arisutalk/character-spec/v0/Character";
    import { merge } from "lodash-es";

    type Props = {
        character: Character;
        onChange: (character: Character) => void;
    };

    const { character, onChange }: Props = $props();

    const assetStorage = getAssetStorage();
    const assetPreviews = new SvelteMap<string, string>();
    let showManualUrl = $state(false);

    let imageAssets = $derived(
        character.assets.assets.filter((a) => a.mimeType.startsWith("image/"))
    );

    // Load image previews
    $effect(() => {
        let revoked = false;
        const blobUrls = new SvelteSet<string | Uint8Array<ArrayBuffer>>();

        const loadPreviews = async () => {
            await assetStorage.init();
            for (const asset of imageAssets) {
                if (typeof asset.data === "string" && asset.data.startsWith("local:")) {
                    try {
                        const url = await assetStorage.getAssetUrl(
                            new URL(asset.data),
                            IfNotExistBehavior.RETURN_NULL
                        );
                        if (url && !revoked) {
                            assetPreviews.set(asset.id, url);
                            blobUrls.add(url);
                        }
                    } catch (e) {
                        Logger.error(
                            "Failed to load asset preview for avatar picker:",
                            asset.id,
                            e
                        );
                    }
                }
            }
        };

        void loadPreviews();

        return () => {
            revoked = true;
            for (const url of blobUrls) {
                if (typeof url === "string") URL.revokeObjectURL(url);
            }
        };
    });

    const avatarPreviewSrc = $derived.by(() => {
        if (!character.avatarUrl) return "";
        if (!character.avatarUrl.startsWith("local:")) return character.avatarUrl;

        const asset = character.assets.assets.find((a) => a.data === character.avatarUrl);
        return asset ? assetPreviews.get(asset.id) || "" : character.avatarUrl;
    });

    function updateField<const K extends keyof Character>(field: K, value: Character[K]) {
        onChange(merge({}, character, { [field]: value }));
    }
</script>

<div class="space-y-6">
    <h3 class="text-lg font-semibold">Basic Information</h3>

    <fieldset class="fieldset w-full">
        <label for="char-name" class="fieldset-legend">Name</label>
        <input
            type="text"
            id="char-name"
            class="input w-full"
            value={character.name}
            oninput={(e) => updateField("name", e.currentTarget.value)}
            placeholder="e.g. Arisu"
        />
        <div class="label">
            <span class="label-text-alt">Human-readable display name for the character.</span>
        </div>
    </fieldset>

    <fieldset class="fieldset w-full">
        <label for="char-desc" class="fieldset-legend">Description</label>
        <textarea
            id="char-desc"
            class="textarea h-24 w-full"
            value={character.description}
            oninput={(e) => updateField("description", e.currentTarget.value)}
            placeholder="A short description visible to users..."
        ></textarea>
        <div class="label">
            <span class="label-text-alt"
                >Short user-visible description. Not used in AI prompts.</span
            >
        </div>
    </fieldset>

    <fieldset class="fieldset w-full">
        <label for="char-avatar" class="fieldset-legend text-base font-medium">Avatar</label>

        <!-- Current Preview -->
        {#if character.avatarUrl}
            <div class="mb-4 flex justify-center">
                <div class="avatar">
                    <div
                        class="w-24 h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden shadow-lg"
                    >
                        <img
                            src={avatarPreviewSrc}
                            alt="Avatar preview"
                            class="object-cover"
                            onerror={(e) =>
                                ((e.currentTarget as HTMLImageElement).src =
                                    `https://api.dicebear.com/7.x/initials/svg?seed=${character?.name ?? "unknown"}`)}
                        />
                    </div>
                </div>
            </div>
        {/if}

        <!-- Asset Picker Grid -->
        {#if imageAssets.length > 0}
            <div class="mb-4">
                <p class="text-sm opacity-70 mb-2">Select from assets:</p>
                <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                    {#each imageAssets as asset (asset.id)}
                        {@const previewUrl = assetPreviews.get(asset.id)}
                        {@const isSelected = character.avatarUrl === asset.data}
                        <button
                            class="relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105 active:scale-95 group shadow-sm bg-base-200"
                            class:border-primary={isSelected}
                            class:border-transparent={!isSelected}
                            onclick={() => {
                                if (typeof asset.data === "string") {
                                    updateField("avatarUrl", asset.data);
                                } else {
                                    Logger.error(
                                        `Asset data is not a string. Perhaps it's still embedded file, not a pointer for AssetStorage?`,
                                        `${asset.name} as ${asset.mimeType}`
                                    );
                                }
                            }}
                            aria-label="Select {asset.name} as avatar"
                        >
                            {#if previewUrl}
                                <img
                                    src={previewUrl}
                                    alt={asset.name}
                                    class="w-full h-full object-cover"
                                />
                            {:else}
                                <div class="w-full h-full flex items-center justify-center">
                                    <span class="loading loading-spinner loading-xs"></span>
                                </div>
                            {/if}

                            {#if isSelected}
                                <div
                                    class="absolute inset-0 bg-primary/20 flex items-center justify-center"
                                >
                                    <div
                                        class="badge badge-primary badge-sm shadow-sm ring-1 ring-white/20"
                                    >
                                        Selected
                                    </div>
                                </div>
                            {/if}
                        </button>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- Manual URL Input (Hidden by default) -->
        <div class="collapse collapse-arrow bg-base-200/30 border border-base-300 rounded-lg">
            <input type="checkbox" bind:checked={showManualUrl} />
            <div class="collapse-title text-sm font-medium flex items-center gap-2">
                Manual URL Settings
            </div>
            <div class="collapse-content space-y-4">
                <div class="fieldset">
                    <label for="char-avatar-url" class="fieldset-legend"
                        >Avatar External URL / Storage Key</label
                    >
                    <input
                        type="text"
                        id="char-avatar-url"
                        class="input input-sm w-full bg-base-100"
                        value={character.avatarUrl || ""}
                        oninput={(e) =>
                            updateField("avatarUrl", e.currentTarget.value || undefined)}
                        placeholder="e.g. https://example.com/image.png or local:..."
                    />
                    <div class="label">
                        <span class="label-text-alt"
                            >Directly specify the avatar source. Useful for external links.</span
                        >
                    </div>
                </div>
            </div>
        </div>
    </fieldset>
</div>
