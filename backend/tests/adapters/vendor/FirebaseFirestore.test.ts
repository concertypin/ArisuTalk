import { createFirestoreClient } from "firebase-rest-firestore";
import {
    beforeEach,
    describe,
    expect,
    it,
    type MockedFunction,
    vi,
} from "vitest";
import type { DBEnv } from "@/adapters/client";
import { DataListOrder } from "@/adapters/StorageClientBase";
import FirebaseFirestoreClient from "@/adapters/vendor/FirebaseFirestore";
import type { DataType } from "@/schema";

// Mock the library
vi.mock("firebase-rest-firestore", () => ({
    createFirestoreClient: vi.fn(),
}));

/**
 * Generic record type for Firestore data.
 */
type FirestoreData = Record<string, unknown>;

/**
 * Mock interface for a Firestore document reference.
 */
interface MockDocRef {
    get: MockedFunction<
        () => Promise<{
            exists: boolean;
            id: string;
            data: () => FirestoreData | null;
        }>
    >;
    delete: MockedFunction<() => Promise<void>>;
    update: MockedFunction<(data: FirestoreData) => Promise<void>>;
}

/**
 * Mock interface for a Firestore query.
 */
interface MockQuery {
    get: MockedFunction<
        () => Promise<{ id: string; data: () => FirestoreData }[]>
    >;
    where: MockedFunction<() => MockQuery>;
    orderBy: MockedFunction<() => MockQuery>;
}

/**
 * Mock interface for a Firestore collection.
 */
interface MockCollection {
    doc: MockedFunction<(id: string) => MockDocRef>;
    add: MockedFunction<(data: FirestoreData) => Promise<{ id: string }>>;
    where: MockedFunction<
        (field: string, op: string, value: unknown) => MockQuery
    >;
    orderBy: MockedFunction<(field: string, dir: string) => MockQuery>;
    get: MockedFunction<
        () => Promise<{ id: string; data: () => FirestoreData }[]>
    >;
}

/**
 * Mock interface for the Firestore database instance.
 */
interface MockDb {
    collection: MockedFunction<(name: string) => MockCollection>;
}

