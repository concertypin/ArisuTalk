<script lang="ts">
    /**
     * @component CharacterMetadataSettings
     * Metadata fields: author, license (with autocomplete), version, distribution URL.
     */
    import type { Character } from "@arisutalk/character-spec/v0/Character";
    import { withCharacter } from "@/lib/utils/characterState";

    type Props = {
        character: Character;
        onChange: (character: Character) => void;
    };

    let { character, onChange }: Props = $props();

    /** Common license options for autocomplete */
    const licenseOptions = [
        { value: "ARR", label: "ARR (All Rights Reserved)" },
        { value: "CC0", label: "CC0 (Public Domain)" },
        { value: "CC-BY", label: "CC-BY (Attribution)" },
        { value: "CC-BY-SA", label: "CC-BY-SA (Attribution-ShareAlike)" },
        { value: "CC-BY-NC", label: "CC-BY-NC (Attribution-NonCommercial)" },
        { value: "CC-BY-NC-SA", label: "CC-BY-NC-SA (Attribution-NonCommercial-ShareAlike)" },
        { value: "MIT", label: "MIT License" },
    ];

    function updateMetadata<K extends keyof NonNullable<Character["metadata"]>>(
        field: K,
        value: NonNullable<Character["metadata"]>[K]
    ) {
        onChange(
            withCharacter(character, (draft) => {
                draft.metadata[field] = value;
            })
        );
    }
</script>

<div class="space-y-6">
    <h3 class="text-lg font-semibold">Metadata</h3>

    <fieldset class="fieldset w-full">
        <label for="meta-author" class="fieldset-legend">Author</label>
        <input
            type="text"
            id="meta-author"
            class="input w-full"
            value={character.metadata?.author || ""}
            oninput={(e) => updateMetadata("author", e.currentTarget.value || undefined)}
            placeholder="Your name or handle"
        />
        <div class="label">
            <span class="label-text-alt">Creator of this character.</span>
        </div>
    </fieldset>

    <fieldset class="fieldset w-full">
        <label for="meta-license" class="fieldset-legend">License</label>
        <input
            type="text"
            id="meta-license"
            class="input w-full"
            list="license-options"
            value={character.metadata?.license || ""}
            oninput={(e) => updateMetadata("license", e.currentTarget.value)}
            placeholder="Select or type a license"
        />
        <datalist id="license-options">
            {#each licenseOptions as opt (opt.value)}
                <option value={opt.value}>{opt.label}</option>
            {/each}
        </datalist>
        <div class="label">
            <span class="label-text-alt"
                >Type to see suggestions (ARR, CC-BY, etc.) or enter a custom license.</span
            >
        </div>
    </fieldset>

    <fieldset class="fieldset w-full">
        <label for="meta-version" class="fieldset-legend">Version</label>
        <input
            type="text"
            id="meta-version"
            class="input w-full"
            value={character.metadata?.version || ""}
            oninput={(e) => updateMetadata("version", e.currentTarget.value || undefined)}
            placeholder="e.g. 1.0.0"
        />
        <div class="label">
            <span class="label-text-alt">Version number for this character.</span>
        </div>
    </fieldset>

    <fieldset class="fieldset w-full">
        <label for="meta-distributed" class="fieldset-legend">Distribution URL</label>
        <input
            type="url"
            id="meta-distributed"
            class="input w-full"
            value={character.metadata?.distributedOn || ""}
            oninput={(e) => updateMetadata("distributedOn", e.currentTarget.value || undefined)}
            placeholder="https://example.com/my-character"
        />
        <div class="label">
            <span class="label-text-alt">URL where users can find this character.</span>
        </div>
    </fieldset>

    <fieldset class="fieldset w-full">
        <label for="meta-additional" class="fieldset-legend">Additional Info</label>
        <textarea
            id="meta-additional"
            class="textarea h-24 w-full"
            value={character.metadata?.additionalInfo || ""}
            oninput={(e) => updateMetadata("additionalInfo", e.currentTarget.value || undefined)}
            placeholder="Any other notes or credits..."
        ></textarea>
        <div class="label">
            <span class="label-text-alt">Extra information, credits, or notes.</span>
        </div>
    </fieldset>
</div>
