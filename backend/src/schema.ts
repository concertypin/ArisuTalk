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
            "Unique identifier for the data entry. It is used as internal reference.",
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
                "Encryption implies that it is private data.",
        ),
    /**
     * URL to the additional data blob stored in the storage client.
     * It just contains exported contact file URL.
     * It may be encrypted if `encrypted` is set.
     * @see encrypted
     */
    additionalData: z
        .url()
        .describe(
            "URL to the additional data blob. Its content may be encrypted. It might not be publicly accessible, use dedicated endpoint to access it.",
        ),
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
            "Number of times the data has been downloaded. It is not guaranteed to be accurate.",
        ),
    uploadedAt: z
        .number()
        .describe("Timestamp when the data was uploaded.")
        .optional(),
});

export const DataSchema = PartialDataSchema.and(Queryable);

export const PaginationOptionschema = z.object({
    limit: z.coerce
        .number()
        .int()
        .positive()
        .max(100)
        .optional()
        .default(10)
        .describe("Number of items to return per page."),
    pageToken: z
        .string()
        .optional()
        .describe(
            "Token for retrieving the next page of results. Is typically returned from a previous query.",
        ),
});
export const PaginatedResultSchema = z.object({
    items: z.array(DataSchema).describe("Array of items for the current page."),
    nextPageToken: z
        .string()
        .optional()
        .describe(
            "Token for retrieving the next page of results. If null or undefined, there are no more pages. It is typically(not nececcary) alphanumeric value.",
        ),
    totalCount: z
        .number()
        .int()
        .min(-1)
        .default(-1)
        .describe(
            "Total number of items (if available). This might not be supported by all implementations. If not supported, it will be -1.",
        ),
});

export type paginatedResultType<T> = {
    items: T[];
    nextPageToken?: string;
    totalCount: number;
};

export type PartialData = Partial<Omit<DataType, "id">> & { id?: string };
