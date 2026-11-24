import * as Comlink from "comlink";
import { afterEach, describe, expect, it, vi } from "vitest";

interface CallbackReceiver {
    receive(message: string): void;
}

type SerializationPayload = {
    createdAt: Date;
    items: Set<number>;
    message: { content: string; metadata: { nested: { count: number } } };
};

interface SerializationApi {
    echo(value: SerializationPayload): Promise<SerializationPayload>;
    echoAnything(value: unknown): Promise<unknown>;
    callReceiver(receiver: CallbackReceiver): Promise<void>;
}

/** The API a worker would expose through Comlink. */
const api: SerializationApi = {
    async echo(value) {
        return value;
    },

    async echoAnything(value) {
        return value;
    },

    async callReceiver(receiver) {
        await Promise.resolve(receiver.receive("hello from worker"));
    },
};

// No Worker in Node; a MessageChannel has the same structured-clone boundary.
describe("Comlink serialization boundary", () => {
    let channel: MessageChannel | null = null;

    function createApi(): Comlink.Remote<SerializationApi> {
        channel = new MessageChannel();
        Comlink.expose(api, channel.port1);
        return Comlink.wrap<SerializationApi>(channel.port2);
    }

    afterEach(() => {
        channel?.port1.close();
        channel?.port2.close();
        channel = null;
        vi.restoreAllMocks();
    });

    it("accepts structured-clone-safe payloads", async () => {
        const remote = createApi();

        const msg: SerializationPayload = {
            createdAt: new Date("2026-05-31T00:00:00.000Z"),
            items: new Set([1, 2, 3]),
            message: {
                content: "hello",
                metadata: { nested: { count: 1 } },
            },
        };

        const response = await remote.echo(msg);

        expect(response.message.content).toBe("hello");
        expect(response.createdAt).toBeInstanceOf(Date);
        expect(Array.from(response.items)).toEqual([1, 2, 3]);
    });

    it("rejects function values without Comlink.proxy", async () => {
        const remote = createApi();

        await expect(remote.echoAnything(() => "nope")).rejects.toThrow();
    });

    it("forwards callbacks through a proxied receiver", async () => {
        const remote = createApi();
        const receive = vi.fn();

        await remote.callReceiver(
            Comlink.proxy({
                receive,
            })
        );

        expect(receive).toHaveBeenCalledWith("hello from worker");
    });
});
