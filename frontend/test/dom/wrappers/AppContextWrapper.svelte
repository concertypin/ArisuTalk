<!--
  @component AppContextWrapper
  Provides the app context to a component under test, so that components calling
  `getAppContext()` can be mounted without the whole `App.svelte`.
  Use `renderWithAppContext` instead of rendering this directly.
-->
<script lang="ts" generics="TProps extends Record<string, unknown>">
    import { untrack, type Component } from "svelte";
    import { setAppContext, type AppContext } from "@/context";

    const wrapperProps: {
        /** Component under test. */
        component: Component<TProps>;
        /** Props forwarded to the component under test. */
        props: TProps;
        /** Context made available through `getAppContext()`. */
        appContext: AppContext;
    } = $props();

    // The context object is registered once. Mutations on it stay reactive since the object
    // itself is a `$state` proxy, so reading the prop untracked is intended.
    setAppContext(untrack(() => wrapperProps.appContext));

    const Comp = $derived(wrapperProps.component);
</script>

<Comp {...wrapperProps.props} />
