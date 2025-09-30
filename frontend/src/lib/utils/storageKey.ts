/**
 * Generates a storage key, prefixing it for debug mode if in a development environment.
 * @param {string} key The base key.
 * @returns {string} The final storage key.
 */
export function getStorageKey(key: string): string {
  if (import.meta.env.DEV) {
    return "debug_" + key;
  }
  return key;
}
