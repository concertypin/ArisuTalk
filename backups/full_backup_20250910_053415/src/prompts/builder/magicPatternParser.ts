
import Sandbox from '@nyariv/sandboxjs';

/**
 * Parses and executes magic patterns in a string.
 * @param template - The string template with magic patterns.
 * @param context The context to be available in the sandbox.
 * @returns The populated string.
 */
export async function parseMagicPatterns(template: string, context: object): Promise<string> {
  if (!template) return '';
  const pattern = /{\|([\s\S]*?)\|}/g;

  const promises: Promise<string>[] = [];
  const e = template.matchAll(pattern)
  for (const i of e) {
    const code = i.at(1)
    if (code) //Push valid code into queue
      promises.push(runMagicPattern(code, context));
    else //Push empty for invalid code (it exists for ensureing order)
      promises.push(Promise.resolve(""));
  }
  const results = await Promise.all(promises);

  //We can ensure that results size is always equal to the number of patterns found
  //But typescript complains about it, so we use or-operator to supress the error
  //ts-ignore is not cool, right?
  return template.replace(pattern, () => results.shift() || '');
}

/**
 * Executes a single magic pattern code string within a sandboxed environment.
 * The environment is generated per call.
 * Returns the result as a string, or an empty string if execution fails or the result is not convertible to string.
 *
 * @param code - The code string to execute inside the sandbox.
 * @param context - An object providing context variables for the sandbox execution.
 * @returns A promise that resolves to the result of the code execution as a string.
 */
async function runMagicPattern(code: string, context: object): Promise<string> {
  const sandbox = new Sandbox();
  return new Promise<string>((resolve) => {
    sandbox.compileAsync<any>(code)(context).run()
      .then(i => {
        if (typeof i === 'string')
          resolve(i);
        else if (typeof i?.toString === 'function')
          resolve(i.toString() as string);
        else if (!i)
          resolve("") // Handle null/undefined/falses
        else
          resolve("")// Fallback to empty string if no toString method(it likely is error)

      })
      .catch((error) => {
        console.error('Error executing magic pattern:', error);
        resolve("");  // On error, replace with an empty string
      })
  });
}