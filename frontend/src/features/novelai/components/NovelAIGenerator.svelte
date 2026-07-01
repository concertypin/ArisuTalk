<!--
@component NovelAIGenerator
Image generation panel with prompt input, NovelAI settings, preview, and save-to-sticker-pack.
-->
<script lang="ts">
    import ImageIcon from "phosphor-svelte/lib/ImageIcon";
    import SparkleIcon from "phosphor-svelte/lib/SparkleIcon";
    import PaletteIcon from "phosphor-svelte/lib/PaletteIcon";
    import DownloadSimpleIcon from "phosphor-svelte/lib/DownloadSimpleIcon";

    import { novelaiStore } from "../stores/novelaiStore.svelte";
    import type { NovelAIModel } from "@/lib/types/IDataModel";

    /** Available NovelAI diffusion models. */
    const models: { value: NovelAIModel; label: string }[] = [
        { value: "nai-diffusion-4", label: "NAI Diffusion v4" },
        { value: "nai-diffusion-3", label: "NAI Diffusion v3" },
        { value: "nai-diffusion-2", label: "NAI Diffusion v2" },
        { value: "nai-diffusion-1", label: "NAI Diffusion v1" },
        { value: "anime-full", label: "Anime Full" },
        { value: "anime-curated", label: "Anime Curated" },
        { value: "furry-v3", label: "Furry v3" },
        { value: "furry-v2", label: "Furry v2" },
        { value: "furry-v1", label: "Furry v1" },
    ];

    let prompt = $state("");
    let stickerName = $state("");
    let activeTab: "generate" | "settings" = $state("generate");
</script>

<div class="flex flex-col gap-4 p-4">
    <!-- Header -->
    <div class="flex items-center gap-2">
        <SparkleIcon size={22} class="text-primary" />
        <h2 class="text-lg font-bold">NovelAI Image Generator</h2>
    </div>

    <!-- Tabs: Generate / Settings -->
    <div class="tabs tabs-box">
        <button
            class="tab tab-sm {activeTab === 'generate' ? 'tab-active' : ''}"
            onclick={() => (activeTab = "generate")}
        >
            <ImageIcon size={16} />
            <span class="ml-1">Generate</span>
        </button>
        <button
            class="tab tab-sm {activeTab === 'settings' ? 'tab-active' : ''}"
            onclick={() => (activeTab = "settings")}
        >
            <PaletteIcon size={16} />
            <span class="ml-1">Settings</span>
        </button>
    </div>

    {#if activeTab === "settings"}
        <!-- Settings Panel -->
        <div class="card bg-base-200">
            <div class="card-body p-4 gap-3">
                <h3 class="card-title text-sm font-semibold">
                    <PaletteIcon size={18} />
                    Generation Settings
                </h3>

                <!-- API Key -->
                <label class="form-control w-full">
                    <span class="label-text text-xs">API Key</span>
                    <input
                        type="password"
                        class="input input-sm input-bordered w-full"
                        placeholder="Enter NovelAI API key"
                        bind:value={novelaiStore.config.apiKey}
                    />
                </label>

                <!-- Model Select -->
                <label class="form-control w-full">
                    <span class="label-text text-xs">Model</span>
                    <select
                        class="select select-sm select-bordered w-full"
                        bind:value={novelaiStore.config.model}
                    >
                        {#each models as m (m.value)}
                            <option value={m.value}>{m.label}</option>
                        {/each}
                    </select>
                </label>

                <!-- Width & Height -->
                <div class="grid grid-cols-2 gap-2">
                    <label class="form-control">
                        <span class="label-text text-xs">Width</span>
                        <input
                            type="number"
                            class="input input-sm input-bordered w-full"
                            min="64"
                            max="2048"
                            step="64"
                            bind:value={novelaiStore.config.width}
                        />
                    </label>
                    <label class="form-control">
                        <span class="label-text text-xs">Height</span>
                        <input
                            type="number"
                            class="input input-sm input-bordered w-full"
                            min="64"
                            max="2048"
                            step="64"
                            bind:value={novelaiStore.config.height}
                        />
                    </label>
                </div>

                <!-- Scale & Steps -->
                <div class="grid grid-cols-2 gap-2">
                    <label class="form-control">
                        <span class="label-text text-xs">Scale ({novelaiStore.config.scale})</span>
                        <input
                            type="range"
                            class="range range-sm"
                            min="1"
                            max="30"
                            step="0.5"
                            bind:value={novelaiStore.config.scale}
                        />
                    </label>
                    <label class="form-control">
                        <span class="label-text text-xs">Steps ({novelaiStore.config.steps})</span>
                        <input
                            type="range"
                            class="range range-sm"
                            min="1"
                            max="100"
                            step="1"
                            bind:value={novelaiStore.config.steps}
                        />
                    </label>
                </div>
            </div>
        </div>
    {/if}

    {#if activeTab === "generate"}
        <!-- Prompt Input -->
        <div class="flex flex-col gap-2">
            <textarea
                class="textarea textarea-bordered h-24 w-full resize-y"
                placeholder="Describe the image you want to generate..."
                bind:value={prompt}
            ></textarea>

            <!-- Error Display -->
            {#if novelaiStore.error}
                <div class="alert alert-error py-2 text-sm">
                    <span>{novelaiStore.error}</span>
                </div>
            {/if}

            <!-- Generate Button -->
            <button
                class="btn btn-primary"
                onclick={() => novelaiStore.generate(prompt)}
                disabled={novelaiStore.isGenerating || !prompt.trim()}
            >
                {#if novelaiStore.isGenerating}
                    <span class="loading loading-spinner loading-sm"></span>
                    Generating...
                {:else}
                    <SparkleIcon size={18} />
                    Generate
                {/if}
            </button>
        </div>

        <!-- Preview Area -->
        {#if novelaiStore.previewUrl}
            <div class="card bg-base-200 overflow-hidden">
                <figure class="flex justify-center p-2 bg-base-300">
                    <img
                        src={novelaiStore.previewUrl}
                        alt="Generated image preview"
                        class="max-w-full h-auto rounded-lg"
                    />
                </figure>
                <div class="card-body p-3 gap-2">
                    <div class="flex items-center justify-between">
                        <h3 class="card-title text-sm">Generated Image</h3>
                        <button
                            class="btn btn-ghost btn-xs"
                            onclick={() => novelaiStore.resetImage()}
                            title="Clear preview"
                        >
                            <span class="text-lg leading-none">&times;</span>
                        </button>
                    </div>

                    <!-- Save to Sticker Pack -->
                    <div class="flex flex-col gap-2">
                        <input
                            type="text"
                            class="input input-sm input-bordered w-full"
                            placeholder="Sticker name (required)"
                            bind:value={stickerName}
                        />
                        <button
                            class="btn btn-sm btn-outline btn-success"
                            onclick={async () => {
                                if (!stickerName.trim()) return;
                                try {
                                    await novelaiStore.saveToStickers(stickerName.trim());
                                    stickerName = "";
                                    novelaiStore.resetImage();
                                } catch {
                                    // Error is handled internally
                                }
                            }}
                            disabled={!stickerName.trim() || novelaiStore.isGenerating}
                        >
                            <DownloadSimpleIcon size={16} />
                            Save to Sticker Pack
                        </button>
                    </div>
                </div>
            </div>
        {/if}
    {/if}
</div>
