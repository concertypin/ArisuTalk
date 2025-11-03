export function replace(
    input: string,
    ...pattern: {
        pattern: RegExp | string;
        replace: string;
    }[]
) {
    let output = input;
    for (const i of pattern) {
        output = output.replace(i.pattern, i.replace);
    }
    return output;
}
