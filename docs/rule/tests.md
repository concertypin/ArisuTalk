## General Guidelines

Test should follow general TypeScript/Svelte guidelines.
Test should cover:
- normal behavior
- edge cases
- invalid input
- boundary values
- unexpected states
- TypeScript's type check, via Vitest's type assertion features. See [more](https://vitest.dev/guide/testing-types) and [more](https://github.com/mmkal/expect-type)

### Mocks

When using mocks, prefer `vi.mocked()` over direct casting to `any` for better type safety.

```typescript
import { vi } from 'vitest';
const myMockedFunction = vi.fn();

// Don't(it makes error on lint. Also, loses type safety and autocomplete.)
(myMockedFunction as any).mockReturnValue(42);

// Do:
vi.mocked(myMockedFunction).mockReturnValue(42);
```

Give a mock its signature as a type argument instead of checking it afterwards with `satisfies`. Mock objects stand in for a real type with `satisfies Partial<Mocked<T>>`, so a renamed or retyped member of `T` breaks the test, and the object still contains only the members the test needs.

```typescript
import { vi, type Mocked } from 'vitest';

// Don't(the mock itself is still typed as Mock<Procedure>, so calls and assertions are unchecked.)
const onClick = vi.fn() satisfies () => void;

// Do:
const onClick = vi.fn<() => void>();

// Do(mock object)
const mockStore = {
    sendMessage: vi.fn(),
    initPromise: Promise.resolve(),
} satisfies Partial<Mocked<typeof chatStore>>;
```

## General Logic Tests (Node.js)

Use these for your `.svelte.ts` files or pure TypeScript utility files. These tests run in Node.js for maximum speed. Since Svelte 5 runes are "universal," they can be tested without a browser if they don't touch the DOM.

- File Extension: Use `.test.ts`.
- Environment: Default (Node.js). A test that only needs `window` or `localStorage` (not a rendered component) can opt in to jsdom with a `// @vitest-environment jsdom` comment on its first line.
- Concurrency: Use `.concurrent` only for tests that share no state. See [Concurrency](#concurrency) for what counts as shared state.

```typescript
// math.svelte.ts (The Logic)
export function createCounter() {
    let count = $state(0);
    const double = $derived(count * 2);
    return {
        get count() { return count },
        get double() { return double },
        increment: () => count++
    };
}

// math.test.ts (The Test)
import { describe, it, expect } from 'vitest';
import { createCounter } from './math.svelte';

describe('Counter Logic', () => {
    it.concurrent('should increment reactive state', () => {
        const counter = createCounter();
        expect(counter.count).toBe(0);
        
        counter.increment();
        expect(counter.count).toBe(1);
        expect(counter.double).toBe(2);
    });
});

```

```typescript
// utils.ts (Pure TypeScript logic)
export async function fetchUserList(): Promise<User[]> {
  return [{ id: 1, name: 'Ms. Example' }];
}

// utils.test.ts (The Test)
import { describe, it, expect, expectTypeOf } from 'vitest';
import { fetchUserList } from './utils';

describe('User List', () => {
    it.concurrent('should fetch user list', async () => {
        const users = await fetchUserList();
        expectTypeOf(users).toEqualTypeOf<User[]>();
        expect(users).toHaveLength(1);
    });
});
```

---

## Browser Component Tests (jsdom + Testing Library)

Use these for `.svelte` files. The `browser` Vitest project emulates a browser with [jsdom](https://github.com/jsdom/jsdom) (a DOM implementation in Node.js); no real browser runs in tests or CI.

- File Extension: Use `.test.ts` on `test/browser/` files. The `browser` project (see `scripts/testConfig.ts`) picks up `test/browser/**/*.test.ts` and sets the jsdom environment, so no `@vitest-environment` pragma is needed there.
- Tooling: Use `render`, `screen`, `within`, `waitFor` and `fireEvent` from `@testing-library/svelte`, and `userEvent.setup()` from `@testing-library/user-event` for interactions. Matchers such as `toBeVisible()`, `toBeDisabled()`, `toHaveClass()` and `toHaveValue()` come from `@testing-library/jest-dom`, registered in `test/setup.browser.ts`. Rendered components are cleaned up after each test automatically (the `svelteTesting()` Vite plugin).
- Setup file: `test/setup.browser.ts` also fills the few jsdom gaps the tests hit (`<dialog>.showModal()`, `URL.createObjectURL`, `navigator.storage`) and installs the `setHTML` polyfill, because jsdom has no HTML Sanitizer API. Add a polyfill there, with a comment saying why, only when a test really needs one.
- Props: Pass them as `render(Component, { props: { ... } })`. Props passed directly clash with Testing Library's own options when a prop is named `context`, `target` or `props`.
- Interactions: `await` every `user.click`, `user.type`, `user.keyboard`, ... call. `user.type` parses `{` and `[` as key descriptors, so use the `fillText(user, element, text)` helper from `@test/utils/user` (or `user.paste`) to put literal text such as JSON into a field. `user-event` cannot drive `<input type="range">`; dispatch the event with `await fireEvent.input(slider, { target: { value: "20" } })`.
- Async UI: Use `await screen.findBy*(...)` or `await waitFor(() => expect(...))` for anything that appears after a promise or a lazy import. Use `queryBy*` to assert that something is absent. A string `name` or text matches exactly and case-sensitively; use a regular expression for a partial match.
- Concurrency: Follow [Concurrency](#concurrency). All tests of a file share one `document`, and rendered components are cleaned up between tests, so do not use `.concurrent` here.
- A11y First: Pick queries in this order, and move to the next only when the previous one cannot identify the element.
  1. `getByRole('button', { name: 'Save' })`: explicit selection based on the Accessibility Tree.
  2. `getByLabelText` / `getByText`: for elements without a useful role, such as plain text.
  3. `getByTestId`: last resort, for elements that have no role, label or text, such as a decorative element (add `data-testid` to the component).
- Queries, not the DOM: do not reach into the DOM with `container.querySelector`. Use Testing Library queries (`screen.getBy*`, `within(...)`) and `findBy*` / `waitFor(...)`, which retry until the page settles. `container.querySelector(...)` returns a snapshot, forces `as` casts, and needs hand-written polling loops.
- Selecting by tag or class (as some older tests and examples do) is not a query. Rewrite it to one of the above, even when the example you were given uses a simple selector.

### What jsdom Cannot DOMinate

jsdom does no layout, loads no stylesheet and leaves out parts of the web platform; see [Unimplemented parts of the web platform](https://github.com/jsdom/jsdom#unimplemented-parts-of-the-web-platform). Anything that only means something in a real rendering engine cannot be measured. Assert the classes and attributes that produce the behavior instead:

```typescript
// Don't (measures layout; always 0 in jsdom)
expect(textarea.getBoundingClientRect().height).toBeLessThanOrEqual(window.innerHeight * 0.4);

// Do (pins the classes that cap the height and make it scroll)
expect(textarea).toHaveClass('max-h-[40vh]', 'overflow-y-auto');
```

- Visibility: `toBeVisible()` cannot see elements hidden by CSS classes (DaisyUI tabs, collapse, `hidden` utilities), so it passes for them. Use `toBeInTheDocument()` for "is rendered", and keep `toBeVisible()` only where the `hidden` attribute, an inline style or `<dialog open>` decides visibility.
- Native `setHTML`: jsdom has no HTML Sanitizer API, so only the polyfill runs there. Tests of the native sanitizer skip themselves when `hasNativeSetHTML` from `@test/utils/setHTML` is false, instead of failing or faking the native API.
- Soft checks: for a signal that is unreliable without a real browser (colors, for example), use `softTest` from `@test/utils/softTest` and wrap the `expect` in `warn`. A failed assertion is reported as a "warning" annotation (a warning on the PR in CI) instead of failing the test; any other error still fails it. Keep the other assertions as plain `expect`, and start the test name with "soft color check".

```typescript
softTest('soft color check: primary color class', ({ warn }) => {
    render(TextArea, { props: { color: 'primary' } });
    expect(screen.getByRole('textbox')).toHaveClass('textarea'); // hard: fails the test
    warn(() => expect(screen.getByRole('textbox')).toHaveClass('textarea-primary')); // soft: warns only
});
```

```typescript
// Button.svelte.test.ts (The Component Test)
import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { it, expect, describe } from 'vitest';
import Button from './Button.svelte';

describe('Button Component', () => {
    it('should render with snippet content and handle clicks', async () => {
        const user = userEvent.setup();

        // 1. Render the component
        render(Button, { props: { label: 'Click Me' } });

        // 2. Locate using ARIA roles (best practice)
        const btn = screen.getByRole('button', { name: /click me/i });

        // 3. Assert its state (getByRole already throws when the button is missing)
        expect(btn).toBeEnabled();

        // 4. Perform the interaction
        await user.click(btn);

        // 5. Assert result (assuming it changes text on click)
        expect(await screen.findByText('Clicked')).toBeVisible();
    });
});

```

---

## Advanced Rune Testing (Universal State)

If your component reads `$state` defined in a `.svelte.ts` file, use `flushSync` from `svelte` to apply a state change to the DOM immediately during a test.

Create that state inside the test and hand it to the component, rather than mutating a module-level singleton. A singleton keeps its value from one test to the next, so tests start depending on their order. When a component can only read a singleton store, reset the store in `beforeEach`.

```typescript
import { it, expect } from 'vitest';
import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { createCounter } from '@/lib/stores/counter.svelte';
import Counter from '@/components/Counter.svelte';

it('updates the UI when the state changes', () => {
    const counter = createCounter(); // fresh state for this test only
    render(Counter, { props: { counter } });

    // flushSync applies the change to the DOM before the assertion
    flushSync(() => {
        counter.value = 1;
    });

    expect(screen.getByText('1')).toBeVisible();
});
```

## Advanced Testing & Mocking Guidelines

### Avoid Early Fake Timers with Async Store Init Promises

If your stores rely on async initialization (`await store.initPromise`), do NOT use `vi.useFakeTimers()` early in `beforeEach` or before stores resolve. Doing so pauses microtask queues, preventing promises from resolving and triggering a test timeout.

- Rule: Safe loading defaults to real timers first. Enable `vi.useFakeTimers()` only _after_ all stores have resolved their init promises.
- Component tests: do not combine `vi.useFakeTimers()` with `waitFor` or `findBy*`. Testing Library polls on a timer, so with fake timers the poll never fires and the test stalls until its timeout. To make a mocked LLM reply fast, pass `mockDelay: 0` to the `MOCK` provider (the delay is per streamed character) instead of advancing fake timers.

### Preserve Svelte 5 Runes Reactivity on Arrays

When injecting mock data into reactive array stores (e.g. `chatStore.chats`), do NOT reassign the array (e.g. `store.chats = [newObj]`), as it breaks the reactivity bind.

- Rule: Use array mutation to preserve reactivity:
  ```typescript
  store.chats.length = 0;
  store.chats.push(mockObj);
  ```

### Mocking Singleton Class Private Caches

If a resolver class caches adapter instances internally (e.g. `StorageResolver.chatAdapter`), simple function spies (`vi.spyOn`) will be bypassed if initialization has already run once.

- Rule: Overwrite the private cached static property directly before importing or initializing dependent stores:
  ```typescript
  StorageResolver["chatAdapter"] = mockAdapter;
  ```
  Bracket access is the supported way for a test to assign a `private` member: TypeScript allows `obj["member"]` on private members, so no cast is needed. Do not use it in production code.

### Native Blocking Dialogs Prohibition (UX Protection)

To prevent degrading UX and blocking the browser main thread, native blocking dialogs (`window.alert()`, `window.confirm()`, and `window.prompt()`) are blocked by default in [setup.ts](../../frontend/test/setup.ts).

- Rule: Native dialog calls without explicit test mocks will throw strict mode violations. Always implement high-quality custom Modal or Toast UI components instead.

---

## Writing Meaningful Tests

### Test our decisions, not the library

Do not write tests that only exercise a library: a zod enum accepts one of its values, a schema field exists, a value in range parses back, DOMPurify strips a `<script>`. Those fail only when the library breaks, and they say nothing about our code. Test what we decided: defaults, the bounds we chose (a value just outside is rejected, a boundary value is accepted), id formats, and that our code calls the library with the right arguments (wiring).

### Fixtures

- Build characters (and other schema types) with `apply(CharacterSchema, {...})` from `@arisutalk/character-spec/utils`, or with a shared fixture such as `createTestCharacter()` in [`test/utils/character.ts`](../../frontend/test/utils/character.ts). Do not hand-write every field of a `Character`: it duplicates the schema defaults and breaks on every schema change. See [Using Schema](./regional.md#using-schema).
- A fixture used by several tests in a file is declared once at the top of the file or `describe`, not repeated in each test. This is fine for fixtures that tests only read. When tests mutate it, build a fresh one per test (`beforeEach`, or a factory function).
- Use Korean for non-ASCII sample text. Do not use Chinese or Japanese. A Hangul syllable is 3 bytes in UTF-8 like a CJK character, so byte-based assertions stay the same.

### Concurrency

Use `.concurrent` only for tests that share no state: no global spies or stubs (`vi.spyOn(globalThis, "fetch")`, `vi.stubGlobal`, `localStorage`), no shared stores or singletons, no `let` variable assigned in a `beforeEach`, no module-level mock objects whose calls are asserted. Concurrent tests interleave at every `await`, so any shared state is a race. Put `.concurrent` in one place only: on the `describe`, or on each `test`, not both.

Exception: tests whose bodies are fully synchronous (no `await`) cannot interleave, so they may share state if each test sets up the state it reads at its start (for example `test/unit/lib/theme.test.ts`, which stubs its own `matchMedia`). Drop `.concurrent` as soon as such a test gains an `await`.

### Cleanup

Restore global state with `onTestFinished()` right where the state is changed, instead of `try`/`finally`. The cleanup then sits next to the change, and it still runs when an assertion fails.

```typescript
import { onTestFinished, vi } from 'vitest';

// Don't
it('does not write the pin list', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    try {
        // ...
    } finally {
        setItemSpy.mockRestore();
    }
});

// Do
it('does not write the pin list', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    onTestFinished(() => setItemSpy.mockRestore());
    // ...
});
```

## Documentation

- [Svelte testing docs](https://svelte.dev/docs/svelte/testing/llms.txt)
- [Vitest docs](https://vitest.dev/llms.txt)