describe("FirebaseFirestoreClient", () => {
    const mockEnv: DBEnv = {
        SECRET_FIREBASE_PROJECT_ID: "test-project",
        SECRET_FIREBASE_CLIENT_EMAIL: "test@example.com",
        SECRET_FIREBASE_PRIVATE_KEY: "test-key",
        SECRET_CLERK_SECRET_KEY: "test-clerk-key", // Required by DBEnv
        ENV_CLERK_PUBLIC_KEY: "test-clerk-pub", // Required by DBEnv
    };

    let client: FirebaseFirestoreClient;
    let mockDb: MockDb;
    let mockCollection: MockCollection;
    let mockDocRef: MockDocRef;
    let mockQuery: MockQuery;

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup chainable mocks with proper typing
        mockDocRef = {
            get: vi.fn(),
            delete: vi.fn(),
            update: vi.fn(),
        };

        // Create mock functions first to handle circular references in types
        const queryWhere = vi.fn<() => MockQuery>();
        const queryOrderBy = vi.fn<() => MockQuery>();

        mockQuery = {
            get: vi.fn(),
            where: queryWhere,
            orderBy: queryOrderBy,
        };

        // Setup the circular returns
        queryWhere.mockReturnValue(mockQuery);
        queryOrderBy.mockReturnValue(mockQuery);

        mockCollection = {
            doc: vi.fn((_id: string) => mockDocRef),
            add: vi.fn(async (_data: FirestoreData) => ({ id: "new-id" })),
            where: vi.fn(
                (_field: string, _op: string, _value: unknown) => mockQuery,
            ),
            orderBy: vi.fn((_field: string, _dir: string) => mockQuery),
            get: vi.fn(),
        };

        mockDb = {
            collection: vi.fn((_name: string) => mockCollection),
        };

        // Type the mock for createFirestoreClient
        vi.mocked(createFirestoreClient).mockReturnValue(
            mockDb as unknown as ReturnType<typeof createFirestoreClient>,
        );

        client = new FirebaseFirestoreClient(mockEnv);
    });

    /**
     * Tests initialization logic.
     */
    it("should initialize correctly with environment variables", () => {
        expect(createFirestoreClient).toHaveBeenCalledWith({
            projectId: "test-project",
            clientEmail: "test@example.com",
            privateKey: "test-key",
        });
    });

    it("should handle private key newline replacement", () => {
        const envWithEscapedNewlines: DBEnv = {
            ...mockEnv,
            SECRET_FIREBASE_PRIVATE_KEY: "line1\nline2",
        };
        new FirebaseFirestoreClient(envWithEscapedNewlines);
        expect(createFirestoreClient).toHaveBeenCalledWith(
            expect.objectContaining({
                privateKey: "line1\nline2",
            }),
        );
    });

    it("should throw if credentials are missing", () => {
        // Partial env to trigger error
        const invalidEnv = {
            ...mockEnv,
            SECRET_FIREBASE_PROJECT_ID: "",
        };
        expect(() => new FirebaseFirestoreClient(invalidEnv)).toThrowError(
            /Firebase credentials/,
        );
    });

    describe("get", () => {
        it("should return document data if it exists", async () => {
            const mockData = { name: "Test", downloadCount: "10" };
            mockDocRef.get.mockResolvedValue({
                exists: true,
                id: "doc-1",
                data: () => mockData,
            });

            const result = await client.get("doc-1");

            expect(mockDb.collection).toHaveBeenCalledWith("data");
            expect(mockCollection.doc).toHaveBeenCalledWith("doc-1");
            expect(result).toEqual({
                id: "doc-1",
                name: "Test",
                downloadCount: 10,
                uploadedAt: undefined,
            });
        });

        it("should return null if document does not exist", async () => {
            mockDocRef.get.mockResolvedValue({
                exists: false,
                id: "doc-1",
                data: () => null,
            });
            const result = await client.get("doc-1");
            expect(result).toBeNull();
        });

        it("should return null if get throws", async () => {
            mockDocRef.get.mockRejectedValue(new Error("Network error"));
            const result = await client.get("doc-1");
            expect(result).toBeNull();
        });
    });

    describe("put", () => {
        it("should add document and return it", async () => {
            const newItem: Omit<DataType, "id"> = {
                name: "New Item",
                author: "user-1",
                downloadCount: 0,
                encrypted: false,
                additionalData: "http://example.com/blob",
            };

            mockCollection.add.mockResolvedValue({ id: "new-id" });

            const result = await client.put(newItem);

            expect(mockCollection.add).toHaveBeenCalledWith(newItem);
            expect(result).toEqual({
                id: "new-id",
                ...newItem,
                downloadCount: 0,
                uploadedAt: undefined,
            });
        });
    });

    describe("delete", () => {
        it("should delete document by id", async () => {
            await client.delete("doc-1");
            expect(mockCollection.doc).toHaveBeenCalledWith("doc-1");
            expect(mockDocRef.delete).toHaveBeenCalled();
        });
    });

    describe("update", () => {
        it("should update document and return updated data", async () => {
            const updateData: Partial<DataType> & { id: string } = {
                id: "doc-1",
                name: "Updated",
            };
            const existingData = {
                name: "Updated",
                author: "user-1",
                downloadCount: 5,
            };

            mockDocRef.update.mockResolvedValue(undefined);
            mockDocRef.get.mockResolvedValue({
                exists: true,
                id: "doc-1",
                data: () => existingData,
            });

            const result = await client.update(updateData);

            expect(mockDocRef.update).toHaveBeenCalledWith({ name: "Updated" });
            expect(result).toEqual({
                id: "doc-1",
                ...existingData,
                downloadCount: 5,
            });
        });

        it("should throw if updated document is not found", async () => {
            mockDocRef.update.mockResolvedValue(undefined);
            mockDocRef.get.mockResolvedValue({
                exists: false,
                id: "doc-1",
                data: () => null,
            });

            await expect(
                client.update({ id: "doc-1", name: "Updated" }),
            ).rejects.toThrow(/Failed to retrieve updated document/);
        });
    });

    describe("list", () => {
        it("should list all documents", async () => {
            const mockDocs = [
                { id: "1", data: () => ({ name: "A", downloadCount: 1 }) },
                { id: "2", data: () => ({ name: "B", downloadCount: 2 }) },
            ];
            mockCollection.get.mockResolvedValue(mockDocs);

            const result = await client.list();

            expect(mockCollection.get).toHaveBeenCalled();
            expect(result.items).toHaveLength(2);
            expect(result.items[0].id).toBe("1");
        });

        it("should list documents with order NewestFirst", async () => {
            const mockDocs: { id: string; data: () => FirestoreData }[] = [];
            mockQuery.get.mockResolvedValue(mockDocs);

            await client.list(DataListOrder.NewestFirst);

            expect(mockCollection.orderBy).toHaveBeenCalledWith(
                "uploadedAt",
                "desc",
            );
        });

        it("should list documents with order DownloadsFirst", async () => {
            const mockDocs: { id: string; data: () => FirestoreData }[] = [];
            mockQuery.get.mockResolvedValue(mockDocs);

            await client.list(DataListOrder.DownloadsFirst);

            expect(mockCollection.orderBy).toHaveBeenCalledWith(
                "downloadCount",
                "desc",
            );
        });
    });

    describe("queryByName", () => {
        it("should query documents by name", async () => {
            const mockDocs = [{ id: "1", data: () => ({ name: "Target" }) }];
            mockQuery.get.mockResolvedValue(mockDocs);

            const result = await client.queryByName("Target");

            expect(mockCollection.where).toHaveBeenCalledWith(
                "name",
                "==",
                "Target",
            );
            expect(result.items).toHaveLength(1);

            expect(result.items[0].name).toBe("Target");
        });
    });

    describe("bumpDownloadCount", () => {
        it("should increment download count", async () => {
            const initialData = { downloadCount: 5 };
            mockDocRef.get.mockResolvedValue({
                exists: true,
                id: "doc-1",
                data: () => initialData,
            });

            await client.bumpDownloadCount("doc-1");

            expect(mockDocRef.update).toHaveBeenCalledWith({
                downloadCount: 6,
            });
        });

        it("should handle string download count from DB", async () => {
            const initialData = { downloadCount: "5" };
            mockDocRef.get.mockResolvedValue({
                exists: true,
                id: "doc-1",
                data: () => initialData,
            });

            await client.bumpDownloadCount("doc-1");

            expect(mockDocRef.update).toHaveBeenCalledWith({
                downloadCount: 6,
            });
        });

        it("should do nothing if document does not exist", async () => {
            mockDocRef.get.mockResolvedValue({
                exists: false,
                id: "doc-1",
                data: () => null,
            });

            await client.bumpDownloadCount("doc-1");

            expect(mockDocRef.update).not.toHaveBeenCalled();
        });
    });
});
