import { writable } from "svelte/store";
import {
  getAllPrompts as loadAll,
  saveAllPrompts as saveAll,
  resetAllPrompts as resetAll,
} from "../../prompts/promptManager";
import { showNotification, showConfirmation } from "../services/notificationService";
import { t } from "../../i18n";

function createPromptsStore() {
  const { subscribe, set, update } = writable({});

  async function load() {
    const prompts = await loadAll();
    set(prompts);
  }

  load();

  return {
    subscribe,
    set,
    update,
    save: async (prompts) => {
      await saveAll(prompts);
      set(prompts);
    },
    reset: async () => {
      await resetAll();
      await load();
    },
    backup: async () => {
      const prompts = await loadAll();
      const blob = new Blob([JSON.stringify(prompts, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "arisutalk-prompts-backup.json";
      a.click();
      URL.revokeObjectURL(url);
      showNotification(
        t("modal.promptBackupComplete.title"),
        t("modal.promptBackupComplete.message")
      );
    },
    restore: async () => {
      showConfirmation(
        t("modal.promptRestoreConfirm.title"),
        t("modal.promptRestoreConfirm.message"),
        () => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".json";
          input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = async (event) => {
                try {
                  const newPrompts = JSON.parse(event.target.result as string);
                  await saveAll(newPrompts);
                  set(newPrompts);
                  showNotification(
                    t("modal.promptRestoreComplete.title"),
                    t("modal.promptRestoreComplete.message")
                  );
                } catch (error) {
                  showNotification(
                    t("modal.promptRestoreFailed.title"),
                    t("modal.promptRestoreFailed.message")
                  );
                }
              };
              reader.readAsText(file);
            }
          };
          input.click();
        }
      );
    },
  };
}

export const prompts = createPromptsStore();
