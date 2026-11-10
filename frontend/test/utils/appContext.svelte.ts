/**
 * @fileoverview Test helpers for components that read the app context via `getAppContext()`.
 */
import type { Component } from "svelte";
import { render } from "vitest-browser-svelte";
import { type AppContext } from "@/context";
import AppContextWrapper from "@test/browser/wrappers/AppContextWrapper.svelte";

/** Props of `AppContextWrapper` for a component under test taking `TProps`. */
type WrapperProps<TProps extends Record<string, unknown>> = {
    component: Component<TProps>;
    props: TProps;
    appContext: AppContext;
};

/**
 * Creates a reactive app context, the same shape `App.svelte` provides.
 * @param overrides - Fields to override on top of the closed-modals default.
 * @returns A deeply reactive context object. Components mutate it in place.
 */
export function createTestAppContext(overrides: Partial<AppContext> = {}): AppContext {
    const appContext: AppContext = $state({
        appSettingsOpen: false,
        characterSettingsOpen: false,
        editingCharacter: null,
        ...overrides,
    });
    return appContext;
}

/**
 * Renders a component with the app context available, like inside `App.svelte`.
 * @param component - Component under test.
 * @param props - Props passed to the component under test.
 * @param appContext - Context to provide. A closed-modals default is created when omitted.
 * @returns The `render` result, plus the `appContext` that was provided so tests can assert on it.
 */
export function renderWithAppContext<TProps extends Record<string, unknown>>(
    component: Component<TProps>,
    props: TProps,
    appContext: AppContext = createTestAppContext()
): ReturnType<typeof render> & { appContext: AppContext } {
    // Instantiate the generic wrapper for this component's props, so `render` does not fall back
    // to inferring `Record<string, unknown>` (components are contravariant in their props).
    const Wrapper: Component<WrapperProps<TProps>> = AppContextWrapper;
    const result = render(Wrapper, { props: { component, props, appContext } });
    return Object.assign(result, { appContext });
}
