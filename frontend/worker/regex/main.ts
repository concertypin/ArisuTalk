export function replace(
    input: string,
    ...pattern: (
        | {
              pattern: RegExp | string;
              replace: string;
          }
        | ((i: string) => string)
    )[]
) {
    let output = input;
    for (const i of pattern) {
        if (typeof i === "function") output = i(output);
        else output = output.replace(i.pattern, i.replace);
    }
    return output;
}
