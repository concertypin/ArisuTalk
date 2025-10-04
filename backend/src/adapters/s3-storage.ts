export interface StorageClient {
  upload(
    buffer: ArrayBuffer | Uint8Array,
    contentType?: string,
  ): Promise<string>;
  get(url: string): Promise<ArrayBuffer | null>;
  delete(url: string): Promise<void>;
}

// In-memory storage: stores blobs in a Map and returns fake URLs.
export class InMemoryStorage implements StorageClient {
  private store = new Map<string, Uint8Array>();
  private counter = 0;

  async upload(buffer: ArrayBuffer | Uint8Array) {
    const id = `mem://${Date.now()}-${this.counter++}`;
    const u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    // store a copy to avoid shared underlying buffers
    const copy = new Uint8Array(u8.length);
    copy.set(u8);
    this.store.set(id, copy);
    return id;
  }

  async get(url: string) {
    const v = this.store.get(url);
    if (!v) return null;
    // return a copy as ArrayBuffer
    const copy = v.slice();
    return copy.buffer;
  }

  async delete(url: string) {
    this.store.delete(url);
  }
}

export function createStorageClient(binding?: any): StorageClient {
  if (!binding) return new InMemoryStorage();

  // Placeholder for real S3-like client using provided binding.
  const realClient: StorageClient = {
    async upload(buffer: ArrayBuffer | Uint8Array, contentType?: string) {
      // binding.upload should upload and return a URL
      return await binding.upload(buffer, contentType);
    },
    async get(url: string) {
      return await binding.get(url);
    },
    async delete(url: string) {
      return await binding.delete(url);
    },
  };

  return realClient;
}
