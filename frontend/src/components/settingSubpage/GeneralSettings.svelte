<script lang="ts">
    import { settings } from "@/lib/stores/settings.svelte";
    import NoopIcon from "@/components/Snippets/NoopIcon.svelte";
    import PaletteIcon from "phosphor-svelte/lib/PaletteIcon";
    import { SUPPORTED_FONTS } from "@/lib/utils/fontUtils";
    import TextTIcon from "phosphor-svelte/lib/TextTIcon";
</script>

<div class="space-y-6">
    <h3 class="text-lg font-semibold">General Settings</h3>
    <fieldset class="fieldset w-full max-w-md bg-base-100 p-4 rounded-box border border-base-200">
        <legend class="fieldset-legend font-medium flex items-center gap-2 text-base-content/70">
            <PaletteIcon size={16} />
            Theme
        </legend>
        <div class="flex items-center justify-between">
            <select
                id="general-theme"
                class="select select-bordered w-full"
                bind:value={settings.value.theme}
            >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
            </select>
            <NoopIcon />
        </div>
    </fieldset>

    <h3 class="text-lg font-semibold pt-2">Typography</h3>
    <fieldset
        class="fieldset w-full max-w-md bg-base-100 p-4 rounded-box border border-base-200 space-y-4"
    >
        <legend class="fieldset-legend font-medium flex items-center gap-2 text-base-content/70">
            <TextTIcon size={16} />
            Font Settings
        </legend>

        <!-- Font Family -->
        <div class="form-control w-full">
            <div class="label pt-0">
                <label for="font-family" class="label-text">Font Family</label>
            </div>
            <select
                id="font-family"
                class="select select-bordered w-full font-sans"
                bind:value={settings.value.fontFamily}
            >
                {#each SUPPORTED_FONTS as font (font.value)}
                    <option value={font.value} style="font-family: {font.value}">
                        {font.name}
                    </option>
                {/each}
            </select>
        </div>

        <!-- Font Size -->
        <div class="form-control w-full">
            <div class="label pt-0">
                <label for="font-size" class="label-text"
                    >Font Size ({settings.value.fontSize}px)</label
                >
            </div>
            <input
                id="font-size"
                type="range"
                min="10"
                max="32"
                value={settings.value.fontSize}
                class="range range-primary range-sm"
                step="1"
                oninput={(e) => (settings.value.fontSize = Number(e.currentTarget.value))}
            />
            <div class="w-full flex justify-between text-xs px-2 mt-2 opacity-50">
                <span>Small</span>
                <span>Medium</span>
                <span>Large</span>
            </div>
        </div>
    </fieldset>
</div>
