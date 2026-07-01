import { expect, type Mocked } from "vitest";

/**
 * Creates a strict object proxy that makes tests fail
 * when accessing unimplemented properties.
 * It doesn't stop execution, but records a soft failure in Vitest.
 * @template Target The target object type, which defines all expected properties.
 * @param obj The partial object to wrap in a strict proxy.
 * @returns A proxy that enforces strict property access.
 */
export function strictObject<const Target extends object>(obj: NoInfer<Partial<Target>>): Target {
    return new Proxy<Target>(obj as unknown as Target, {
        get(target: Target, prop, receiver) {
            if (prop in target) {
                return Reflect.get(target, prop, receiver);
            }
            // Allow common Symbol and protocol properties for runtime compatibility
            if (typeof prop === "symbol" || prop === "then" || prop === "toJSON") {
                return undefined;
            }
            expect
                .soft(false, `Property ${String(prop)} is not implemented on strict object.`)
                .toBeTruthy();
        },
    });
}

/**
 * Shorthand to create a strict mocked object.
 * @see strictObject
 * @template Target The target mocked object type.
 * @param obj The partial mocked object to wrap in a strict proxy.
 * @returns A proxy that enforces strict property access on the mocked object.
 */
export function strictMock<const Target extends object>(
    obj: NoInfer<Partial<Mocked<Target>>>
): Mocked<Target> {
    return strictObject<Mocked<Target>>(obj);
}
