import { DBEnv } from "@/adapters/client";
import { BaseBlobStorageClient } from "@/adapters/StorageClientBase";
import { AwsClient } from "aws4fetch";

export default class S3BlobStorageClient implements BaseBlobStorageClient {
    client: AwsClient;
    bucket: string;
    endpoint: string;

    constructor(env: DBEnv) {
        if (env.SECRET_S3_ACCESS_KEY === undefined)
            throw new Error("S3 environment variables are not properly set");
        this.bucket = env.SECRET_S3_BUCKET_NAME;
        const region = env.SECRET_S3_REGION;
        this.endpoint = env.SECRET_S3_ENDPOINT;
        const accessKeyId = env.SECRET_S3_ACCESS_KEY;
        const secretAccessKey = env.SECRET_S3_SECRET_KEY;

        this.client = new AwsClient({
            accessKeyId,
            secretAccessKey,
            region,
            service: "s3",
        });
    }
    async upload(
        buffer: ArrayBuffer | Uint8Array,
        contentType?: string,
    ): Promise<string> {
        const key = `${Date.now()}-${crypto.randomUUID()}`;
        const url = `https://${this.bucket}.${this.endpoint}/${key}`;

        // Normalize the body to a Blob so it's accepted as BodyInit in all environments/type definitions.
        // Create a copy-backed Uint8Array to ensure the underlying buffer is an ArrayBuffer (not SharedArrayBuffer).
        const u8 = new Uint8Array(buffer);
        const body = new Blob([u8]);

        const res = await this.client.fetch(url, {
            method: "PUT",
            body,
            headers: {
                "Content-Type": contentType || "application/octet-stream",
            },
        });
        if (!res.ok) {
            throw new Error(
                `Failed to upload to S3: ${res.status} ${res.statusText}`,
            );
        }
        return key; // Return only the key as the storage identifier
    }
    async get(url: string): Promise<string | null> {
        const objectUrl = `https://${this.bucket}.${this.endpoint}/${url}`;
        //Check for existence
        const res = await this.client.fetch(objectUrl, {
            method: "HEAD",
        });
        if (res.status === 404) {
            return null; // Not found
        }
        if (!res.ok) {
            throw new Error(
                `Failed to get from S3: ${res.status} ${res.statusText}`,
            );
        }
        // Return a presigned URL valid for 6 minutes
        return this.generatePresignedUrl(
            `${this.bucket}.${this.endpoint}/${url}`,
        );
    }
    async delete(url: string): Promise<void> {
        const objectUrl = `https://${this.bucket}.${this.endpoint}/${url}`;
        const res = await this.client.fetch(objectUrl, {
            method: "DELETE",
        });
        if (!res.ok) {
            throw new Error(
                `Failed to delete from S3: ${res.status} ${res.statusText}`,
            );
        }
    }

    /**
     * @param url - object URL in the bucket
     * @param ttl - time to live in seconds, default is 360 seconds (6 minutes)
     * @return presigned URL valid for `ttl` seconds. Fetch this URL to get the object.
     */
    private async generatePresignedUrl(url: string, ttl = 360) {
        const signed = await this.client.sign(
            new Request(`https://${url}?X-Amz-Expires=${ttl}`, {
                method: "GET",
            }),
            {
                aws: { signQuery: true },
                // Do not include conditional headers; they can cause presigned URLs
                // to fail with 412 Precondition Failed if object was modified.
                headers: {},
            },
        );
        return signed.url;
    }
}
