import { Data } from "../types";

export interface DBClient {
  get(id: string): Promise<Data | null>;
  queryByName(name: string): Promise<Data[]>;
  list(): Promise<Data[]>;
  put(item: Data): Promise<void>;
  delete(id: string): Promise<void>;
}

// In-memory fallback implementation for development/testing.
export class InMemoryDB implements DBClient {
  private store = new Map<string, Data>();

  async get(id: string) {
    return this.store.get(id) ?? null;
  }

  async queryByName(name: string) {
    const results: Data[] = [];
    for (const v of this.store.values()) {
      if (v.name === name) results.push(v);
    }
    return results;
  }

  async list() {
    return Array.from(this.store.values());
  }

  async put(item: Data) {
    this.store.set(item.id, item);
  }

  async delete(id: string) {
    this.store.delete(id);
  }
}

// Real Oracle NoSQL client placeholder. When running on a platform with
// proper bindings, you can implement the real client here using the
// official SDK or HTTP API. For now, we expose a factory that will
// return either the provided binding or the in-memory fallback.

export function createDBClient(binding?: any): DBClient {
  if (!binding) return new InMemoryDB();

  // Example placeholder: binding is expected to have methods to operate
  // on the Oracle NoSQL service. Developers should replace with real
  // implementation.
  const realClient: DBClient = {
    async get(id: string) {
      const res = await binding.get(id);
      return res ?? null;
    },
    async queryByName(name: string) {
      const res = await binding.queryByName(name);
      return res ?? [];
    },
    async list() {
      return (await binding.list()) ?? [];
    },
    async put(item: Data) {
      await binding.put(item);
    },
    async delete(id: string) {
      await binding.delete(id);
    },
  };

  return realClient;
}
