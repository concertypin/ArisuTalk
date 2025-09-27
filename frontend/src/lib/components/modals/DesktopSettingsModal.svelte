<script>
  import { isDesktopSettingsModalVisible } from '../../stores/ui';
  import DesktopSettingsUI from './DesktopSettingsUI.svelte';
  import { fade } from 'svelte/transition';

</script>

{#if $isDesktopSettingsModalVisible}
  <div transition:fade={{ duration: 150 }}>
    <DesktopSettingsUI />
  </div>
{/if}
