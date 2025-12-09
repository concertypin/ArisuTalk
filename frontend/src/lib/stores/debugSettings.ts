import { writable } from "svelte/store";

const RESET_ON_REFRESH_KEY = "debug-reset-on-refresh";

export const isResetOnRefreshEnabled = writable(
	localStorage.getItem(RESET_ON_REFRESH_KEY) === "true",
);

export function toggleResetOnRefresh() {
	const currentValue = localStorage.getItem(RESET_ON_REFRESH_KEY) === "true";
	const newValue = !currentValue;
	localStorage.setItem(RESET_ON_REFRESH_KEY, String(newValue));
	isResetOnRefreshEnabled.set(newValue);
}
