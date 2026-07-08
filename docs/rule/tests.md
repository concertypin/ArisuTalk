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
- Environment: Default (Node.js).
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

## 2. Browser Component Tests (Playwright)

Use these for `.svelte` files. These tests run in a real browser, allowing you to test layout, real event bubbling, and browser-only APIs (like `IntersectionObserver`).

### Guidelines:

- File Extension: Use `.test.ts` on `test/browser/` files.
- Tooling: Use `vitest-browser-svelte` for rendering and `page` from `@vitest/browser/context` for interactions.
- Concurrency: Use `it.concurrent` carefully. `vitest-browser-svelte` isolates `render()`, but if you manipulate the global `window` object, use serial tests.
- A11y First: When using helpers returned by the `render` function, prioritize `getByRole` above all else.
    - ❌ Avoid: `getByLabelText`, `getByText` (Use only as a last resort).
    - ✅ Prefer: `getByRole('button', { name: 'Save' })` (Explicit selection based on the Accessibility Tree).
- Upgrade Selectors: Even if the user's provided example uses simple selectors, you must upgrade them to Accessibility (Role) based selectors in your final code.
```typescript
// Button.svelte.test.ts (The Component Test)
import { render } from 'vitest-browser-svelte';
import { page } from '@vitest/browser/context';
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

## 3. Advanced Rune Testing (Universal State)

If your component depends on a shared `$state` defined in a `.svelte.ts` file, you may need `flushSync` from `svelte` to ensure the DOM updates immediately during a test.

```typescript
import { flushSync } from 'svelte';
import { render } from 'vitest-browser-svelte';
import { sharedState } from './store.svelte.ts';

it('updates UI when shared rune changes', async () => {
    render(MyComponent);
    
    // Wrap state changes in flushSync to force immediate DOM update
    flushSync(() => {
        sharedState.value = 'new data';
    });
  
    await expect.element(page.getByText('new data')).toBeVisible();
});

```
## 4. Advanced Testing & Mocking Guidelines

### 4.1. Avoid Early Fake Timers with Async Store Init Promises
If your stores rely on async initialization (`await store.initPromise`), do NOT use `vi.useFakeTimers()` early in `beforeEach` or before stores resolve. Doing so pauses microtask queues, preventing promises from resolving and triggering a test timeout.
- **Rule**: Safe loading defaults to real timers first. Enable `vi.useFakeTimers()` only *after* all stores have resolved their init promises.

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