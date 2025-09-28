// frontend/src/dev-init.ts

import {
  initializeDebugUtility,
  clearAllBrowserData,
} from "./lib/utils/debug-utils.ts";
import {
  dumpLocalStorageToJson,
  dumpIndexedDBToJson,
} from "./lib/utils/dev-tools.ts";
import { isResetOnRefreshEnabled } from "./lib/stores/debugSettings.ts";
import { get } from "svelte/store";

if (import.meta.env.DEV && get(isResetOnRefreshEnabled)) {
  await clearAllBrowserData();
}

initializeDebugUtility();

// Expose dev tools globally for easy access in console
if (import.meta.env.DEV) {
  window.__dev__ = {
    dumpLocalStorage: dumpLocalStorageToJson,
    dumpIndexedDB: dumpIndexedDBToJson,
  };
  console.log(
    "Dev tools (__dev__.dumpLocalStorage(), __dev__.dumpIndexedDB()) are available in the console.",
  );
}
