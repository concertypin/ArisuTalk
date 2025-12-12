// worker.ts
import { type Character, CharacterSchema } from "@arisutalk/character-spec/v0/Character";
import { expose, transfer } from "comlink";
import { decode, encode } from "cbor-x";
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
async function readAll(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
    const chunks: Uint8Array[] = [];
    let totalLength = 0;
    const reader = stream.getReader();
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }
        chunks.push(value);
        totalLength += value.length;
    }

    const decompressedData = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
        decompressedData.set(chunk, offset);
        offset += chunk.length;
    }
    return decompressedData;
}

async function parseCharacter(rawData: ArrayBuffer): Promise<ParseResult<Character>> {
    //decompress
    const decompressed = new DecompressionStream("deflate-raw");
    decompressed.writable.getWriter().write(rawData);

    //cbor decode
    const data = await readAll(decompressed.readable);
    const cbor = decode(data);
    return (await CharacterSchema.safeParseAsync(cbor)) satisfies ParseResult<Character>;
}
async function exportCharacter(character: Character): Promise<ArrayBufferLike> {
    const cbor = encode(character);
    const compressed = new CompressionStream("deflate-raw");
    compressed.writable.getWriter().write(cbor);
    const data = await readAll(compressed.readable);
    return transfer(data.buffer, [data.buffer]);
}

// exported for main ui's type inference
export const api = {
    parseCharacter,
    exportCharacter,
};

expose(api);
