import { Container, CosmosClient, Database } from "@azure/cosmos";
import { DataType } from "@/schema";
import { DBEnv } from "@/adapters/client";
import { BaseDataDBClient, DataListOrder } from "@/adapters/StorageClientBase";

/**
 * Lightweight in-memory implementation of BaseDataDBClient.
 *
 * This adapter is intentionally simple: it stores DataType items in a Map,
 * generates ids with crypto.randomUUID (falls back to a small UUID helper),
 * and provides basic query/list semantics. Useful for local development
 * or unit tests when a real Azure Cosmos DB connection is not available.
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
    async get(id: string): Promise<DataType | null> {
        const doc = await this.container.item(id).read<DataType>();
        return doc.resource ?? null;
    }

    async queryByName(name: string): Promise<DataType[]> {
        //It is fuzzy search.
        const { resources } = await this.container.items
            .query<DataType>({
                query:
                    `SELECT * FROM ${this.containerName} ` +
                    `WHERE CONTAINS(LOWER(c.name), LOWER(@name))`,
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
        let orderBy = `ORDER BY ${this.containerName}.`;
        if (order === DataListOrder.NewestFirst) {
            orderBy += "uploadedAt DESC";
        } else if (order === DataListOrder.DownloadsFirst) {
            orderBy = "downloadCount DESC";
        } else orderBy = "";

        const query = `SELECT * FROM ${this.containerName} ${orderBy}`;
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
    async delete(id: string): Promise<void> {
        await this.container.item(id).delete();
    }
}
