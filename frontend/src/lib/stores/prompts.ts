import { writable } from "svelte/store";
import {
	getAllPrompts as loadAll,
	saveAllPrompts as saveAll,
	resetAllPrompts as resetAll,
} from "$root/prompts/promptManager";
import {
	showNotification,
	showConfirmation,
} from "$services/notificationService";
import { t } from "$root/i18n";
import type { PromptStorageType } from "$types/Prompt";

const { exportHooksConfig, importHooksConfig } = await import(
	"$lib/stores/replaceHooks"
);
function createPromptsStore() {
	const { subscribe, set, update } = writable<PromptStorageType>({
		mainChat: "",
		characterSheet: "",
		profileCreation: "",
		snsForce: "",
		naiSticker: "",
		groupChat: "",
		openChat: "",
	});

	async function load() {
		const prompts = await loadAll();
		set(prompts);
	}

	load();

	return {
		subscribe,
		set,
		update,
		save: async (prompts: PromptStorageType) => {
			await saveAll(prompts);
			set(prompts);
		},
		reset: async () => {
			await resetAll();
			await load();
		},
		backup: async () => {
			const prompts = await loadAll();
			const hook = exportHooksConfig();
			download({ prompts: prompts, hook: hook });
			showNotification(
				t("modal.promptBackupComplete.title"),
				t("modal.promptBackupComplete.message"),
			);
		},
		restore: async () => {
			showConfirmation(
				t("modal.promptRestoreConfirm.title"),
				t("modal.promptRestoreConfirm.message"),
				async () => {
					const uploadfile = await upload(".json");
					const fileContent = await readFileAsText(uploadfile);
					try {
						const data = JSON.parse(fileContent);
						const newPrompts = data["prompts"];
						await saveAll(newPrompts);
						set(newPrompts);
						// Optionally restore replace hooks if present
						if (data["hook"]) {
							importHooksConfig(data["hook"]);
						}

						showNotification(
							t("modal.promptRestoreComplete.title"),
							t("modal.promptRestoreComplete.message"),
						);
					} catch (error) {
						showNotification(
							t("modal.promptRestoreFailed.title"),
							t("modal.promptRestoreFailed.message"),
						);
					}
				},
			);
		},
	};
}

export const prompts = createPromptsStore();
/**
 * Triggers a download of the given payload as a file with the specified MIME type.
 * @param payload The data to be downloaded, must be serializable to JSON.
 * @param mimeType The MIME type of the file to be downloaded (default is "application/json").
 */
function download(payload: any, mimeType: string = "application/json") {
	const blob = new Blob([JSON.stringify(payload, null, 2)], {
		type: mimeType,
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = "arisutalk-prompts-backup.json";
	a.click();
	URL.revokeObjectURL(url);
}

/**
 * Opens a file picker dialog for the user to select a file with the specified accepted file types.
 * @param {string} accept - The accepted file types (default is ".json").
 * @returns {Promise<File>} A promise that resolves with the selected file.
 */
async function upload(accept: string = ".json"): Promise<File> {
	return new Promise((resolve, reject) => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = accept;
		input.onchange = (e) => {
			if (e.target === null) {
				reject(new Error("File input target is null"));
				return;
			}
			const file = input.files?.item(0);
			if (file) {
				resolve(file);
			}
		};
		input.click();
	});
}

/**
 * Reads the content of a File object as text.
 * @param {File} file - The file to read.
 * @returns {Promise<string>} A promise that resolves with the file content as text.
 */
async function readFileAsText(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			resolve(reader.result as string);
		};
		reader.onerror = () => {
			reject(reader.error);
		};
		reader.readAsText(file);
	});
}
