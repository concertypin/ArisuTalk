<!--
  @component AuthGate
  Placeholder for authentication wrapper.
  Currently renders children directly (auth integration pending).
  Authentication is optional — core features work without signing in.
  @todo
-->
<script lang="ts">
    import type { Component } from "svelte";
    let props: { children: Component } = $props();
</script>

<props.children />
