/**
 * Round-trip test: export → serialize → parse → compare.
 * Exercises the CBOR encode/decode logic and format detection.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Minimal cbor-x mock: encode wraps JSON in a CBOR-like prefix (0xA1 + JSON bytes)
// decode strips the prefix and JSON-parses the rest.
vi.mock("cbor-x", () => {
    const PREFIX = 0xa1;
    return {
        encode: (data: unknown) =>
            new Uint8Array([PREFIX, ...new TextEncoder().encode(JSON.stringify(data))]),
        decode: (buf: Uint8Array) => JSON.parse(new TextDecoder().decode(buf.slice(1))) as unknown,
    };
});

vi.mock("@/lib/adapters/storage/IndexedDBHelper", () => ({
    getArisuDB: () => ({
        tables: [],
        // Provide empty arrays for all table lookups
        chats: { toArray: () => Promise.resolve([]) },
        characters: { toArray: () => Promise.resolve([]) },
        settings: { toArray: () => Promise.resolve([]) },
        personas: { toArray: () => Promise.resolve([]) },
        messages: { toArray: () => Promise.resolve([]) },
        stickers: { toArray: () => Promise.resolve([]) },
        memories: { toArray: () => Promise.resolve([]) },
    }),
}));

import { exportAllData, exportDataAsBlob, parseBackupFile } from "@/lib/migration/storageMigration";

describe("storageMigration round-trip", () => {
    beforeEach(() => {
        vi.stubGlobal(
            "localStorage",
            (() => {
                const store: Record<string, string> = {};
                return {
                    getItem: (key: string) => store[key] ?? null,
                    setItem: (key: string, value: string) => void (store[key] = value),
                    removeItem: (key: string) => void delete store[key],
                    clear: () => {
                        for (const k of Object.keys(store)) delete store[k];
                    },
                };
            })()
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("export → serialize → parse round-trips correctly", async () => {
        const exported = await exportAllData();
        const blob = await exportDataAsBlob();
        const file = new File([blob], "test.aribackup", { type: "application/octet-stream" });
        const parsed = await parseBackupFile(file);
        expect(parsed.data).toEqual(exported.data);
    });

    it("rejects JSON without data property", async () => {
        const file = new File([JSON.stringify({ notData: true })], "bad.json");
        await expect(parseBackupFile(file)).rejects.toThrow("missing 'data' property");
    });
});
