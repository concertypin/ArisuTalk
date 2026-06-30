It describes Svelte rules for the project.

> [!NOTE]
> This is not an absolute rule! If you have a good reason to break the rule, feel free to do it with proper justification in code review.

- [TL;DR](#tldr)
  - [Detail](#detail)
    - [Svelte 5 is alive](#svelte-5-is-alive)
    - [Fly me to the `moon.ts`](#fly-me-to-the-moonts)
    - [Don't Ship Elephant on Bicycle](#dont-ship-elephant-on-bicycle)
    - [Documentation](#documentation)

## TL;DR


- [Prefer extracting complex logic to `.ts` files to benefit from fast `oxlint` linting.](#fly-me-to-the-moonts)
- [If the components which doesn't need to be rendered immediately(e.g., modals, dropdowns, etc...), use dynamic imports with `import()` to reduce initial bundle size.](#dont-ship-elephant-on-bicycle)

### Detail

### Svelte 5 is alive
> [!NOTE]
> These rules are already enforced by tooling/config.
> - `<script lang="ts">` is enforced by `svelte/block-lang` via [ESLint](../../frontend/eslint.config.ts).
> - Svelte 4 syntax such as `export let` and `$:` is rejected by `runes: true` in [`svelte.config.js`](../../frontend/svelte.config.js).

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

### Fly me to the `moon.ts`

We use `oxlint` to lint pure TypeScript code blazing fast. However, `oxlint` currently doesn't cover `.svelte` and `.svelte.ts` files, so we still rely on the relatively slower `eslint` for them.

To maximize linting performance and maintain separation of concerns, prefer extracting complex business logic, data transformations, or helper functions into pure `.ts` files rather than `.svelte` or `.svelte.ts` files.

You don't need to be absolute about this—small UI logic inside components is perfectly fine. But if a function or state logic starts growing, move it out so `oxlint` can do its fast job!

```svelte
<!-- Don't(Complex data transformation inside component) -->
<script lang="ts">
    let users = $state<User[]>([]);
    
        
    function longlongFunction() {
        // Imagine this function has 100 lines of complex logic!
    }
    function evenLongerFunction() {
        // 10^100 lines of code 💀
    }
    let activeVIPs = $derived(
        users
            .filter(u => u.isActive && u.level > 10)
            .map(u => (...))
    );
</script>

<ul>
    {#each activeVIPs as vip}
        <li>{vip.displayName}</li>
    {/each}
</ul>

<!-- Do(Move heavy logic to pure .ts) -->

<!-- userUtils.ts -->
export function longlongFunction() { }
export function evenLongerFunction() { 
    // 10^100 lines of code 💀,
    // but since it's pure ts file and linted by oxlint,
    // it's less problematic.
 }
export function getActiveVIPs(users: User[]) { ... }

<!-- Component.svelte -->
<script lang="ts">
    import { getActiveVIPs, longlongFunction } from "./userUtils";
    
    let users = $state<User[]>([]);
    let activeVIPs = $derived(getActiveVIPs(users));
</script>

<ul>
    {#each activeVIPs as vip}
        <li>{vip.displayName}</li>
    {/each}
</ul>
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
