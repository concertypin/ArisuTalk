<script>
  import { t } from '../../../i18n.js';
  export let log;

  const levelColor = {
    error: "text-red-400",
    warn: "text-yellow-400",
    info: "text-blue-400",
    debug: "text-gray-400",
  }[log.level] || "text-gray-400";

  function formatTimestamp(timestamp) {
    const date = typeof timestamp === "number" ? new Date(timestamp) : new Date(timestamp);
    if (isNaN(date.getTime())) {
      return t("debugLogs.invalidDate");
    }
    return date.toLocaleString();
  }
</script>

<div class="p-3 border border-gray-600 rounded-lg bg-gray-750">
    <div class="flex justify-between items-center text-xs text-gray-400 mb-2">
        <span class="{levelColor} font-bold">[{log.level.toUpperCase()}]</span>
        <span>{formatTimestamp(log.timestamp)}</span>
    </div>
    <div class="text-sm text-white whitespace-pre-wrap">{log.message}</div>
</div>
