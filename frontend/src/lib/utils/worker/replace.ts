import RegexWorkerURL from "$root/../worker/regex/main?worker&url";

type WorkerType = InstanceType<
	typeof ComlinkWorker<typeof import("$root/../worker/regex/main")>
>;

let replaceWorker: null | WorkerType;

/**
 * Utility to replace patterns in strings using a web worker.
 * Keep in mind that put pattern as much as possible in single worker call
 * to reduce overhead of worker communication & UI thread blocking.
 * @param input input string.
 * @param pattern patterns to replace, object with pattern and replace string.
 * @returns Replaced string.
 */
export async function replace(
	input: string,
	...pattern: {
		pattern: RegExp | string;
		replace: string;
		caseSensitive?: boolean;
	}[]
): Promise<string> {
	try {
		if (!replaceWorker) {
			replaceWorker = new ComlinkWorker(new URL(RegexWorkerURL), {
				name: "ReplaceWorker",
			});
		}
		return replaceWorker.replace(input, ...pattern);
	} catch (e) {
		console.error("Error in replace worker:", e);
		return input;
	}
}
