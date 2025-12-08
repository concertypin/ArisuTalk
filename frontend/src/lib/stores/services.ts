import { writable } from "svelte/store";

import { StickerManager } from "../services/stickerManager";

export const stickerManager = writable<StickerManager | null>(null);
