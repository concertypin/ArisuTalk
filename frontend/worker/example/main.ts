import * as Comlink from "comlink";
import type { ExampleWorkerApi } from "./types";

export const api: ExampleWorkerApi = {
    async greet(name: string): Promise<string> {
        return `Hello, ${name}! This message is from a Web Worker.`;
    },

    async fibonacci(n: number): Promise<number> {
        if (n <= 1) return n;

        // simple recursive implementation nicely simulates 'heavy' work
        const fib = (x: number): number => {
            if (x <= 1) return x;
            return fib(x - 1) + fib(x - 2);
        };

        return fib(n);
    },
};

Comlink.expose(api);
