# Be careful!

> [!NOTE]
> _Do not import_ any files from this directory directly in the main application code! Instead, use `DataDBClient` and `BlobStorageClient` on `../client.ts`.

This directory contains adapter implementations for various third-party services.

# Naming & Structure Conventions

- All files should be named in the format of `<vendor><type>.ts` with PascalCase.
    - `<vendor>`: The name of the third-party service (e.g., `AzureCosmos`, `S3Compatible`, `InMemory`).
    - `<type>`: The type of adapter (e.g., `DB`, `Blob`).

- Each adapter file should have `export default class`, implementing the required interface on `../StorageClientBase.ts`.
    - Constructor should accept a single argument: `env: DBEnv` object. This object contains all necessary environment variables for the adapter.
