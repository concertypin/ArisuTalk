import RegexWorkerURL from "$worker/regex/main.ts?worker&url";
async function replace(
    input: string,
    ...pattern: (
        | {
              pattern: RegExp | string;
              replace: string;
          }
        | ((i: string) => string)
    )[]
): Promise<string> {
    const worker = new ComlinkWorker<typeof import("$worker/regex/main")>(
        new URL(RegexWorkerURL),
        {
            name: "ReplaceWorker",
        }
    );
    return worker.replace(input, ...pattern);
}
