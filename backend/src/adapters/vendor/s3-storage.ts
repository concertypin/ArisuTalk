import { BaseBlobStorageClient } from "../StorageClientBase";
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";

export default class S3BlobStorageClient implements BaseBlobStorageClient {
    private s3: S3Client;
    private bucket: string;

    constructor() {
        this.bucket = import.meta.env.S3_BUCKET;
        const endpoint = import.meta.env.S3_ENDPOINT;
        this.s3 = new S3Client({
            ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
            region: import.meta.env.S3_REGION,
            credentials: {
                accessKeyId: import.meta.env.S3_ACCESS_KEY_ID,
                secretAccessKey: import.meta.env.S3_SECRET_ACCESS_KEY,
            },
        });
    }

    async upload(
        buffer: ArrayBuffer | Uint8Array,
        contentType?: string
    ): Promise<string> {
        const key = crypto.randomUUID();
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        });

        await this.s3.send(command);

        return `s3://${this.bucket}/${key}`;
    }

    async get(url: string): Promise<ArrayBuffer | null> {
        const { bucket, key } = this.parseS3Url(url);
        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key,
        });

        try {
            const response = await this.s3.send(command);
            const stream = response.Body;
            if (!stream) return null;
            const chunks: Uint8Array[] = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
            const merged = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of chunks) {
                merged.set(chunk, offset);
                offset += chunk.length;
            }
            return merged.buffer;
        } catch (error) {
            if (
                typeof error === "object" &&
                error !== null && // This godforsaken language says null is an object
                "name" in error &&
                error.name === "NoSuchKey"
            ) {
                return null;
            }
            throw error;
        }
    }

    async delete(url: string): Promise<void> {
        const { bucket, key } = this.parseS3Url(url);
        const command = new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
        });

        await this.s3.send(command);
    }

    private parseS3Url(url: string): { bucket: string; key: string } {
        const urlObject = new URL(url);
        if (urlObject.protocol !== "s3:") {
            throw new Error("Invalid S3 URL");
        }
        const bucket = urlObject.hostname;
        const key = urlObject.pathname.substring(1);
        return { bucket, key };
    }
}
