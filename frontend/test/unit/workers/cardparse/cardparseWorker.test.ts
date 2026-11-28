import { describe, it, expect, vi } from "vitest";
import { expose } from "comlink";
import { api } from "@worker/cardparse/main";
import { iterableToStream, readAll } from "@worker/cardparse/shared";
import type { LogBridgeReceiver } from "@common/logger/LogBridge";
import type { StandardLogEntry } from "@common/logger/Logger";
import { exampleCharacter } from "@/const/example_data";
import { cloneDeep } from "lodash-es";

// Only `expose` is replaced: a Node test context has no worker endpoint to attach to.
vi.mock("comlink", async (importOriginal) => {
    const actual = await importOriginal<typeof import("comlink")>();
    return { ...actual, expose: vi.fn() };
});

/** CBOR encoding of an empty map: valid CBOR that is not a character. */
const EMPTY_CBOR_MAP = new Uint8Array([0xa0]);

function deflate(bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
    return readAll(new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw")));
}

/** Drains a stream of bytes into one buffer. */
async function collect(stream: ReadableStream): Promise<Uint8Array> {
    return new Uint8Array(await new Response(stream).arrayBuffer());
}

function recordingReceiver() {
    const logs: StandardLogEntry[] = [];
    const receiver: LogBridgeReceiver = {
        receiveLog: (entry) => void logs.push(entry),
        receiveStructuredLog: () => {},
    };
    return { receiver, logs };
}

describe("cardparse worker entry point", () => {
    it("exposes its api over comlink when the module loads", () => {
        expect(expose).toHaveBeenCalledTimes(1);
        expect(expose).toHaveBeenCalledWith(api);
    });

    it("exports and parses a character with binary assets through the exposed api", async () => {
        const character = cloneDeep(exampleCharacter);
        character.assets.assets.push({
            id: "asset-bytes",
            name: "bytes.bin",
            mimeType: "application/octet-stream",
            data: new Uint8Array([9, 8, 7, 0, 255]),
        });

        const packed = await api.exportCharacter(character);
        const parsed = await api.parseCharacter(packed);

        expect(parsed.success).toBe(true);
        expect(parsed).toEqual({ success: true, data: character });
    });

    it("reports a schema mismatch as a failed result instead of throwing", async () => {
        const result = await api.parseCharacter((await deflate(EMPTY_CBOR_MAP)).buffer);

        expect(result).toEqual({ success: false, error: "Failed to parse character" });
    });

    describe("setLogReceiver", () => {
        it("announces the connection to the receiver", () => {
            const { receiver, logs } = recordingReceiver();

            api.setLogReceiver(receiver);

            expect(logs).toHaveLength(1);
            expect(logs[0]).toMatchObject({
                level: "info",
                message: "Card parse worker connected to telemetry",
            });
        });

        it("makes parse and export report their progress to the receiver", async () => {
            const { receiver, logs } = recordingReceiver();
            api.setLogReceiver(receiver);
            logs.length = 0;
            const character = cloneDeep(exampleCharacter);

            const packed = await api.exportCharacter(character);
            await api.parseCharacter(packed);

            expect(logs.map((entry) => [entry.level, entry.message])).toEqual([
                ["debug", "Exporting character card..."],
                ["debug", "Parsing character card..."],
                ["info", "Character parsed successfully"],
            ]);
            expect(logs[2].data).toEqual([{ id: character.id, name: character.name }]);
        });

        it("logs an error entry when a card does not validate", async () => {
            const { receiver, logs } = recordingReceiver();
            api.setLogReceiver(receiver);
            logs.length = 0;
            const emptyMap = await deflate(EMPTY_CBOR_MAP);

            await api.parseCharacter(emptyMap.buffer);

            expect(logs.map((entry) => entry.level)).toEqual(["debug", "error"]);
            expect(logs[1].message).toBe("Failed to parse character");
        });
    });
});

describe.concurrent("iterableToStream with async iterables", () => {
    async function* chunksOf(...parts: Uint8Array[]) {
        for (const part of parts) yield part;
    }

    it("streams every chunk of an async iterable in order", async () => {
        const stream = iterableToStream([chunksOf(new Uint8Array([1, 2]), new Uint8Array([3]))]);

        expect(await collect(stream)).toEqual(new Uint8Array([1, 2, 3]));
    });

    it("only exposes the viewed window of a chunk that is a subarray of a larger buffer", async () => {
        const backing = new Uint8Array([0, 1, 2, 3, 4, 5]);
        const view = new Uint8Array(backing.buffer, 2, 3);

        const bytes = await collect(iterableToStream([chunksOf(view)]));

        expect(bytes).toEqual(new Uint8Array([2, 3, 4]));
    });

    it("keeps the order across mixed chunk kinds", async () => {
        const stream = iterableToStream([
            new Uint8Array([1]),
            new Blob([new Uint8Array([2])]),
            chunksOf(new Uint8Array([3]), new Uint8Array([4])),
            new Uint8Array([5]),
        ]);

        expect(await collect(stream)).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
    });

    it("produces an empty stream for an async iterable without chunks", async () => {
        expect(await collect(iterableToStream([chunksOf()]))).toEqual(new Uint8Array([]));
    });
});
