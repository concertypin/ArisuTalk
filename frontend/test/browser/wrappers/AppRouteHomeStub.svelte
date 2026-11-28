<!--
  @component AppRouteHomeStub
  Stand-in for the "/" route when testing `App.svelte`. It can open the app settings modal
  through the app context, the way real pages do.
-->
<script lang="ts">
    import { getAppContext } from "@/context";

    const appContext = getAppContext();
</script>

<p>Home route</p>
<button type="button" onclick={() => (appContext.appSettingsOpen = true)}>
    Open app settings
</button>
