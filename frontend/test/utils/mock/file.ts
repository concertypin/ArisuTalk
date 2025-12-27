import { vi } from "vitest";
type FileMockOptions = {
    /**
     * The content of the mock file as an ArrayBuffer.
     */
    content: ArrayBuffer;
    /**
     * Optional File properties to override the defaults.
     */
    option?: Partial<File>;
};

/**
 * Creates a mock File object for testing purposes.
 * @param param0 - Object containing content and optional File properties.
 * @returns A mock File object.
 */
export function mockFile({ content, option }: FileMockOptions): File {
    return {
        ...option,
        arrayBuffer: vi.fn().mockResolvedValue(content),
        bytes: vi.fn().mockResolvedValue(new Uint8Array(content)),
        slice() {
            return this satisfies Blob;
        },
        lastModified: Date.now(),

        name: "mockfile.char",
        size: content.byteLength,
        stream() {
            const readable = new ReadableStream<Uint8Array>({
                start(controller) {
                    const chunk = new Uint8Array(content);
                    controller.enqueue(chunk);
                    controller.close();
                },
            });
            return readable as ReadableStream<Uint8Array<ArrayBuffer>>;
        },
        text: vi.fn().mockResolvedValue(new TextDecoder().decode(content)),
        type: "application/octet-stream",
        webkitRelativePath: "",
    } satisfies File;
}
