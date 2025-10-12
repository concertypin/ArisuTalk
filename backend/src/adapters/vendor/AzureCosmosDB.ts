import { Container, CosmosClient, Database } from "@azure/cosmos";
import { DataType } from "@/schema";
import { DBEnv } from "@/adapters/client";
import { BaseDataDBClient, DataListOrder } from "@/adapters/StorageClientBase";

/**
 * An adapter for Azure Cosmos DB that implements the BaseDataDBClient interface.
 *
 * This client connects to an Azure Cosmos DB instance and provides methods
 * for CRUD operations on data items, leveraging the Cosmos DB SQL API.
 */
export default class AzureCosmosDB implements BaseDataDBClient {
    private client: CosmosClient;
    private database: Database;
    private container: Container;
    private containerName: string;
    constructor(env: DBEnv) {
        if (!env.SECRET_AZURE_COSMOSDB_CONNECTION_STRING) {
            throw new Error(
                "Azure Cosmos DB environment variables are not properly set"
            );
        }
        this.client = new CosmosClient(
            env.SECRET_AZURE_COSMOSDB_CONNECTION_STRING
        );
        this.database = this.client.database(
            env.SECRET_AZURE_COSMOSDB_DATABASE_NAME
        );
        this.containerName = env.SECRET_AZURE_COSMOSDB_CONTAINER_NAME;
        this.container = this.database.container(this.containerName);
    }

    async bumpDownloadCount(id: string): Promise<void> {
        // Use Cosmos DB patch operation to increment atomically when available
        try {
            // Partial patch: increment downloadCount by 1
            await this.container
                .item(id)
                .patch([{ op: "incr", path: "/downloadCount", value: 1 }]);
            return;
        } catch (e) {
            // Fallback to read/replace if patch is not supported in the environment
            const itemRef = this.container.item(id);
            const readRes = await itemRef.read<DataType>();
            const existing = readRes.resource;
            if (!existing) return;

            const updated: DataType = {
                ...existing,
                downloadCount: (existing.downloadCount ?? 0) + 1,
            };
            await itemRef.replace<DataType>(updated);
        }
    }

    async get(id: string): Promise<DataType | null> {
        const doc = await this.container.item(id).read<DataType>();
        return doc.resource ?? null;
    }

    async queryByName(name: string): Promise<DataType[]> {
        //It is fuzzy search.
        const { resources } = await this.container.items
            .query<DataType>({
                query: `SELECT * FROM c WHERE CONTAINS(LOWER(c.name), LOWER(@name))`,
                parameters: [
                    {
                        name: "@name",
                        value: name,
                    },
                ],
            })
            .fetchAll();
        return resources;
    }

    async list(order?: DataListOrder): Promise<DataType[]> {
        let orderBy = `ORDER BY c.`;
        if (order === DataListOrder.NewestFirst) {
            orderBy += "uploadedAt DESC";
        } else if (order === DataListOrder.DownloadsFirst) {
            orderBy = "downloadCount DESC";
        } else orderBy = "";
        const query = `SELECT * FROM c ${orderBy}`;
        console.log("CosmosDB list query:", query);

        //(await this.client.databases.query<DataType>("").fetchAll()).resources
        return (
            await this.container.items
                .query<DataType>({
                    query: query,
                })
                .fetchAll()
        ).resources;
    }
    async put(item: Omit<DataType, "id">): Promise<DataType> {
        const id = crypto.randomUUID();
        const itemWithId = { ...item, id };
        const req = await this.container.items.create<DataType>(itemWithId);
        if (req.resource) return req.resource;
        throw new Error("Failed to create item in Cosmos DB");
    }
    async update(item: DataType): Promise<DataType> {
        // Replace the existing item with the provided one
        const id = item.id;
        const itemRef = this.container.item(id);
        const resp = await itemRef.replace<DataType>(item);
        if (resp.resource) return resp.resource;
        throw new Error("Failed to update item in Cosmos DB");
    }
    async delete(id: string): Promise<void> {
        await this.container.item(id).delete();
    }
}
