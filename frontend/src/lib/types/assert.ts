/**
 * @file Compile-time assertion helpers.
 */

/**
 * Compile-time exhaustiveness check. Resolves to `true` when `Missing` is `never`.
 * Otherwise it resolves to `Missing` itself, so assigning `true` to it fails
 * and the error names the cases that are left out.
 * @example
 * const _allCovered: AssertNever<Exclude<Union, (typeof list)[number]>> = true;
 */
export type AssertNever<Missing> = [Missing] extends [never] ? true : Missing;
