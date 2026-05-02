<script lang="ts">
    import type { Character } from "@arisutalk/character-spec/v0/Character";
    import TrashIcon from "phosphor-svelte/lib/TrashIcon";
    import PencilSimpleIcon from "phosphor-svelte/lib/PencilSimpleIcon";
    import DownloadSimpleIcon from "phosphor-svelte/lib/DownloadSimpleIcon";
    import CaretLeftIcon from "phosphor-svelte/lib/CaretLeftIcon";
    import CaretRightIcon from "phosphor-svelte/lib/CaretRightIcon";
    import { opfsAdapter } from "../adapters/assetStorage/OpFSAssetStorageAdapter";
    import { IfNotExistBehavior } from "@/lib/interfaces";

    type Props = {
        character: Character;
        onEdit: () => void;
        onDelete: () => void;
        onExport: () => void;
        onMove?: (direction: -1 | 1) => void;
        isFirst?: boolean;
        isLast?: boolean;
    };
    const {
        character,
        onEdit,
        onDelete,
        onExport,
        onMove,
        isFirst = false,
        isLast = false,
    }: Props = $props();

    let resolvedAvatarUrl = $state("");

    $effect(() => {
        const url = character.avatarUrl;
        if (!url) {
            resolvedAvatarUrl = "";
            return;
        }

        let revoked = false;
        let blobUrl: string | null = null;

        if (url.startsWith("local:")) {
            void (async () => {
                try {
                    const res = await opfsAdapter.getAssetUrl(
                        new URL(url),
                        IfNotExistBehavior.RETURN_NULL
                    );
                    if (!revoked) {
                        blobUrl = res;
                        resolvedAvatarUrl = res || "";
                    } else if (res) {
                        URL.revokeObjectURL(res);
                    }
                } catch {
                    // Ignore errors (e.g. OpFS not supported or file not found)
                    if (!revoked) resolvedAvatarUrl = "";
                }
            })();
        } else {
            resolvedAvatarUrl = url;
        }

        return () => {
            revoked = true;
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    });
</script>

<div
    class="card bg-base-100 shadow-xl compact border border-base-content/10 group hover:border-primary transition-all duration-300 h-full"
>
    {#if resolvedAvatarUrl}
        <figure class="px-4 pt-4">
            <div class="avatar w-full h-48 rounded-xl overflow-hidden bg-base-200">
                <img
                    src={resolvedAvatarUrl}
                    alt={character.name}
                    class="w-full h-full object-cover"
                />
            </div>
        </figure>
    {:else}
        <figure class="px-4 pt-4">
            <div
                class="w-full h-48 rounded-xl bg-neutral text-neutral-content flex items-center justify-center text-4xl font-bold"
            >
                {character.name.substring(0, 2).toUpperCase()}
            </div>
        </figure>
    {/if}
    <div class="card-body">
        <h2 class="card-title text-primary">
            {character.name}
        </h2>
        <p class="line-clamp-3 text-sm opacity-70">
            {character.description || "No description provided."}
        </p>
        <div
            class="card-actions justify-between items-center mt-4 opacity-0 group-hover:opacity-100 transition-opacity"
        >
            <div class="flex gap-1">
                <button
                    class="btn btn-ghost btn-xs"
                    disabled={isFirst}
                    onclick={() => onMove?.(-1)}
                    aria-label="Move Backward"
                >
                    <CaretLeftIcon size={16} />
                </button>
                <button
                    class="btn btn-ghost btn-xs"
                    disabled={isLast}
                    onclick={() => onMove?.(1)}
                    aria-label="Move Forward"
                >
                    <CaretRightIcon size={16} />
                </button>
            </div>
            <div class="flex gap-1">
                <button class="btn btn-ghost btn-xs" onclick={onExport} aria-label="Export">
                    <DownloadSimpleIcon size={16} />
                </button>
                <button class="btn btn-ghost btn-xs" onclick={onEdit} aria-label="Edit">
                    <PencilSimpleIcon size={16} />
                </button>
                <button
                    class="btn btn-ghost btn-xs text-error"
                    onclick={onDelete}
                    aria-label="Delete"
                >
                    <TrashIcon size={16} />
                </button>
            </div>
        </div>
    </div>
</div>
