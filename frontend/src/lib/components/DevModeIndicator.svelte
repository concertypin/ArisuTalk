<script>
  import { isDevModeActive } from '../stores/ui';
  import { get } from 'svelte/store';
</script>

{#if import.meta.env.DEV || get(isDevModeActive)}
<div
  class="fixed top-8 left-1/2 -translate-x-1/2 text-white text-base font-bold px-3 py-1 rounded-full z-[1000] pointer-events-none shadow-lg"
  style="background: linear-gradient(45deg, oklch(70% 0.2 30), oklch(70% 0.2 330));"
>
  Developer Mode
</div>
{/if}
