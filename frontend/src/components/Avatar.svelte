<script lang="ts">
  import type { Character } from "../types/character";

  export let character: Character | null | undefined;
  export let size: "sm" | "md" | "lg" = "md";

  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-12 h-12 text-base",
    lg: "w-16 h-16 text-lg",
  }[size];

  $: initial = character?.name?.[0] || "";
</script>

{#if character?.avatar && character.avatar.startsWith("data:image")}
  <img
    src={character.avatar}
    alt={character.name}
    class="{sizeClasses} rounded-full object-cover"
  />
{:else}
  <div
    class="{sizeClasses} bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white font-medium"
  >
    {#if initial}
      {initial}
    {:else}
      <i data-lucide="bot" class="w-2/3 h-2/3"></i>
    {/if}
  </div>
{/if}
