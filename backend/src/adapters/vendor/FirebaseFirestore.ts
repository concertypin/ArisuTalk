import {
    type CollectionReference,
    createFirestoreClient,
    type Query,
} from "firebase-rest-firestore";
import {
    type BaseDataDBClient,
    DataListOrder,
    type PaginationOptions,
    type PaginationResult,
} from "@/adapters/StorageClientBase";
import type { VendorSecretEnv } from "@/environmentTypes";
import type { DataType } from "@/schema";

/**
 * FirebaseFirestoreClient is an implementation of BaseDataDBClient
 * that interacts with Google Firebase Firestore to perform CRUD operations
 * on DataType objects.
 *
 * Hierarchy:
 * - Collection: defaults to "data", can be customized via SECRET_FIRESTORE_COLLECTION_NAME
 *   - Documents: Each document represents a DataType object.-
 */
export default class FirebaseFirestoreClient implements BaseDataDBClient {
    private readonly db: ReturnType<typeof createFirestoreClient>;
    private readonly collectionName: string;

    /**
     * Initializes the FirebaseFirestoreClient.
     *
     * @param env - The environment variables containing Firebase credentials.
     * @throws {Error} If required Firebase credentials are missing.
     */
    constructor(env: VendorSecretEnv["firebase"]) {
        if (
            !env.SECRET_FIREBASE_PROJECT_ID ||
            !env.SECRET_FIREBASE_CLIENT_EMAIL ||
            !env.SECRET_FIREBASE_PRIVATE_KEY
        ) {
            throw new Error(
                "Firebase credentials (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY) are not fully defined in the environment.",
            );
        }

        this.db = createFirestoreClient({
            projectId: env.SECRET_FIREBASE_PROJECT_ID,
            clientEmail: env.SECRET_FIREBASE_CLIENT_EMAIL,
            privateKey: env.SECRET_FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        });
        this.collectionName = env.SECRET_FIRESTORE_COLLECTION_NAME ?? "data";
    }

    /**
     * Normalizes data retrieved from Firestore to match the DataType interface.
     * Handles type conversion for numeric fields that might be returned as strings.
     *
     * @param id - The document ID.
     * @param data - The raw data object from Firestore.
     * @returns The normalized DataType object.
     */

    // biome-ignore lint/suspicious/noExplicitAny: Firestore data can be any
    private normalizeData(id: string, data: any): DataType {
        return {
            ...data,
            id,
            // Ensure number fields are actual numbers
            downloadCount: data.downloadCount ? Number(data.downloadCount) : 0,
            uploadedAt: data.uploadedAt ? Number(data.uploadedAt) : undefined,
        } satisfies DataType;
    }

    /**
     * Retrieves a document by its ID.
     *
     * @param id - The unique identifier of the document.
     * @returns A promise that resolves to the document data or null if not found.
     */
    async get(id: string): Promise<DataType | null> {
        try {
            const doc = await this.db
                .collection(this.collectionName)
                .doc(id)
                .get();
            if (!doc.exists) return null;

            const data = doc.data();
            if (!data) return null;

            return this.normalizeData(doc.id, data);
        } catch (e) {
            console.error("Error fetching document:", e);
            return null;
        }
    }

    /**
     * Queries documents by name with pagination support.
     *
     * @param name - The name to search for.
     * @param options - Pagination options including limit and pageToken.
     * @returns A promise that resolves to a paginated result of matching documents.
     */
    async queryByName(
        name: string,
        options?: PaginationOptions,
    ): Promise<PaginationResult<DataType>> {
        // For now, we'll implement a simple offset-based pagination
        // In a real implementation, you might want to use cursor-based pagination
        const limit = options?.limit || 10; // Default limit of 10
        const offset = options?.pageToken ? parseInt(options.pageToken, 10) : 0;

        // Get all documents (not ideal for large datasets)
        const allQuerySnapshot = await this.db
            .collection(this.collectionName)
            .where("name", "==", name)
            .get();

        // Convert to array and apply pagination
        const allResults: DataType[] = [];
        allQuerySnapshot.forEach((doc) => {
            allResults.push(this.normalizeData(doc.id, doc.data()));
        });

        // Apply pagination
        const paginatedResults = allResults.slice(offset, offset + limit);

        // Determine if there's a next page
        let nextPageToken: string | undefined;
        if (offset + limit < allResults.length) {
            nextPageToken = String(offset + limit);
        }

        return {
            items: paginatedResults,
            nextPageToken,
            totalCount: allResults.length,
        };
    }

