interface ImportMetaEnv extends CloudflareBindings {}

interface ViteTypeOptions {
	strictImportEnv: unknown;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
