<script>
  import { ShieldAlert, Database } from "lucide-svelte";
  import { chatRooms, groupChats, openChats } from "../../../../stores/chat";
  import { characters } from "../../../../stores/character";
  import { isDataBrowserModalVisible } from "../../../../stores/ui";

  let localStorageStatus = "Checking...";
  let indexedDBStatus = "Checking...";

  if (typeof window !== "undefined") {
    localStorageStatus = window.localStorage ? "OK" : "Unavailable";
    indexedDBStatus = window.indexedDB ? "OK" : "Unavailable";
  }

  $: status = {
    localStorage: localStorageStatus,
    indexedDB: indexedDBStatus,
    characterCount: $characters.length,
    chatCount:
      Object.values($chatRooms).flat().length +
      Object.keys($groupChats).length +
      Object.keys($openChats).length,
  };

  function openDataBrowser() {
    isDataBrowserModalVisible.set(true);
  }
</script>

<div class="space-y-6">
  <div class="bg-red-900/20 border-2 border-red-500/30 rounded-xl p-6">
    <h4 class="text-lg font-semibold text-red-400 mb-4 flex items-center">
      <ShieldAlert class="w-5 h-5 mr-3" />
      Debug Status
    </h4>
    <div class="space-y-4">
      <p class="text-sm text-gray-400">
        This section shows the current status of application data for debugging
        purposes.
      </p>
      <div class="p-4 bg-gray-800/50 rounded-lg">
        <pre class="text-xs text-gray-300"><code
            >{JSON.stringify(status, null, 2)}</code
          ></pre>
      </div>

      <!-- Data Browser Button -->
      <div class="pt-4 border-t border-gray-600">
        <button
          on:click={openDataBrowser}
          class="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors"
        >
          <Database class="w-4 h-4" />
          Open Data Browser
        </button>
        <p class="text-xs text-gray-400 mt-2 text-center">
          Browse and inspect all application data stores
        </p>
      </div>
    </div>
  </div>
</div>
