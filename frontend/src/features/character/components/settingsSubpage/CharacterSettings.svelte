<script module>
    export type TContext = {
        getCharacter: () => Character;
        onCharacterChange: (updatedCharacter: Character | null) => void;
    };

    export type TProps<T> = {
        context: () => T;
    };
</script>

<script lang="ts">
    import type { Snippet } from "svelte";
    import type { Character } from "@arisutalk/character-spec/types/v0/index";

    let {
        subpageName,
        children,
    }: {
        subpageName: string;
        children: Snippet;
    } = $props();
</script>

<div class="space-y-6">
    <h3 class="text-lg font-semibold">{subpageName}</h3>
    {@render children()}
</div>
