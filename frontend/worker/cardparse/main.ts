// worker.ts
import { type Character, CharacterSchema } from "@arisutalk/character-spec/v0/Character";
import { expose, transfer } from "comlink";
import { Decoder, Encoder, FLOAT32_OPTIONS } from "cbor-x";
import { createLogBridgeSender, type LogBridgeReceiver } from "@common/logger/LogBridge";

let logger: ReturnType<typeof createLogBridgeSender> | null = null;

// For not using Node.js Buffer, override global Buffer type
declare global {
    type Buffer = never;
}
type ParseResult<T> =
    | {
          success: true;
          data: T;
      }
    | {
          success: false;
          error?: string;
      };
const cborOptions = {
    useFloat32: FLOAT32_OPTIONS.DECIMAL_FIT,
    bundleStrings: true,
    pack: true,
    variableMapSize: true,
    structures: [],
} satisfies ConstructorParameters<typeof Encoder>["0"];
const encoder = new Encoder(cborOptions);
const decoder = new Decoder(cborOptions);

async function readAll(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
    const buffer = await new Response(stream).arrayBuffer();
    return new Uint8Array(buffer);
}

async function parseCharacter(rawData: ArrayBuffer): Promise<ParseResult<Character>> {
    logger?.debug("Parsing character card...", { size: rawData.byteLength });
    //decompress
    const decompressed = new DecompressionStream("deflate-raw");
    const writer = decompressed.writable.getWriter();
    await writer.write(rawData);
    await writer.close();

    //cbor decode
    const data = await readAll(decompressed.readable);
    const decoded = decoder.decode(data) as unknown;
    const result = await CharacterSchema.safeParseAsync(decoded);

    if (result.success) {
        logger?.info("Character parsed successfully", { id: result.data.id, name: result.data.name });
        return { success: true, data: result.data } satisfies ParseResult<Character>;
    }

    logger?.error("Failed to parse character", { error: result.error.message });
    return { success: false, error: "Failed to parse character" } satisfies ParseResult<Character>;
}
async function exportCharacter(character: Character): Promise<ArrayBufferLike> {
    logger?.debug("Exporting character card...", { id: character.id, name: character.name });
    const cbor = encoder.encode(character);
    const compressed = new CompressionStream("deflate-raw");
    const writer = compressed.writable.getWriter();
    await writer.write(cbor);
    await writer.close();
    const data = await readAll(compressed.readable);
    return transfer(data.buffer, [data.buffer]);
}

// exported for main ui's type inference
export const api = {
    parseCharacter,
    exportCharacter,
    setLogReceiver(receiver: LogBridgeReceiver) {
        logger = createLogBridgeSender(receiver);
        logger.info("Card parse worker connected to telemetry");
    },
};

expose(api);
