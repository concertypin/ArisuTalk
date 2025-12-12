export interface ExampleWorkerApi {
    /**
     * simple greeting method
     * @param name - The name to greet
     */
    greet(name: string): Promise<string>;

    /**
     * Performs a heavy calculation to demonstrate async work
     * @param n - The number to calculate fibonacci for
     */
    fibonacci(n: number): Promise<number>;
}
