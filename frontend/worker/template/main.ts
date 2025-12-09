//Just export it, vite handles the rest
export function hello(to: string | undefined = undefined): string {
	return "Howdy from worker" + (to ? `, ${to}!` : "!");
}

export let theAnswer = 42;

/**
 * @example
```ts
import workerTemplateURL from "$worker/template/main.ts?worker&url";
async function helloWithWorker(): Promise<string> {
    const worker = new ComlinkWorker<typeof import("$worker/template/main")>(
        new URL(workerTemplateURL),{ name: "HelloWorker" }
    );
    return await worker.hello("UI Thread");
}
```
 */
