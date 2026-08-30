<script lang="ts">
    /**
     * @component CharacterBasicSettings
     * Basic character info: name, description, avatar.
     * Fields include helper text based on character-spec JSDoc.
     */
    import { SvelteMap, SvelteSet } from "svelte/reactivity";
    import { getAssetStorage } from "@/features/character/adapters/assetStorage/assetStorageResolver";
    import { Logger } from "@common/logger/Logger";
    import { IfNotExistBehavior, type IAssetStorageAdapter } from "@/lib/interfaces";
    import type { Character } from "@arisutalk/character-spec/v0/Character";
    import { merge } from "lodash-es";
    import WarningIcon from "phosphor-svelte/lib/WarningIcon";
    import { characterStore } from "@/features/character/stores/characterStore.svelte";
    import type { AssetEntity } from "@arisutalk/character-spec/v0/Character";

    type Props = {
        character: Character;
        onChange: (character: Character | null) => void;
    };

    let { character, onChange }: Props = $props();

    const assetStorage = getAssetStorage();
    let assetPreviews = new SvelteMap<string, string>();
    let showManualUrl = $state(false);

    const imageAssets = $derived(
        character.assets.assets.filter((a) => a.mimeType.startsWith("image/"))
    );

    async function getImage(
        asset: AssetEntity,
        assetStorage: IAssetStorageAdapter,
        blobUrls: SvelteSet<string>
    ) {
        if (!(typeof asset.data === "string" && asset.data.startsWith("local:"))) return;

        try {
            const url = await assetStorage.getAssetUrl(
                new URL(asset.data),
                IfNotExistBehavior.RETURN_NULL
            );
            if (url) {
                assetPreviews.set(asset.id, url);
                blobUrls.add(url);
            }
        } catch (e) {
            Logger.error("Failed to load asset preview for avatar picker:", asset.id, e);
        }
    }

    // Load image previews
    $effect(() => {
        const blobUrls = new SvelteSet<string>();

        const loadPreviews = async () => {
            await assetStorage.init();
            for (const asset of imageAssets) {
                await getImage(asset, assetStorage, blobUrls);
            }
        };

        void loadPreviews();

        return () => {
            for (const url of blobUrls) URL.revokeObjectURL(url);
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

    const findCharacter = (c: Character) => c.id === character.id;

    function onCharacterRemove() {
        const index = characterStore.characters.findIndex(findCharacter);

        if (index < 0) return;

        characterStore.remove(index);

        onChange(null);
    }

    let inputCharName = $state("");
    let isValidCharName = $derived(inputCharName.trim() ? character.name === inputCharName : true);
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

    <fieldset class="fieldset w-full">
        <h4 class="inline-flex items-center gap-2 m-0 text-lg font-semibold">
            <span class="text-warning"><WarningIcon /></span>
            <span>Remove Character</span>
        </h4>
        <label for="remove-character" class="fieldset-legend">
            Enter the character's name exactly
        </label>
        <input
            type="text"
            id="remove-character"
            bind:value={inputCharName}
            class="input input-sm w-full bg-base-100 {isValidCharName ? '' : 'input-error'}"
            placeholder={character.name}
            onkeydown={(e) => {
                if (e.key !== "Enter") return;

                if (e.currentTarget?.value === character.name) {
                    onCharacterRemove();
                }
            }}
        />
        {#if !isValidCharName}
            <div class="label">
                <span class="label-text-alt text-error">Incorrect character name</span>
            </div>
        {/if}
        <div class="label">
            <span class="label-text-alt">All data will be removed. It cannot be recovered!</span>
        </div>
    </fieldset>
</div>
