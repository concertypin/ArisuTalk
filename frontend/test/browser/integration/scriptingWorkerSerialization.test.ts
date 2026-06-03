/// <reference types="vitest/browser" />

import * as Comlink from "comlink";
import { afterEach, describe, expect, it, vi } from "vitest";
import SerializationWorker from "./serializationWorker?worker";
import type { SerializationWorkerApi } from "./serializationWorker";

describe("Serialization worker boundary", () => {
    let worker: Worker | null = null;

    function createWorkerApi() {
        worker = new SerializationWorker();
        //Without assertion, TypeScript can't infer internal types of the API
        return Comlink.wrap<SerializationWorkerApi>(worker) as SerializationWorkerApi;
    }

    afterEach(() => {
        worker?.terminate();
        worker = null;
        vi.restoreAllMocks();
    });

    it("accepts structured-clone-safe payloads", async () => {
        const api = createWorkerApi();

        const msg = {
            createdAt: new Date("2026-05-31T00:00:00.000Z"),
            items: new Set([1, 2, 3]),
            message: {
                content: "hello",
                metadata: { nested: { count: 1 } },
            },
        };

        const response = await api.echo(msg);

        expect(response.message.content).toBe("hello");
        expect(response.createdAt).toBeInstanceOf(Date);
        expect(Array.from(response.items)).toEqual([1, 2, 3]);
    });

    it("rejects function values without Comlink.proxy", async () => {
        const api = createWorkerApi();

        await expect(api.echo(() => "nope")).rejects.toThrow();
    });

    it("forwards callbacks through a proxied receiver", async () => {
        const api = createWorkerApi();
        const receive = vi.fn();

        await api.callReceiver(
            Comlink.proxy({
                receive,
            })
        );

        expect(receive).toHaveBeenCalledWith("hello from worker");
    });
});
