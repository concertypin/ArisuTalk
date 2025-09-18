/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  // more env variables...
  readonly DEV: boolean; // Explicitly define DEV
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  __dev__?: {
    dumpLocalStorage: () => string;
    dumpIndexedDB: () => Promise<string | null>;
  };
}
