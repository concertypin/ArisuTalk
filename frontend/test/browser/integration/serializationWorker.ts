import * as Comlink from "comlink";

export interface CallbackReceiver {
    receive(message: string): void;
}

export interface SerializationWorkerApi {
    echo<const T>(value: T): Promise<T>;
    callReceiver(receiver: CallbackReceiver): Promise<void>;
}

const api: SerializationWorkerApi = {
    async echo<const T>(value: T): Promise<T> {
        return value;
    },

    async callReceiver(receiver: CallbackReceiver): Promise<void> {
        await Promise.resolve(receiver.receive("hello from worker"));
    },
};

Comlink.expose(api);
