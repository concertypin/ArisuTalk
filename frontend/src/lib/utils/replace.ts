import RegexWorkerURL from "$worker/regex/main.ts?worker&url";
/**
 * Utility to replace patterns in strings using a web worker.
 * Keep in mind that put pattern as much as possible in single worker call
 * to reduce overhead of worker communication & UI thread blocking.
 * @param input input string.
 * @param pattern patterns to replace. Can be either object with pattern and replace string, or function that takes string and returns string.
 * @returns Replaced string.
 */
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
