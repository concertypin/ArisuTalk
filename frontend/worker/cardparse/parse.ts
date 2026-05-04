import { CharacterSchema, type Character } from "@arisutalk/character-spec/v0/Character";
import { logger, readAll, type ParseResult } from "@worker/cardparse/shared";
import { decode } from "cbor-x";
import { transfer } from "comlink";

export async function parseCharacter(rawData: ArrayBuffer): Promise<ParseResult<Character>> {
    logger?.debug("Parsing character card...", { size: rawData.byteLength });
    //decompress
    const decompressed = new DecompressionStream("deflate-raw");
    const decom = new Blob([rawData]).stream().pipeThrough(decompressed);

    //cbor decode
    const data = await readAll(decom);
    const decoded: unknown = decode(data);

    const result = await CharacterSchema.safeParseAsync(decoded);

    if (result.success) {
        logger?.info("Character parsed successfully", {
            id: result.data.id,
            name: result.data.name,
        });
        const transferables = result.data.assets.assets.flatMap((i) =>
            i.data instanceof Uint8Array ? [i.data.buffer] : []
        );
        return transfer(
            { success: true, data: result.data } satisfies ParseResult<Character>,
            transferables
        );
    }

    logger?.error("Failed to parse character", { error: result.error.message });
    return { success: false, error: "Failed to parse character" } satisfies ParseResult<Character>;
}
