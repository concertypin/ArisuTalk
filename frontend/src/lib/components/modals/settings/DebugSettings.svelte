<script>
  import { t } from "../../../../i18n.js";
  import { createEventDispatcher } from "svelte";
  import { ArrowLeft, ShieldAlert, Database } from "lucide-svelte";
  import { chatRooms, groupChats, openChats } from "../../../stores/chat";
  import { characters } from "../../../stores/character";
  import { isDataBrowserModalVisible } from "../../../stores/ui";

  const dispatch = createEventDispatcher();

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

<div class="flex flex-col h-full">
  <header
    class="flex-shrink-0 px-4 py-4 bg-gray-900/80 flex items-center gap-2"
    style="backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);"
  >
    <button
      on:click={() => dispatch("back")}
      class="p-2 rounded-full hover:bg-gray-700"
    >
      <ArrowLeft class="h-6 w-6 text-gray-300" />
    </button>
    <div>
      <h2 class="font-semibold text-white text-xl">{t("settings.debug")}</h2>
      <p class="text-sm text-gray-400">{t("settings.debugSubtitle")}</p>
    </div>
  </header>

  <div class="flex-1 overflow-y-auto p-4">
    <div class="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
      <h4 class="text-md font-semibold text-red-400 mb-3 flex items-center">
        <ShieldAlert class="w-5 h-5 mr-3" />
        Debug Status
      </h4>
      <div class="space-y-3">
        <p class="text-xs text-gray-400">
          This section shows the current status of application data for
          debugging purposes.
        </p>
        <div class="p-3 bg-gray-800/50 rounded-lg">
          <pre class="text-xs text-gray-300 whitespace-pre-wrap"><code
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
</div>
