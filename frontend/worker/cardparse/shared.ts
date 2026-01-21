import type { createLogBridgeSender } from "@common/logger/LogBridge";

export type ParseResult<T> =
    | {
          success: true;
          data: T;
      }
    | {
          success: false;
          error?: string;
      };

type Logger = ReturnType<typeof createLogBridgeSender>;
export let logger: Logger | null = null;

export function setLogger(l: Logger) {
    logger = l;
    return l;
}

export function iterableToStream(
    chunks: Iterable<Uint8Array | Blob | AsyncIterable<Buffer>>
): ReadableStream {
    const iterator = chunks[Symbol.iterator]();
    return new ReadableStream({
        async start(controller) {
            while (true) {
                const next = iterator.next();
                if (next.done) break;

                const value = next.value;

                // Uint8Array (Buffer in Node.js) - most common case from cbor-x
                if (value instanceof Uint8Array) {
                    controller.enqueue(
                        new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
                    );
                }
                // Blob
                else if (value instanceof Blob) {
                    const buffer = await value.arrayBuffer();
                    controller.enqueue(new Uint8Array(buffer));
                }
                // AsyncIterable<Uint8Array>
                else {
                    for await (const chunk of value) {
                        controller.enqueue(
                            new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
                        );
                    }
                }
            }
            controller.close();
        },
    });
}
export async function readAll(
    stream: ReadableStream<Uint8Array<ArrayBuffer>>
): Promise<Uint8Array<ArrayBuffer>> {
    const buffer = await new Response(stream).arrayBuffer();
    return new Uint8Array(buffer);
}
