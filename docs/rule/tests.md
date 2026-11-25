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
- Environment: Default (Node.js).
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

## Browser Component Tests (Playwright)

Use these for `.svelte` files. These tests run in a real browser, allowing you to test layout, real event bubbling, and browser-only APIs (like `IntersectionObserver`).

- File Extension: Use `.test.ts` on `test/browser/` files.
- Tooling: Use `vitest-browser-svelte` for rendering and `page` from `vitest/browser` for interactions.
- Concurrency: Follow [Concurrency](#concurrency). `vitest-browser-svelte` isolates `render()`, but if you manipulate the global `window` object, use serial tests.
- A11y First: Pick locators in this order, and move to the next only when the previous one cannot identify the element.
  1. `getByRole('button', { name: 'Save' })`: explicit selection based on the Accessibility Tree.
  2. `getByLabelText` / `getByText`: for elements without a useful role, such as plain text.
  3. `getByTestId`: last resort, for elements that have no role, label or text, such as a decorative element (add `data-testid` to the component).
- Locators, not the DOM: do not reach into the DOM with `container.querySelector`. Use locators and `expect.element(...)`, which retry until the page settles. `container.querySelector(...)` returns a snapshot, forces `as` casts, and needs hand-written `vi.waitFor` loops.
- Selecting by tag or class (as some older tests and examples do) is not a locator. Rewrite it to one of the above.

```typescript
// Button.svelte.test.ts (The Component Test)
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { it, expect, describe } from 'vitest';
import Button from './Button.svelte';

describe('Button Component', () => {
    it.concurrent('should render with snippet content and handle clicks', async () => {
        // 1. Render the component
        const { getByRole, getByText } = render(Button, { 
          props: { label: 'Click Me' } 
        });
        
        // 2. Locate using ARIA roles (best practice)
        const btn = getByRole('button', { name: /click me/i });
        
        // 3. Assert visibility and state
        await expect.element(btn).toBeVisible();
        
        // 4. Perform real browser interaction
        await btn.click();
        
        // 5. Assert result (assuming it changes text on click)
        await expect.element(getByText('Clicked')).toBeInTheDocument();
    });
});

```

---

## Advanced Rune Testing (Universal State)

If your component depends on a shared `$state` defined in a `.svelte.ts` file, you may need `flushSync` from `svelte` to ensure the DOM updates immediately during a test.

```typescript
import { it, expect } from 'vitest';
import { flushSync } from 'svelte';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import MyComponent from './MyComponent.svelte';
import { sharedState } from './store.svelte';

it('updates UI when shared rune changes', async () => {
    render(MyComponent);
    
    // Wrap state changes in flushSync to force immediate DOM update
    flushSync(() => {
        sharedState.value = 'new data';
    });
  
    await expect.element(page.getByText('new data')).toBeVisible();
});

```

## Advanced Testing & Mocking Guidelines

### Avoid Early Fake Timers with Async Store Init Promises

If your stores rely on async initialization (`await store.initPromise`), do NOT use `vi.useFakeTimers()` early in `beforeEach` or before stores resolve. Doing so pauses microtask queues, preventing promises from resolving and triggering a test timeout.

- Rule: Safe loading defaults to real timers first. Enable `vi.useFakeTimers()` only _after_ all stores have resolved their init promises.
- Browser tests: do not combine fake timers with `expect.element` or locator polling. Polling retries on timers, so with fake timers it stalls until the test timeout on slow runners (as in CI). To make a mocked LLM reply fast, pass `mockDelay: 0` to the `MOCK` provider (the delay is per streamed character) instead of advancing fake timers.

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
