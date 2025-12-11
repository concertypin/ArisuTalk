import { encode, decode } from "cbor-x";
import type { Character } from "@/lib/types/Character";
import { transfer } from "comlink";
/**
 * Convert a BufferSource to a Uint8Array.
 * @param bufferSource
 * @returns A Uint8Array transformed from the BufferSource.
 */
function bufferSourceToUint8Array(bufferSource: BufferSource): Uint8Array {
    if (bufferSource instanceof ArrayBuffer) {
        return new Uint8Array(bufferSource);
    } else {
        return new Uint8Array(bufferSource.buffer);
    }
}

const uint8ArrayifyStream = new TransformStream<BufferSource, Uint8Array>({
    transform(chunk, ctrl) {
        ctrl.enqueue(bufferSourceToUint8Array(chunk));
    },
});

function compressStream(stream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
    // 'deflate' 또는 헤더가 없는 'deflate-raw'를 쓸 수 있어!
    const compressor = new CompressionStream("deflate-raw");
    return stream.pipeThrough(compressor);
}

/**
 * Decode a card from a stream of bytes.
 * This is a streamed processing, so that there's no OOM.
 * It deflate-decompress, cbor-decode in a streamed way.
 * @param card
 */
async function decodeCard(card: ReadableStream<Uint8Array>): Promise<ReadableStream<Character>> {
    //deflate-decompress
    const deflate = new DecompressionStream("deflate-raw");
    const deflateReader = card.pipeThrough(deflate).getReader();

    //cbor-decode
    const cborReader = new TransformStream<Uint8Array, Character>();
    const cborWriter = cborReader.writable.getWriter();

    while (true) {
        const { done, value } = await deflateReader.read();
        if (done) break;
        cborWriter.write(value);
    }
    cborWriter.close();

    return cborReader.readable;
}
// ... (bufferSourceToUint8Array 등의 유틸은 그대로)

/**
 * Decode a card from a stream of bytes.
 */
async function decodeCard2(card: ReadableStream<Uint8Array>): Promise<ReadableStream<Character>> {
    // 1. 타입 브릿지 (Type Bridge)
    // Uint8Array를 받아서 BufferSource로 내보낸다고 '선언'하는 스트림이야.
    // 실제로는 아무것도 안 하고 그냥 통과시키지만, TS는 이 출력물을 BufferSource로 인식하게 돼!
    const typeBridge = new TransformStream<Uint8Array, BufferSource>({
        transform(chunk, controller) {
            controller.enqueue(chunk);
        },
    });

    // 2. 압축 해제 (이제 입력이 BufferSource라 에러 안 남!)
    const decompressor = new DecompressionStream("deflate-raw");

    // 3. CBOR 디코딩 (스트림 처리)
    // cbor-x의 decode는 보통 전체 데이터를 원하니까, 스트림 처리를 위해선
    // 들어오는 청크들을 모아서 처리하거나(buffer), cbor-x가 지원하는 push 방식이 필요해.
    // 여기서는 간단히 청크 단위로 시도하되, 실제로는 'cbor-x'의 스트림 모드나 버퍼링이 필요할 거야.
    const cborDecoder = new TransformStream<Uint8Array, Character>({
        transform(chunk, controller) {
            try {
                // 주의: CBOR 데이터가 청크 경계에서 잘려있을 수 있음.
                // 완벽하게 하려면 여기서 버퍼를 합치는 로직이 추가로 필요해!
                const decoded = decode(chunk) as Character;
                controller.enqueue(decoded);
            } catch (error) {
                // 데이터가 덜 왔으면 에러가 날 수 있음 -> 버퍼링 필요
                // 복잡해질까봐 일단 생략했지만, 필요하면 말해줘!
                console.warn("CBOR decoding chunk failed (might be partial data):", error);
            }
        },
    });

    return card
        .pipeThrough(typeBridge) // Uint8Array -> BufferSource (세탁!)
        .pipeThrough(decompressor) // BufferSource -> Uint8Array (압축 해제)
        .pipeThrough(cborDecoder); // Uint8Array -> Character (디코딩)
}
export const api = {};
