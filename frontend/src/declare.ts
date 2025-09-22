export {};

declare global {
  interface Window {
    __dev__?: {
      dumpLocalStorage: () => string;
      dumpIndexedDB: () => Promise<string | null>;
    };
  }
}
