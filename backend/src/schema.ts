/**
 * @fileoverview Schema definitions for database entities using Zod.
 * It defines DataType and UserType used throughout the application.
 * Other types like PartialData and PartialUser are also defined here.
 */

import z from "zod";

export type DataType = z.infer<typeof DataSchema>;

export const Queryable = z.object({
    /**
     * @property Unique identifier for the data entry.
     */
    id: z
        .string()
        .describe(
            "Unique identifier for the data entry. It is used as internal reference."
        ),
});
/**
 * Data schema definition
 * It will be saved in the database
 */
export const PartialDataSchema = z.object({
    /**
     * @property
     * Human-readable name of the uploaded content.
     * It may not match the additionalData's name.
     */
    name: z
        .string()
        .min(1)
        .max(100)
        .describe("Human-readable name of the data item"),
    /**
     * @property
     * Human-readable description of the uploaded content.
     */
    description: z
        .string()
        .max(500)
        .optional()
        .describe("Description of the data item"),
    /**
     * @property
     * Author of the content, represented as id(not authUid)
     */
    author: z.string().min(1).max(100).describe("Author ID of the data item"),

    /**
     * @property Whether the content is encrypted.
     * If encrypted, the value is true. Encryption key is not handled by server.
     * It just stores the blob as-is.
     * Encryption implies that it is private data.
     * @see additionalData for the actual blob URL.
     */
    encrypted: z
        .boolean()
        .default(false)
        .describe(
            "Whether the data is encrypted. If true, the additionalData(not link, but content) is encrypted. " +
                "Encryption implies that it is private data."
        ),
    /**
     * URL to the additional data blob stored in the storage client.
     * It just contains exported contact file URL.
     * It may be encrypted if `encrypted` is set.
     * @see encrypted
     */
    additionalData: z
        .url()
        .describe("URL to the additional data blob. It may be encrypted."),
    /**
     * @property Number of times the content has been downloaded.
     * It is not guaranteed to be accurate, as it is not transactionally updated.
     * It is just a best-effort value for display purpose.
     */
    downloadCount: z
        .number()
        .min(0)
        .default(0)
        .describe(
            "Number of times the data has been downloaded. It is not guaranteed to be accurate."
        ),
    uploadedAt: z
        .number()
        .describe("Timestamp when the data was uploaded.")
        .optional(),
});

export const DataSchema = PartialDataSchema.and(Queryable);

export type PartialData = Partial<Omit<DataType, "id">> & { id?: string };
