/**
 * @fileoverview Template reference worker — NOT used in production.
 *
 * This worker serves as a copy-paste template for creating new Web Workers.
 * When adding a new worker type:
 *   1. Copy this directory
 *   2. Rename files and the API interface
 *   3. Implement your logic
 *   4. Add a factory in workerClient.ts
 *
 * It is excluded from coverage since it has no production usage.
 * The tests for this worker test the Comlink infrastructure pattern.
 */

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
