import { get } from "svelte/store";
import { settings } from "../stores/settings";
import { debugLogs } from "../stores/logs";

const MAX_LOGS = 1000;

export function addLog(logData) {
    const currentSettings = get(settings);
    if (!currentSettings.enableDebugLogs) {
        return;
    }

    const newLog = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        ...logData,
    };

    debugLogs.update((logs) => {
        const newLogs = [newLog, ...logs];
        if (newLogs.length > MAX_LOGS) {
            return newLogs.slice(0, MAX_LOGS);
        }
        return newLogs;
    });
}

export function clearDebugLogs() {
    debugLogs.set([]);
}

export function exportDebugLogs() {
    const logs = get(debugLogs);
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `arisutalk_debug_logs_${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
}
