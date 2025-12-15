// worker.ts
import { type Character, CharacterSchema } from "@arisutalk/character-spec/v0/Character";
import { expose, transfer } from "comlink";
import { Decoder, Encoder, FLOAT32_OPTIONS } from "cbor-x";
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
        return { success: true, data: result.data } satisfies ParseResult<Character>;
    }

    return { success: false } satisfies ParseResult<Character>;
}
async function exportCharacter(character: Character): Promise<ArrayBufferLike> {
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
};

expose(api);
