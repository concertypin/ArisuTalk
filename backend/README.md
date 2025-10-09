# ArisuTalk Backend — Phonebook API

Phonebook(전화번호부) is ArisuTalk bot sharing platform.
Key features:

- User authentication
- Data & Blob support
- Not-so-vendor-specific implementation
    - Azure Cosmos DB for database
    - S3-compatible storage for blobs
    - In-memory fallback for local development
- OpenAPI spec & Swagger UI
- ~~...and this is all always-free tier driven!~~

For the API spec, see [here](https://back.spark.arisutalk.moe).

# Note for devs

This project uses [Clerk](https://clerk.com/) for user authentication. You need to set up a Clerk project and obtain the API keys to run this project locally or deploy it.

## Getting Started

1. Clone the root repository.
2. run `pnpm install`.
3. Create a `.env.local` file in the `backend` directory and add the required [environment variables (see below)](#environment-variables).
4. Run `pnpm run dev:be` to start the development server.

You can access the tokens with `pnpm run auth`.

## Environment Variables

Create a `.env.local` file in the root directory and add the following environment variables.
On hosting platforms like Cloudflare Workers, set these variables as environment variables in your deployment settings.

```sh
# Clerk settings(required)
SECRET_CLERK_SECRET_KEY=your_clerk_secret_key
ENV_CLERK_PUBLIC_KEY=your_clerk_public_key
# ----------------------------------------------------------------
# Vendor-specific settings
# All categories are all-or-nothing, meaning you need to provide all variables in a category or none at all.
# If not provided, backend will automatically use fallback implementations.
# ----------------------------------------------------------------
## Azure Cosmos DB settings
SECRET_AZURE_COSMOSDB_CONNECTION_STRING="your_cosmosdb_connection_string"
SECRET_AZURE_COSMOSDB_DATABASE_NAME=your_database_name
SECRET_AZURE_COSMOSDB_CONTAINER_NAME=your_container_name
## S3-compatible storage settings
SECRET_S3_ACCESS_KEY=your_s3_access_key
SECRET_S3_SECRET_KEY=your_s3_secret_key
SECRET_S3_BUCKET_NAME=your_s3_bucket_name
SECRET_S3_REGION=your_s3_region
SECRET_S3_ENDPOINT=your_s3_endpoint
```
