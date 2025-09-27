<script>
  import { ShieldAlert } from 'lucide-svelte';
  import { chatRooms, groupChats, openChats } from '../../../../stores/chat';
  import { characters } from '../../../../stores/character';

  let localStorageStatus = 'Checking...';
  let indexedDBStatus = 'Checking...';

  if (typeof window !== 'undefined') {
    localStorageStatus = window.localStorage ? 'OK' : 'Unavailable';
    indexedDBStatus = window.indexedDB ? 'OK' : 'Unavailable';
  }

  $: status = {
    localStorage: localStorageStatus,
    indexedDB: indexedDBStatus,
    characterCount: $characters.length,
    chatCount: Object.values($chatRooms).flat().length + Object.keys($groupChats).length + Object.keys($openChats).length
  };

</script>

<div class="space-y-6">
  <div class="bg-red-900/20 border-2 border-red-500/30 rounded-xl p-6">
    <h4 class="text-lg font-semibold text-red-400 mb-4 flex items-center">
      <ShieldAlert class="w-5 h-5 mr-3" />
      Debug Status
    </h4>
    <div class="space-y-4">
      <p class="text-sm text-gray-400">This section shows the current status of application data for debugging purposes.</p>
      <div class="p-4 bg-gray-800/50 rounded-lg">
        <pre class="text-xs text-gray-300"><code>{JSON.stringify(status, null, 2)}</code></pre>
      </div>
    </div>
  </div>
</div>
