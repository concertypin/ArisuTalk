It describes Svelte rules for the project.

> [!NOTE]
> This is not an absolute rule! If you have a good reason to break the rule, feel free to do it with proper justification in code review.

- [TL;DR](#tldr)
- [Detail](#detail)
  - [Svelte 5 is alive](#svelte-5-is-alive)
  - [Dealing with heavy components](#dont-ship-elephant-on-bicycle)

## TL;DR

- Use `<script lang="ts">` for all Svelte components.
- [This is a Svelte 5 project! Don't use Svelte 4's syntax. No more `export let`!](#svelte-5-is-alive)
- [Avoid using `$:` reactive statements. It's not used anymore in Svelte 5.](#svelte-5-is-alive)
- [If the components which doesn't need to be rendered immediately(e.g., modals, dropdowns, etc...), use dynamic imports with `import()` to reduce initial bundle size.](#dont-ship-elephant-on-bicycle)

### Detail

### Svelte 5 is alive

According to version number, Svelte 5 is 1.25 times better than Svelte 4!

...Just kidding. Svelte 5 represents Runes-based reactivity system, which doesn't hide magic-`export let` behavior and `$:` reactive statements anymore. Instead, it introduces explicit state management with `$state` and `$derived`.

```svelte
<!-- Don't(Svelte 4 syntax) -->
<script>
    export let name: string;
    $: hello = `Hello ${name}!`;
</script>
<h1>{hello}</h1>

<!-- Don't(Svelte 5 style, but no TypeScript) -->
<script>
    let name=$state("");
    let hello=$derived(`Hello ${name}!`);
</script>
<h1>{hello}</h1>

<!-- Do(Svelte 5 syntax with TypeScript) -->
<script lang="ts">
    let name=$state<string>("");
    let hello=$derived(`Hello ${name}!`);
</script>
<h1>{hello}</h1>
```

### Don't Ship Elephant on Bicycle

When dealing with heavy components that are not immediately necessary, such as modals or dropdowns, it's best to load them dynamically. This approach helps to optimize the initial load time of your application by deferring the loading of these components until they are actually needed.

Check out the TypeScript's rules [here](./typescript.md#lazy-dog-than-the-quick-brown-fox).

```svelte
<!-- Don't(Importing component statically) -->
<script lang="ts">
    import HeavyModal from "./HeavyModal.svelte";
    let showModal = $state(false);
</script>
{#if showModal}
    <HeavyModal />
{/if}

<!-- Do(Dynamically importing component, stores the Promise) -->
<script lang="ts">
    // 1. Store the Promise, not the component itself.
    let loadPromise = $state<Promise<any> | null>(null);

    const show = () => {
        // Just assign the import promise!
        loadPromise = import("./HeavyModal.svelte");
    };
</script>

<button onclick={show}>
    Open Modal
</button>

{#if loadPromise}
    {#await loadPromise}
        <p>Loading...</p>
    {:then { default: HeavyModal }}
        <HeavyModal
            onclose={() => loadPromise = null}
        />
    {:catch error}
        <p>Error loading component: {error.message}</p>
    {/await}
{/if}

<!--Do(Lazy load components. There is no loading state here.)-->
{#await import("./HeavyModal.svelte") then { default: HeavyModal }}
	<HeavyModal />
{/await}
```

### Documentation

- Svelte: [for human](https://svelte.dev/docs/svelte/overview), [for LLM](https://svelte.dev/llms.txt)
