import { get } from "svelte/store";
import { settings, settingsSnapshots, type SettingsSnapshot } from "../stores/settings";
import {
  characters,
  characterStateStore,
  userStickers,
} from "../stores/character";
import {
  chatRooms,
  groupChats,
  openChats,
  messages,
  unreadCounts,
} from "../stores/chat";
import { t } from "../../i18n";
import { saveToBrowserStorage } from "../../storage";
import { secureStorage } from "../utils/secureStorage";
import { getStorageKey } from "../utils/storageKey";
import { showNotification, showConfirmation } from "./notificationService";

// Debounce utility function
function debounce(func: Function, wait: number) {
  let timeout: number | null = null;
  return function executedFunction(...args: any[]) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// TODO: Need a store for confirmation modals
// import { showConfirmation } from './ui';

export async function backupData() {
  try {
    const backupObject = {
      version: "v17-svelte",
      timestamp: new Date().toISOString(),
      settings: get(settings),
      characters: get(characters),
      characterStates: get(characterStateStore),
      chatRooms: get(chatRooms),
      groupChats: get(groupChats),
      openChats: get(openChats),
      messages: get(messages),
      unreadCounts: get(unreadCounts),
      userStickers: get(userStickers),
      settingsSnapshots: get(settingsSnapshots),
    };

    const jsonString = JSON.stringify(backupObject, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `arisutalk_backup_${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification(
      t("modal.backupComplete.title"),
      t("modal.backupComplete.message")
    );
  } catch (error) {
    console.error("Backup failed:", error);
    showNotification(
      t("modal.backupFailed.title"),
      t("modal.backupFailed.message")
    );
  }
}

export function restoreData(fileContent: string) {
  try {
    const backupData = JSON.parse(fileContent);
    if (
      !backupData.settings ||
      !backupData.characters ||
      !backupData.messages ||
      !backupData.unreadCounts
    ) {
      throw new Error("Invalid backup file format.");
    }

    showConfirmation(
      t("modal.restoreConfirm.title"),
      t("modal.restoreConfirm.message"),
      () => {
        settings.set(backupData.settings);
        characters.set(backupData.characters);
        messages.set(backupData.messages);
        unreadCounts.set(backupData.unreadCounts);
        chatRooms.set(backupData.chatRooms || {});
        userStickers.set(backupData.userStickers || []);
        groupChats.set(backupData.groupChats || {});
        openChats.set(backupData.openChats || {});
        characterStateStore.set(backupData.characterStates || {});
        settingsSnapshots.set(backupData.settingsSnapshots || []);

        showNotification(
          t("modal.restoreComplete.title"),
          t("modal.restoreComplete.message")
        );
        setTimeout(() => window.location.reload(), 1000);
      }
    );
  } catch (error) {
    console.error("Restore failed:", error);
    showNotification(
      t("modal.restoreFailed.title"),
      t("modal.restoreFailed.message")
    );
  }
}

export async function resetAllData() {
  // TODO: Use a Svelte-based confirmation modal
  const confirmed = confirm(t("confirm.resetDataConfirm"));
  if (!confirmed) return;

  const doubleConfirmed = confirm(t("confirm.resetDataDoubleConfirm"));
  if (!doubleConfirmed) return;

  try {
    const storageKeys = [
      "personaChat_settings_v16",
      "personaChat_characters_v16",
      "personaChat_messages_v16",
      "personaChat_unreadCounts_v16",
      "personaChat_chatRooms_v16",
      "personaChat_groupChats_v16",
      "personaChat_openChats_v16",
      "personaChat_characterStates_v16",
      "personaChat_userStickers_v16",
      "personaChat_settingsSnapshots_v16",
      "personaChat_debugLogs_v16",
      "personaChat_migration_v16",
      "personaChat_migration_v17",
      // Secure storage keys
      "personaChat_encryptedApiConfigs_v1",
      "personaChat_masterPasswordHint_v1",
      "personaChat_encryptionEnabled_v1",
    ].map(getStorageKey);

    for (const key of storageKeys) {
      saveToBrowserStorage(key, null);
    }

    secureStorage.encryptionEnabled = false;
    secureStorage.masterPassword = null;

    sessionStorage.clear();

    alert(t("confirm.resetDataComplete"));
    window.location.reload();
  } catch (error) {
    console.error("Failed to reset all data:", error);
    alert(t("confirm.resetDataFailed") + (error as Error).message);
  }
}

export function restoreSnapshot(timestamp: number) {
  const snapshot = get(settingsSnapshots).find(
    (s: SettingsSnapshot) => s.timestamp === timestamp
  );
  if (snapshot) {
    settings.set(snapshot.settings);
    showNotification(
      t("settings.snapshotRestored.title"),
      t("modal.snapshotRestored.message")
    );
  }
}

export function createSettingsSnapshot() {
  const currentSettings = get(settings);
  const timestamp = Date.now();

  const snapshot = {
    timestamp,
    settings: { ...currentSettings },
    metadata: {
      createdAt: new Date().toISOString(),
      version: "v17-svelte",
    },
  };

  settingsSnapshots.update((snapshots: SettingsSnapshot[]) => {
    // 최대 10개의 스냅샷만 유지
    const updatedSnapshots = [snapshot, ...snapshots].slice(0, 10);
    return updatedSnapshots;
  });

  return snapshot;
}

export function deleteSnapshot(timestamp: number) {
  settingsSnapshots.update((snapshots: SettingsSnapshot[]) =>
    snapshots.filter((s) => s.timestamp !== timestamp)
  );
}

// Debounced version of createSettingsSnapshot for automatic saving
export const debouncedCreateSettingsSnapshot = debounce(
  createSettingsSnapshot,
  1000
);

// Subscribe to settings changes for automatic snapshots
let isAutoSnapshotEnabled = false;
let unsubscribeSettings: (() => void) | null = null;

export function enableAutoSnapshots() {
  if (unsubscribeSettings) {
    unsubscribeSettings();
  }

  unsubscribeSettings = settings.subscribe((currentSettings) => {
    if (isAutoSnapshotEnabled && currentSettings.snapshotsEnabled) {
      debouncedCreateSettingsSnapshot();
    }
  });

  isAutoSnapshotEnabled = true;
}

export function disableAutoSnapshots() {
  if (unsubscribeSettings) {
    unsubscribeSettings();
    unsubscribeSettings = null;
  }
  isAutoSnapshotEnabled = false;
}
