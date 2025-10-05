interface CloudflareBindings {
    readonly S3_ENDPOINT: string;
    readonly S3_PORT: number;
    readonly S3_ACCESS_KEY: string;
    readonly S3_SECRET_KEY: string;
    readonly S3_BUCKET: string;
    readonly S3_PUBLIC_URL: string;
    readonly S3_USE_SSL: boolean;
}

interface ImportMetaEnv extends CloudflareBindings {}

interface ViteTypeOptions {
    strictImportEnv: unknown;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
