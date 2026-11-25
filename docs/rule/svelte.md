It describes Svelte rules for the project.

> [!NOTE]
> This is not an absolute rule! If you have a good reason to break the rule, feel free to do it with proper justification in code review.

- [TL;DR](#tldr)
- [Detail](#detail)
  - [Svelte 5 is alive](#svelte-5-is-alive)
  - [Fly me to the `moon.ts`](#fly-me-to-the-moonts)
  - [Don't Ship Elephant on Bicycle](#dont-ship-elephant-on-bicycle)
  - [Name Your Props](#name-your-props)
  - [Module Scripts Are Not Import Lists](#module-scripts-are-not-import-lists)
  - [Forms Submit Forms](#forms-submit-forms)
  - [Class Lists](#class-lists)
  - [Documentation](#documentation)

## TL;DR

- [Prefer extracting complex logic to `.ts` files to benefit from fast `oxlint` linting.](#fly-me-to-the-moonts)
- [Components that are not needed immediately (modals, dropdowns, ...) should be loaded with `import()` to reduce the initial bundle size.](#dont-ship-elephant-on-bicycle)
- [Declare props with a named `Props` type, then destructure `$props()` with it.](#name-your-props)
- [Don't use `<script module>` only for imports. Imports are already hoisted. Keep it for state shared by all instances or work done once.](#module-scripts-are-not-import-lists)
- [Inputs that submit on Enter live in a `<form>`.](#forms-submit-forms)
- [Keep class lists readable: write each condition once instead of a wall of `class:` directives.](#class-lists)

## Detail

### Svelte 5 is alive

> [!NOTE]
> These rules are already enforced by tooling/config.
>
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
    let loadPromise = $state<Promise<typeof import("./HeavyModal.svelte")> | null>(null);

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

### Name Your Props

Declare the props as a `type Props`, then destructure `$props()` with it. The destructuring stays short, and the prop documentation lives on the type, so it shows on IDE hover. This is the Svelte version of [named types for destructured parameters](./typescript.md#brain-can-stackoverflow).

```svelte
<!-- Don't(Inline type: the destructured names and their docs are mixed up and hard to scan) -->
<script lang="ts">
    let {
        onSubmit,
        disabled = false,
    }: {
        /** Called with the message text. */
        onSubmit: (s: string) => void;
        disabled?: boolean;
    } = $props();
</script>

<!-- Do -->
<script lang="ts">
    type Props = {
        /** Called with the message text. */
        onSubmit: (s: string) => void;
        disabled?: boolean;
    };
    let { onSubmit, disabled = false }: Props = $props();
</script>
```

### Module Scripts Are Not Import Lists

Svelte hoists the imports of an instance `<script>` out of the component function, and an ES module is evaluated only once, so imports never run per component instance. A `<script module>` that only holds imports adds nothing but a second script block.

Use `<script module>` for what is really module-level: state shared by all instances of the component, or work that should be done once, not per instance (building a regex, creating a parser). A trivial constant, such as a small class-name map, may stay in the instance script: it costs nothing per instance, and keeping it next to its only user reads better than a second script block.

```svelte
<!-- Don't(Nothing here is module-level) -->
<script lang="ts" module>
    import { chatStore } from "@/features/chat/stores/chatStore.svelte";
</script>
<script lang="ts">
    let messages = $derived(chatStore.activeMessages);
</script>

<!-- Do(Imports go into the one script) -->
<script lang="ts">
    import { chatStore } from "@/features/chat/stores/chatStore.svelte";
    let messages = $derived(chatStore.activeMessages);
</script>

<!-- Do(Module-level on purpose: the cache is shared by every instance) -->
<script lang="ts" module>
    let cached: Component | null = null;
</script>
```

### Forms Submit Forms

An input that submits on Enter should be a `<form>` with `onsubmit`, not a bare element with a key handler that does the work. The browser then gives the send button, the Enter key and assistive technology the same path. The `onsubmit` handler calls `event.preventDefault()`, so the browser does not navigate away from the page. For a `<textarea>`, where Enter inserts a new line by default, call `form.requestSubmit()` from the key handler on plain Enter. Shift+Enter keeps the new line, and Enter that commits an IME composition (`event.isComposing`) must not submit.

```svelte
<script lang="ts">
    let form = $state<HTMLFormElement>();

    function onKeyDown(event: KeyboardEvent) {
        if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
        event.preventDefault();
        form?.requestSubmit();
    }

    function handleSubmit(event: SubmitEvent) {
        event.preventDefault();
        // Send the message.
    }
</script>

<form bind:this={form} onsubmit={handleSubmit}>
    <textarea onkeydown={onKeyDown}></textarea>
    <button type="submit">Send</button>
</form>
```

### Class Lists

The goal is a class list you can read at a glance. When classes depend on a condition, write the condition once and group the classes it switches, instead of a wall of `class:name={condition}` directives that repeat the same condition per class. Svelte accepts arrays and objects in `class`, which is the simplest way to do this.

String concatenation works too, but `+` binds tighter than `? :`, so `"base " + active ? "a" : "b"` evaluates as `("base " + active) ? "a" : "b"` and drops the base classes. Wrap the ternary in parentheses, or use the array form, which has no such trap.

```svelte
<!-- Don't(One directive per class, and the same condition is repeated) -->
<span
    class="absolute left-0 w-1"
    class:h-8={active}
    class:opacity-100={active}
    class:h-2={!active}
    class:opacity-0={!active}
></span>

<!-- Do -->
<span
    class={[
        "absolute left-0 w-1",
        active ? "h-8 opacity-100" : "h-2 opacity-0",
    ]}
></span>

<!-- Also fine: the ternary is parenthesized -->
<span class={"absolute left-0 w-1 " + (active ? "h-8 opacity-100" : "h-2 opacity-0")}></span>
```

### Documentation

- Svelte: [for human](https://svelte.dev/docs/svelte/overview), [for LLM](https://svelte.dev/llms.txt)
