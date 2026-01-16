<script lang="ts">
    /**
     * @component CharacterBasicSettings
     * Basic character info: name, description, avatar.
     * Fields include helper text based on character-spec JSDoc.
     */
    import type { Character } from "@arisutalk/character-spec/v0/Character";

    type Props = {
        character: Character;
        onChange: (character: Character) => void;
    };

    let { character, onChange }: Props = $props();

    function updateField<K extends keyof Character>(field: K, value: Character[K]) {
        onChange({ ...character, [field]: value });
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
        <label for="char-avatar" class="fieldset-legend">Avatar URL</label>
        <input
            type="text"
            id="char-avatar"
            class="input w-full"
            value={character.avatarUrl || ""}
            oninput={(e) => updateField("avatarUrl", e.currentTarget.value || undefined)}
            placeholder="Asset name or URL for avatar image"
        />
        <div class="label">
            <span class="label-text-alt"
                >Reference to an asset name or external URL for the character's avatar.</span
            >
        </div>
        {#if character.avatarUrl}
            <div class="mt-2">
                <img
                    src={character.avatarUrl}
                    alt="Avatar preview"
                    class="w-24 h-24 rounded-full object-cover border border-base-300"
                    onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                />
            </div>
        {/if}
    </fieldset>
</div>
