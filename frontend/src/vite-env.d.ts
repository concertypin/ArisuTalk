/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  // more env variables...
  readonly DEV: boolean; // Explicitly define DEV

  readonly VITE_VERSION_CHANNEL: string;
  readonly VITE_VERSION_NAME: string;
  readonly VITE_VERSION_URL: string;
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
