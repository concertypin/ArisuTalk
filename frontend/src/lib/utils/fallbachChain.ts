//list of functions (may has different return types) that will be called one by one until one of them succeeds
//if one function throws an error, the next function will be called
//if a function returns a value, the chain stops and the value is returned
//if all functions throw errors, the last error is thrown
//return value type is one of the function return types
type NotUndefined<T> = T extends undefined ? never : T;

abstract class FallbackChainBase<T> {
    protected funcs: (() => T)[];
    protected fallbackValue: T | undefined;
    constructor(...funcs: (() => T)[]) {
        this.funcs = funcs;
    }
    add(...funcs: (() => T)[]): this {
        this.funcs.push(...funcs);
        return this;
    }
    fallback(value: NotUndefined<T>): this {
        if (value === undefined) {
            throw new Error(
                "Fallback value cannot be undefined, as it is treated as failure."
            );
        }

        this.fallbackValue = value;
        return this;
    }
}

class FallbackChainImpl<T> extends FallbackChainBase<T> {
    /**
     * Run the fallback chain.
     * @param fallback Optional fallback value to return if all functions fail.
     * @returns The result of the first successful function or the fallback value.
     * @throws Error if all functions fail and no fallback is provided.
     */
    run(printError: boolean = true): T {
        for (let i = 0; i < this.funcs.length; i++) {
            const func = this.funcs[i];
            try {
                const result = func();
                if (result !== undefined) return result;
                else {
                    if (printError) {
                        console.error(
                            `FallbackChain Error(depth ${i}): returned undefined`
                        );
                    }
                }
            } catch (e) {
                if (printError) {
                    console.error(`FallbackChain Error(depth ${i}):`, e);
                }
            }
        }
        if (this.fallbackValue !== undefined) {
            return this.fallbackValue;
        }
        throw new Error("All functions in FallbackChain failed");
    }
}

class FallbackChainAsyncImpl<T> extends FallbackChainBase<Promise<T> | T> {
    /**
     * Run the asynchronous fallback chain.
     * @param fallback Optional fallback value to return if all functions fail.
     * @returns A promise that resolves to the result of the first successful function or the fallback value.
     * @throws Error if all functions fail and no fallback is provided.
     */
    async run(
        printError: boolean = true
    ): Promise<T | (typeof this.fallbackValue extends T ? T : never)> {
        for (let i = 0; i < this.funcs.length; i++) {
            const func = this.funcs[i];
            try {
                const result = await func();
                if (result !== undefined) return result;
                else {
                    if (printError) {
                        console.error(
                            `FallbackChainAsync Error(depth ${i}): returned undefined`
                        );
                    }
                }
            } catch (e) {
                if (printError) {
                    console.error(`FallbackChainAsync Error(depth ${i}):`, e);
                }
            }
        }
        if (this.fallbackValue !== undefined) {
            return this.fallbackValue;
        }
        throw new Error("All functions in FallbackChainAsync failed");
    }
    fallback(value: NotUndefined<T>): this {
        if (value instanceof Promise) {
            throw new Error("Fallback value cannot be a Promise.");
        }
        return super.fallback(value);
    }
}
/**
 * Create a synchronous fallback chain.
 * @param funcs Functions to be executed in order until one succeeds. Return type should not be undefined, since it will be treated as failure.
 * @returns An instance of FallbackChainImpl.
 * @see FallbackChainImpl
 */
export function fallbackChain<T>(...funcs: (() => T)[]): FallbackChainImpl<T> {
    return new FallbackChainImpl(...funcs);
}

/**
 * Create an asynchronous fallback chain.
 * @param funcs Asynchronous functions to be executed in order until one succeeds. Return type should not be Promise<undefined>, since it will be treated as failure.
 * @returns An instance of FallbackChainAsyncImpl.
 * @see FallbackChainAsyncImpl
 */
export function fallbackChainAsync<T>(
    ...funcs: (() => Promise<T>)[]
): FallbackChainAsyncImpl<T> {
    return new FallbackChainAsyncImpl(...funcs);
}

// Type aliases for backward compatibility if needed
//export type FallbackChain<T> = FallbackChainImpl<T>;
//export type FallbackChainAsync<T> = FallbackChainAsyncImpl<T>;
