## 0. General Guidelines

Test should follow general TypeScript/Svelte guidelines.
Test should cover:
    - normal behavior
    - edge cases
    - invalid input
    - boundary values
    - unexpected states
    - TypeScript's type check, via Vitest's type assertion features. See [more](https://vitest.dev/guide/testing-types) and [more](https://github.com/mmkal/expect-type)

### Guidelines:

When using mocks, prefer `vi.mocked()` over direct casting to `any` for better type safety.
```typescript
import { vi } from 'vitest';
const myMockedFunction = vi.fn();

// Don't(it makes error on lint. Also, loses type safety and autocomplete.)
(myMockedFunction as any).mockReturnValue(42);

// Do:
vi.mocked(myMockedFunction).mockReturnValue(42);
```

## 1. General Logic Tests (Node.js)

Use these for your `.svelte.ts` files or pure TypeScript utility files. These tests run in Node.js for maximum speed. Since Svelte 5 runes are "universal," they can be tested without a browser if they don't touch the DOM.

### Guidelines:

- File Extension: Use `.test.ts`.
- Environment: Default (Node.js). A test that only needs `window` or `localStorage` (not a rendered component) can opt in to jsdom with a `// @vitest-environment jsdom` comment on its first line.
- Concurrency: High. Use `it.concurrent` freely as these should be stateless.

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
import { createCounter } from './math.svelte.ts';

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
import { fetchUserList } from './utils.ts';

describe('User List', () => {
    it.concurrent('should fetch user list', async () => {
        const users = await fetchUserList();
        expectTypeOf(users).toEqualTypeOf<User[]>();
        expect(users).toHaveLength(1);
    });
});
```
---

## 2. Component Tests (jsdom + Testing Library)

Use these for `.svelte` files. They run in [jsdom](https://github.com/jsdom/jsdom) (a DOM implementation in Node.js) through the `dom` Vitest project. There is no real browser in tests or CI.

### Guidelines:

- File Extension: Use `.test.ts` on `test/browser/` files. The `dom` project (see `scripts/testConfig.ts`) picks up `test/browser/**/*.test.ts` and sets the jsdom environment, so no `@vitest-environment` pragma is needed there. The directory keeps its old name from browser mode; the tests run in jsdom.
- Tooling: Use `render`, `screen`, `within`, `waitFor` and `fireEvent` from `@testing-library/svelte`, and `userEvent.setup()` from `@testing-library/user-event` for interactions. Matchers such as `toBeVisible()`, `toBeDisabled()`, `toHaveClass()` and `toHaveValue()` come from `@testing-library/jest-dom`, registered in `test/setup.dom.ts`. Rendered components are cleaned up after each test automatically (the `svelteTesting()` Vite plugin).
- Setup file: `test/setup.dom.ts` also fills the few jsdom gaps the tests hit (`<dialog>.showModal()`, `URL.createObjectURL`, `navigator.storage`). Add a polyfill there, with a comment saying why, only when a test really needs one.
- Props: Pass them as `render(Component, { props: { ... } })`. Props passed directly clash with Testing Library's own options when a prop is named `context`, `target` or `props`.
- Interactions: `await` every `user.click`, `user.type`, `user.keyboard`, ... call. `user.type` parses `{` and `[` as key descriptors, so use the `fillText(user, element, text)` helper from `@test/utils/user` (or `user.paste`) to put literal text such as JSON into a field. `user-event` cannot drive `<input type="range">`; dispatch the event with `await fireEvent.input(slider, { target: { value: "20" } })`.
- Async UI: Use `await screen.findBy*(...)` or `await waitFor(() => expect(...))` for anything that appears after a promise or a lazy import. Use `queryBy*` to assert that something is absent. A string `name` or text matches exactly and case-sensitively; use a regular expression for a partial match.
- Concurrency: Do not use `it.concurrent` here. All tests of a file share one `document`.
- A11y First: Prioritize `getByRole` above all else.
    - ❌ Avoid: `getByLabelText`, `getByText`, `getByTestId` (Use only as a last resort).
    - ✅ Prefer: `screen.getByRole('button', { name: 'Save' })` (Explicit selection based on the Accessibility Tree).
- Upgrade Selectors: Even if the user's provided example uses simple selectors, you must upgrade them to Accessibility (Role) based selectors in your final code.

### What jsdom cannot test

jsdom does no layout and loads no stylesheet. Anything that only means something in a real rendering engine cannot be measured:

- `getBoundingClientRect()`, `scrollHeight`, `clientWidth`, ... are always `0`.
- `getComputedStyle()` returns no Tailwind or DaisyUI styles, so colors, contrast and visibility that come from CSS are not computed.
- Images are never loaded, so `load`/`error` events never fire on their own. Dispatch them with `fireEvent.error(img)` when the handler is what is under test.
- There is no `Worker`, `Canvas`, `IntersectionObserver` or `ResizeObserver`.

Assert the classes and attributes that produce the behavior instead:

```typescript
// Don't (measures layout; always 0 in jsdom)
expect(textarea.getBoundingClientRect().height).toBeLessThanOrEqual(window.innerHeight * 0.4);

// Do (pins the classes that cap the height and make it scroll)
expect(textarea).toHaveClass('max-h-[40vh]', 'overflow-y-auto');
```

- Visibility: `toBeVisible()` cannot see elements hidden by CSS classes (DaisyUI tabs, collapse, `hidden` utilities), so it passes for them. Use `toBeInTheDocument()` for "is rendered", and keep `toBeVisible()` only where the `hidden` attribute, an inline style or `<dialog open>` decides visibility.
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

        // 3. Assert that it is rendered and its state
        expect(btn).toBeInTheDocument();

        // 4. Perform the interaction
        await user.click(btn);

        // 5. Assert result (assuming it changes text on click)
        expect(await screen.findByText('Clicked')).toBeInTheDocument();
    });
});

```

---

## 3. Advanced Rune Testing (Universal State)

If your component depends on a shared `$state` defined in a `.svelte.ts` file, you may need `flushSync` from `svelte` to ensure the DOM updates immediately during a test.

```typescript
import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { sharedState } from './store.svelte.ts';

it('updates UI when shared rune changes', () => {
    render(MyComponent);
    
    // Wrap state changes in flushSync to force immediate DOM update
    flushSync(() => {
        sharedState.value = 'new data';
    });
  
    expect(screen.getByText('new data')).toBeInTheDocument();
});

```
## 4. Advanced Testing & Mocking Guidelines

### 4.1. Avoid Early Fake Timers with Async Store Init Promises
If your stores rely on async initialization (`await store.initPromise`), do NOT use `vi.useFakeTimers()` early in `beforeEach` or before stores resolve. Doing so pauses microtask queues, preventing promises from resolving and triggering a test timeout.
- **Rule**: Safe loading defaults to real timers first. Enable `vi.useFakeTimers()` only *after* all stores have resolved their init promises.
- **Component tests**: do not combine `vi.useFakeTimers()` with `waitFor` or `findBy*`. Testing Library polls on a timer, so with fake timers the poll never fires and the test stalls until its timeout. To make a mocked LLM reply fast, pass `mockDelay: 0` to the `MOCK` provider (the delay is per streamed character) instead of advancing fake timers.

### 4.2. Preserve Svelte 5 Runes Reactivity on Arrays
When injecting mock data into reactive array stores (e.g. `chatStore.chats`), do NOT reassign the array (e.g. `store.chats = [newObj]`), as it breaks the reactivity bind.
- **Rule**: Use array mutation to preserve reactivity:
  ```typescript
  store.chats.length = 0;
  store.chats.push(mockObj);
  ```

### 4.3. Mocking Singleton Class Private Caches
If a resolver class caches adapter instances internally (e.g. `StorageResolver.chatAdapter`), simple function spies (`vi.spyOn`) will be bypassed if initialization has already run once.
- **Rule**: Overwrite the private cached static property directly before importing or initializing dependent stores:
  ```typescript
  StorageResolver["chatAdapter"] = mockAdapter;
  ```

### 4.4. Native Blocking Dialogs Prohibition (UX Protection)
To prevent degrading UX and blocking the browser main thread, native blocking dialogs (`window.alert()`, `window.confirm()`, and `window.prompt()`) are blocked by default in [setup.ts](file:///c:/Users/PC/Projects/etc/ArisuTalk/frontend/test/setup.ts).
- **Rule**: Native dialog calls without explicit test mocks will throw strict mode violations. Always implement high-quality custom Modal or Toast UI components instead.

---

## Documentation
- [Svelte testing docs](https://svelte.dev/docs/svelte/testing/llms.txt)
- [Vitest docs](https://vitest.dev/llms.txt)