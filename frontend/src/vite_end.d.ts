
// Type augmentation for ImportMeta to include 'env'
interface ImportMetaEnv {
    VITE_STORAGE?: string;
}

interface ImportMeta {
    env: ImportMetaEnv;
}