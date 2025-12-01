<script>
import { Bot } from "lucide-svelte";

/**
 * @type {object} character - The character object.
 */
export let character;

/**
 * @type {"sm" | "md" | "lg"} size - The size of the avatar.
 */
export let size = "md";

const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-12 h-12 text-base",
    lg: "w-16 h-16 text-lg",
};

$: hasImage = character?.avatar && character.avatar.startsWith("data:image");
$: initial = character?.name?.[0];
</script>

{#if hasImage}
    <img
        src={character.avatar}
        alt={character.name}
        class="{sizeClasses[size]} rounded-full object-cover"
    />
{:else}
    <div
        class="{sizeClasses[
            size
        ]} bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white font-medium"
    >
        {#if initial}
            {initial}
        {:else}
            <Bot />
        {/if}
    </div>
{/if}
