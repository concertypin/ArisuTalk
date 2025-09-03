
import Sandbox from '@nyariv/sandboxjs';

/**
 * Parses and executes magic patterns in a string.
 * @param {string} template - The string template with magic patterns.
 * @param {object} context - The context to be available in the sandbox.
 * @returns {Promise<string>} The populated string.
 */
export async function parseMagicPatterns(template, context) {
  if (!template) return '';

  const sandbox = new Sandbox();
  const pattern = /{\|([\s\S]*?)\|}/g;

  const promises = [];

  template.replace(pattern, (match, code) => {
    const promise = new Promise(async (resolve) => {
      try {
        const result = await sandbox.compileAsync(code)(context).run();

        if (typeof result === 'string')
          resolve(result);
        else if (result?.toString)
          resolve(result.toString());
        else if (!result)
          resolve("") // Handle null/undefined/falses
        else
          resolve("")// Fallback to empty string if no toString method(it likely is error)

      } catch (error) {
        console.error('Error executing magic pattern:', error);
        resolve("");  // On error, replace with an empty string
      }
    });
    promises.push(promise);
  });

  const results = await Promise.allSettled(promises);

  return template.replace(pattern, () => results.shift());
}
