## 0. General Guidelines

Test should follow general TypeScript/Svelte guidelines.
Test should cover:
    - normal behavior
    - edge cases
    - invalid input
    - boundary values
    - unexpected states
    - TypeScript's type check, via Vitest's type assertion features. See [more](https://vitest.dev/guide/testing-types) and [more](https://github.com/mmkal/expect-type)

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

## Documentation
- [Svelte testing docs](https://svelte.dev/docs/svelte/testing/llms.txt)
- [Vitest docs](https://vitest.dev/llms.txt)