// frontend/src/dev-init.ts

import { initializeDebugUtility } from "./utils/debug-utils.ts";
import {
  dumpLocalStorageToJson,
  dumpIndexedDBToJson,
} from "./utils/dev-tools.ts";

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
