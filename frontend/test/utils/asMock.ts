// Disabled rules are necessary for the generic typing used in this utility.
// asMock's generic type T uses 'any' in its constraints.
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Mock } from "vitest";

/**
 * Casts a function or class to a Vitest Mock type.
 * Actually just a type cast, no runtime changes.
 * @param m - The function or class to cast.
 * @returns The input cast as a Vitest Mock.
 */
export function asMock<
    const T extends
        | ((...args: any[]) => any)
        | {
              new (...args: any[]): any;
          },
>(m: T): Mock<T> {
    return m as Mock<typeof m>;
}

export default asMock;
