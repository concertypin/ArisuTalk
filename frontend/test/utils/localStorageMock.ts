export class LocalStorageMock implements Storage {
    private store: Map<string, string>;

    constructor() {
        this.store = new Map<string, string>();
    }

    clear(): void {
        this.store.clear();
    }

    getItem(key: string): string | null {
        return this.store.has(key) ? this.store.get(key)! : null;
    }

    setItem(key: string, value: string): void {
        this.store.set(key, value);
    }

    removeItem(key: string): void {
        this.store.delete(key);
    }

    get length(): number {
        return this.store.size;
    }

    key(index: number): string | null {
        if (index < 0 || index >= this.store.size) {
            return null;
        }
        const keys = Array.from(this.store.keys());
        return keys[index];
    }
}

/**
 * Creates a LocalStorageMock with vitest spy functions for test assertions.
 * This is useful when you need to verify that localStorage methods were called.
 *
 * @param vi - The vitest module import
 * @returns A LocalStorageMock instance with all methods wrapped in vi.fn()
 *
 * @example
 * ```ts
 * import { describe, beforeEach, vi } from 'vitest';
 * import { createLocalStorageMock } from '@test/utils/localStorageMock';
 *
 * describe('MyTest', () => {
 *   let localStorageMock: Storage;
 *
 *   beforeEach(() => {
 *     localStorageMock = createLocalStorageMock(vi);
 *     vi.stubGlobal('localStorage', localStorageMock);
 *   });
 * });
 * ```
 */
export function createLocalStorageMock(vi: (typeof import("vitest"))["vi"]): Storage {
    let store: Record<string, string> = {};

    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value.toString();
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        get length() {
            return Object.keys(store).length;
        },
        key: vi.fn((index: number) => {
            const keys = Object.keys(store);
            return keys[index] || null;
        }),
    };
}

export default LocalStorageMock;
