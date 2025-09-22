/// <reference types="vite/client" />

interface ViteTypeOptions {
  strictImportEnv: unknown;
}

interface ImportMetaEnv {
  readonly VITE_CORS_PROXY?: string;
  readonly VITE_HOST_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
