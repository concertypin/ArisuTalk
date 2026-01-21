import type { Character } from "@arisutalk/character-spec/v0/Character";
import { iterableToStream, logger, readAll } from "@worker/cardparse/shared";
import { encodeAsIterable } from "cbor-x";
import { transfer } from "comlink";

export async function exportCharacter(character: Character): Promise<ArrayBuffer> {
    logger?.debug("Exporting character card...", { id: character.id, name: character.name });

    const encoded = encodeAsIterable(character);
    const encodedPipe = iterableToStream(encoded);

    const compressed = encodedPipe.pipeThrough(new CompressionStream("deflate-raw"));
    //const compressed = encodedPipe;
    const data = await readAll(compressed);

    return transfer(data.buffer, [data.buffer]);
}
