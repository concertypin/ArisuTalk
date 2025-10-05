import { DataType } from "../../schema";
import { UserType } from "../../types";
import { BaseDataDBClient, DataListOrder } from "../StorageClientBase";

function ensureDir(p: string) {
    return (async () => {
        const fs = (await import("fs")).promises;
        return fs.mkdir(p, { recursive: true });
    })();
}

function safeId(): string {
    try {
        // Prefer crypto.randomUUID when available
        // @ts-ignore - some runtimes may not expose crypto on globalThis
        if (
            typeof crypto !== "undefined" &&
            typeof (crypto as any).randomUUID === "function"
        ) {
            return (crypto as any).randomUUID();
        }
    } catch {}
    return `${Date.now()}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

async function atomicWrite(filePath: string, data: string) {
    // Minimal, dependency-free path helpers so we don't import node:path at module level
    const dir =
        filePath.replace(/\\/g, "/").split("/").slice(0, -1).join("/") || ".";
    await ensureDir(dir);
    const tmp = `${filePath}.${Date.now()}.${Math.floor(Math.random() * 1e6)}.tmp`;
    const fs = (await import("fs")).promises;
    await fs.writeFile(tmp, data, "utf8");
    await fs.rename(tmp, filePath);
}

/**
 * Filesystem-backed implementation of BaseDataDBClient.
 * Each item is stored as a separate JSON file under `baseDir/data`.
 * This implementation favors simplicity and correctness for local/dev use.
 */
export class FilesystemDataDBClient implements BaseDataDBClient {
    private baseDir: string;

    constructor(baseDir?: string) {
        // Default to a `.db` folder relative to process working directory when available,
        // otherwise a relative `.db` path is used.
        this.baseDir = baseDir ?? ".db";
    }

    private dataDir() {
        return `${this.baseDir.replace(/\\/g, "/")}/data`;
    }

    private fileForId(id: string) {
        return `${this.dataDir().replace(/\\/g, "/")}/${id}.json`;
    }

    private async readAllItems(): Promise<DataType[]> {
        const dir = this.dataDir();
        try {
            const fs = (await import("fs")).promises;
            const files = await fs.readdir(dir);
            const items: DataType[] = [];
            await Promise.all(
                files.map(async (f: string) => {
                    if (!f.endsWith(".json")) return;
                    const full = `${dir}/${f}`;
                    try {
                        const txt = await fs.readFile(full, "utf8");
                        const parsed = JSON.parse(txt) as DataType;
                        items.push(parsed);
                    } catch {
                        // ignore malformed file
                    }
                })
            );
            return items;
        } catch (err: any) {
            if (err && (err.code === "ENOENT" || err.code === "ENOTDIR"))
                return [];
            throw err;
        }
    }

    async get(id: string): Promise<DataType | null> {
        const file = this.fileForId(id);
        try {
            const fs = (await import("fs")).promises;
            const txt = await fs.readFile(file, "utf8");
            return JSON.parse(txt) as DataType;
        } catch (err: any) {
            if (err && err.code === "ENOENT") return null;
            throw err;
        }
    }

    async queryByName(name: string): Promise<DataType[]> {
        if (!name) return [];
        const q = name.toLowerCase();
        const items = await this.readAllItems();
        return items.filter((item) => {
            const maybeName = (item as any)?.name;
            return (
                typeof maybeName === "string" &&
                maybeName.toLowerCase().includes(q)
            );
        });
    }

    async list(order?: DataListOrder): Promise<DataType[]> {
        const items = await this.readAllItems();
        try {
            const ord = order as any;
            if (typeof ord === "string") {
                if (ord.toLowerCase() === "desc") return items.reverse();
                return items;
            }
        } catch {
            // ignore
        }
        return items;
    }

    async put(item: Omit<DataType, "id">): Promise<DataType> {
        const id = safeId();
        const newItem = { ...(item as any), id } as DataType;
        const file = this.fileForId(id);
        await atomicWrite(file, JSON.stringify(newItem));
        return newItem;
    }

    async delete(id: string): Promise<void> {
        const file = this.fileForId(id);
        try {
            const fs = (await import("fs")).promises;
            await fs.unlink(file);
        } catch (err: any) {
            if (err && err.code === "ENOENT") return;
            throw err;
        }
    }
}

/**
 * Filesystem-backed implementation of BaseUserDBClient.
 * Each user is stored as a JSON file under `baseDir/users`.
 */
export class FilesystemUserDBClient implements BaseUserDBClient {
    private baseDir: string;

    constructor(baseDir?: string) {
        this.baseDir = baseDir ?? ".db";
    }

    private usersDir() {
        return `${this.baseDir.replace(/\\/g, "/")}/users`;
    }

    private fileForId(id: string) {
        return `${this.usersDir().replace(/\\/g, "/")}/${id}.json`;
    }

    private async readAllUsers(): Promise<UserType[]> {
        const dir = this.usersDir();
        try {
            const fs = (await import("fs")).promises;
            const files = await fs.readdir(dir);
            const results: UserType[] = [];
            await Promise.all(
                files.map(async (f: string) => {
                    if (!f.endsWith(".json")) return;
                    const full = `${dir}/${f}`;
                    try {
                        const txt = await fs.readFile(full, "utf8");
                        const parsed = JSON.parse(txt) as UserType;
                        results.push(parsed);
                    } catch {
                        // ignore malformed
                    }
                })
            );
            return results;
        } catch (err: any) {
            if (err && (err.code === "ENOENT" || err.code === "ENOTDIR"))
                return [];
            throw err;
        }
    }

    async get(id: string): Promise<UserType | null> {
        const file = this.fileForId(id);
        try {
            const fs = (await import("fs")).promises;
            const txt = await fs.readFile(file, "utf8");
            return JSON.parse(txt) as UserType;
        } catch (err: any) {
            if (err && err.code === "ENOENT") return null;
            throw err;
        }
    }

    async register(item: Omit<UserType, "id">): Promise<UserType> {
        const id = safeId();
        const newUser = { ...(item as any), id } as UserType;
        const file = this.fileForId(id);
        await atomicWrite(file, JSON.stringify(newUser));
        return newUser;
    }

    async update(id: string, updates: UserType): Promise<void> {
        const existing = await this.get(id);
        if (!existing) throw new Error("User not found.");
        const merged = { ...existing, ...updates, id } as UserType;
        const file = this.fileForId(id);
        await atomicWrite(file, JSON.stringify(merged));
    }

    async delete(id: string): Promise<void> {
        const file = this.fileForId(id);
        try {
            const fs = (await import("fs")).promises;
            await fs.unlink(file);
        } catch (err: any) {
            if (err && err.code === "ENOENT") return;
            throw err;
        }
    }

    async queryByAuthUid(authUid: string): Promise<UserType[]> {
        if (!authUid) return [];
        const users = await this.readAllUsers();
        return users.filter((u) => (u as any)?.authUid === authUid);
    }
}
