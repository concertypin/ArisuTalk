<!--
  @component AuthGate
  Placeholder for authentication wrapper.
  Currently renders children directly (auth integration pending).
  Authentication is optional — core features work without signing in.
-->
<script lang="ts">
    let { children }: { children: () => void } = $props();
</script>

{@render children()}