    /**
     * Lists all documents with pagination support, optionally sorted.
     *
     * @param order - The order in which to list the documents.
     * @param options - Pagination options including limit and pageToken.
     * @returns A promise that resolves to a paginated result of documents.
     */
    async list(
        order?: DataListOrder,
        options?: PaginationOptions,
    ): Promise<PaginationResult<DataType>> {
        // For now, we'll implement a simple offset-based pagination
        // In a real implementation, you might want to use cursor-based pagination
        const limit = options?.limit || 10; // Default limit of 10
        const offset = options?.pageToken ? parseInt(options.pageToken, 10) : 0;

        let query: Query | CollectionReference = this.db.collection(
            this.collectionName,
        );

        if (order) {
            let orderByField = "uploadedAt";
            let orderByDirection: "desc" | "asc" = "desc";

            if (order === DataListOrder.NewestFirst) {
                orderByField = "uploadedAt";
                orderByDirection = "desc";
            } else if (order === DataListOrder.DownloadsFirst) {
                orderByField = "downloadCount";
                orderByDirection = "desc";
            }

            query = query.orderBy(orderByField, orderByDirection);
        }

        // Get all documents (not ideal for large datasets)
        const querySnapshot = await query.get();

        // Convert to array and apply pagination
        const allResults: DataType[] = [];
        querySnapshot.forEach((doc) => {
            allResults.push(this.normalizeData(doc.id, doc.data()));
        });

        // Apply pagination
        const paginatedResults = allResults.slice(offset, offset + limit);

        // Determine if there's a next page
        let nextPageToken: string | undefined;
        if (offset + limit < allResults.length) {
            nextPageToken = String(offset + limit);
        }

        return {
            items: paginatedResults,
            nextPageToken,
            totalCount: allResults.length,
        };
    }

    /**
     * Adds a new document to the collection.
     *
     * @param item - The item to add (excluding the ID).
     * @returns A promise that resolves to the added document with its generated ID.
     */
    async put(item: Omit<DataType, "id">): Promise<DataType> {
        const docRef = await this.db.collection(this.collectionName).add(item);
        // item already has correct types since it comes from app code, but normalize ensures consistency
        return this.normalizeData(docRef.id, item);
    }

    /**
     * Deletes a document by its ID.
     *
     * @param id - The unique identifier of the document to delete.
     * @returns A promise that resolves when the deletion is complete.
     */
    async delete(id: string): Promise<void> {
        await this.db.collection(this.collectionName).doc(id).delete();
    }

    /**
     * Increments the download count for a specific document.
     *
     * @param id - The unique identifier of the document.
     * @returns A promise that resolves when the update is complete.
     */
    async bumpDownloadCount(id: string): Promise<void> {
        const doc = await this.db.collection(this.collectionName).doc(id).get();
        if (!doc.exists) return;

        const data = doc.data();
        if (data) {
            // Safely cast to number to avoid string concatenation "10" + 1 = "101"
            const currentCount = Number(data.downloadCount || 0);
            await this.db
                .collection(this.collectionName)
                .doc(id)
                .update({
                    downloadCount: currentCount + 1,
                });
        }
    }

    /**
     * Updates an existing document.
     *
     * @param item - The partial data to update, must include the ID.
     * @returns A promise that resolves to the updated document.
     * @throws {Error} If the document is not found after update.
     */
    async update(
        item: Partial<DataType> & { id: DataType["id"] },
    ): Promise<DataType> {
        const { id, ...rest } = item;
        await this.db.collection(this.collectionName).doc(id).update(rest);

        const updatedDoc = await this.get(id);
        if (!updatedDoc) {
            throw new Error(
                `Failed to retrieve updated document with ID ${id}`,
            );
        }
        return updatedDoc;
    }
}
