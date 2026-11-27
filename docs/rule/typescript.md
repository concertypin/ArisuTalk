It describes TypeScript rules for the project for readability.

> [!NOTE]
> This is not an absolute rule! If you have a good reason to break the rule, feel free to do it with proper justification in code review.

- [TL;DR](#tldr)
- [Detail](#detail)
  - [Write Essay for Code](#write-essay-for-code)
  - [Interface is not interface but interface](#interface-is-not-interface-but-interface)
  - [Anyone Dislikes `Any` as Much `as any`one](#anyone-dislikes-any-as-much-as-anyone)
  - [Lazy Dog Than The Quick Brown Fox](#lazy-dog-than-the-quick-brown-fox)
  - [Brain Can StackOverflow](#brain-can-stackoverflow)
  - [Constants Keep Their Shape](#constants-keep-their-shape)
  - [Leave No Case Behind](#leave-no-case-behind)
  - [Declare Functions, Don't Assign Them](#declare-functions-dont-assign-them)
  - [Comments](#comments)

## TL;DR

- Use `import type` when importing only types. [^1]
- Use alias imports (`@/` for `src/`, `@test/` for `test/`, `@worker/`, `@common/`) instead of relative paths. [^1] "../../../some.ts" is hard to read.
- [Write JSDoc comments for all exported functions and classes!](#write-essay-for-code)
- [Use `type` instead of `interface` where possible. `type` means type, `interface` means sometimes interface and sometimes type.](#interface-is-not-interface-but-interface)
- [Avoid using `any` type.](#anyone-dislikes-any-as-much-as-anyone)
- [Do not use `as` to make a type error go away. Annotate, fix the source type, narrow, or parse instead.](#anyone-dislikes-any-as-much-as-anyone)
- [Use `await import()`](#lazy-dog-than-the-quick-brown-fox) to lazy-load large modules.
- [Use named types instead of inline types on destructured parameters.](#brain-can-stackoverflow)
- [Write constant maps and lists with `as const satisfies T`, not a type annotation.](#constants-keep-their-shape)
- [Close `if`/`else` chains over a union with `x satisfies never`. Prefer `Record<Union, ...>` with `satisfies` over a list, and use `AssertNever` only when a list or its order matters.](#leave-no-case-behind)
- [Use `function` declarations for named functions, not arrow-function constants.](#declare-functions-dont-assign-them)
- [Use `/** */` for comments on declarations, no bold markup in JSDoc, and no thinking aloud in comments.](#comments)

## Detail

### Write Essay for Code

People don't want to read poorly written text.
<a href="https://www.reddit.com/r/Handwriting/comments/i6gie3/wrote_this_for_an_example_but_this_is_my_normal/"><img src="https://preview.redd.it/orblc7pv2yf51.jpg?width=1080&crop=smart&auto=webp&s=1ce00792cfcc1e15650b3a271ee29d8053786907" alt="Poorly handwritten text" width="300">
</a>

Better than above, right?

<a href="https://en.wikipedia.org/wiki/File:Kfontview.png">
<img src="https://upload.wikimedia.org/wikipedia/commons/6/65/Kfontview.png" alt="Well typed 'The quick brown fox jumps over the(stripped)'" width="300">
</a>

Same goes for code documentation. It helps others (and future you) understand the code better. All parameters, methods, classes, functions, etc... should have proper JSDoc comments, which are accessible on IDE hover.

```ts
// Don't(No JSDoc, long function signature)
export function dont({ id, name }: { id: number; name: string }) {
  console.log(id, name);
}

// Don't(it looks bad on JSDoc, since all parameters are documented on not type itself but function's JSDoc. Also, JSDoc declares types, but TypeScript does same thing with more power.)
/**
 * Performs a bad operation.
 * @param params - The parameters for the operation.
 * @param {number} params.id - The unique identifier.
 * @param {string} params.name - The name of the entity.
 */
export function dont2({ id, name }: { id: number; name: string }) {
  console.log(id, name);
}

// Do(since all parameters are documented and accessible on IDE hover, without opening its declaration)
type Params2 = {
  /**
   * The unique identifier.
   */
  id: number;
  /**
   * The name of the entity.
   */
  name: string;
};
/**
 * Performs a good operation with the given parameters.
 * @param params - The parameters for the operation.
 */
export function doGood({ id, name }: Params2) {
  console.log(id, name);
}
```

### Interface is not interface but interface

Sounds confusing? It is. In TypeScript, `interface` can be used both as a type and as an interface for classes. This dual purpose can lead to confusion about its intended use. Therefore, it's recommended to use `type` for defining types and reserve `interface` for defining class contracts only. This practice enhances code clarity and maintainability.

```ts
// Don't(It will be used as... what? Type or Interface? Guessing game starts here.)
interface User {
  id: number;
  name: string;
}
const user: User = { id: 1, name: "Alice" }; // It was used as type here.
class UserAccount implements User {
  // Answer: Both! 🤯
  constructor(
    public id: number,
    public name: string,
  ) {}
}

// Do(Clearer! It is clearly a type.)
type User = {
  id: number;
  name: string;
};
```

### Anyone Dislikes `Any` as Much `as any`one

Who knows what it really is? It's a mystery! Using `any` defeats the purpose of TypeScript, which is to provide type safety. Instead of `any`, use `unknown` when the type is not known at compile time. This forces you to perform type checks before using the value, enhancing code safety.
Also, `as` defeats the purpose of TypeScript's type safety: it tells the compiler to stop checking. Instead of casting, make the compiler verify the type:

- Annotate the variable, so the assignment is checked.
- Fix the return type of the function that produces the value.
- Parse external or untrusted data with a zod schema.
- Narrow with a type guard or `assert()`.
- Use `satisfies` for an object literal that must match a type. It only checks the value and keeps its narrow type. It never converts a value, so `doSomething() satisfies SomeType` does not make `data` a `SomeType`.

```ts
function doSomething(): OtherType {}
type SomeType = {
  value: string;
};
type OtherType = {
  value: string;
  notExist: number;
};
// Don't(It uses any type.)
const data = doSomething() as any;

// Don't(Declares type, but still uses `as`. Compiles even when the types do not match.)
const data = doSomething() as SomeType;

// Do(Annotation checks the assignment. Compile error if `OtherType` is not assignable to `SomeType`.)
const data: SomeType = doSomething();

// Do(External data: parse it. The type comes from the schema, not from a promise.)
import * as z from "zod";
const SomeSchema = z.object({ value: z.string() });
const parsed = SomeSchema.parse(JSON.parse(text));

// Do(Object literal: `satisfies` checks it and keeps the literal types.)
const options = { value: "a" } satisfies SomeType;
```

### Lazy Dog Than The Quick Brown Fox

When dealing with large modules that are not always needed, it's best to lazy-load them using `await import()`. This approach helps to optimize the initial load time of your application by deferring the loading of these modules until they are actually needed.

When to lazy load:

- It seems the module is large
- and the module is not always needed,
- or not gonna be used immediately(e.g., don't need on page load, but on function call, button click, etc...)

If you're going to use the module definitely, but not immediately, consider use `import()` without any additional handling on top level. Later `await import()` will be cached.

```ts
// Don't(It makes large module and this code packed together on bundling time.)
import { largeModule } from "large-module";
function useModule(dry: boolean) {
  if (dry) {
    console.log("Dry run, not using large module.");
    return;
  }
  largeModule.doSomething();
}
// Don't(Better than above, but still makes large module loaded on page load.)
import("large-module");
async function useModule(dry: boolean) {
  const { largeModule } = await import("large-module");
  if (dry) {
    console.log("Dry run, not using large module.");
    return;
  }
  largeModule.doSomething();
}

// Do(Lazy-loads large module only when needed.)
async function useModule(dry: boolean) {
  if (dry) {
    console.log("Dry run, not using large module.");
    return;
  }
  const { largeModule } = await import("large-module");
  largeModule.doSomething();
}
```

### Brain Can StackOverflow

(Not a website, just a pun about code readability)

Methods, functions, classes, etc... should be small. It is also applied to function signatures. If a function signature is too long, it can't be put on mind easily. It makes hard to read and understand the code. To avoid this, use named types instead of inline types on destructured parameters.

```ts
// Don't(Destructured parameters with inline types that are too long.)
function processData({
  id,
  name,
  age,
  address,
  phone,
  email,
}: {
  id: number;
  name: string;
  age: number;
  address: string;
  phone: string;
  email: string;
}) {
  console.log(id, name, age, address, phone, email);
}

// Do(Using named types for destructured parameters.)
type UserData = {
  /**
   * The unique identifier.
   */
  id: number;
  // So on...
  name: string;
  age: number;
  address: string;
  phone: string;
  email: string;
};
function processData({ id, name, age, address, phone, email }: UserData) {
  console.log(id, name, age, address, phone, email);
}

// Best(Simpler way is just don't destructure parameters.)
function processData(userData: UserData) {
  console.log(
    userData.id,
    userData.name,
    userData.age,
    userData.address,
    userData.phone,
    userData.email,
  );
}
```

### Constants Keep Their Shape

A type annotation on a constant widens it: the literal keys and values are forgotten, so `alertClass.info` is just a `string`, and a typo in a key is not an error. `as const satisfies T` checks the constant against `T` and keeps the narrow type.

```ts
// Don't(Widened to Record<string, string>. Every key is accepted, and no autocomplete.)
const alertClass: Record<string, string> = {
  info: "alert-info",
  error: "alert-error",
};

// Do(Checked against the type, but `alertClass.info` is still the literal "alert-info".)
const alertClass = {
  info: "alert-info",
  error: "alert-error",
} as const satisfies Record<string, string>;
```

### Leave No Case Behind

When code branches over every member of a union, make the compiler tell you when a new member shows up. End the `if`/`else` chain with `x satisfies never;`: it compiles only when all members were handled. oxlint and eslint accept it as a bare statement. Don't use `as never` or `as` anywhere here.

```ts
type Page = { type: "none" } | { type: "markdown"; text: string } | { type: "static" };

// Don't(`else` silently swallows the members that were added later.)
function render(page: Page) {
  if (page.type === "markdown") return page.text;
  else return "";
}

// Do(Adding a member to `Page` makes `page satisfies never` fail until it is handled.)
function render(page: Page) {
  if (page.type === "markdown") return page.text;
  if (page.type === "none" || page.type === "static") return "";
  page satisfies never;
  return "";
}
```

The same guarantee is wanted when a constant has to cover every member of a union. Prefer a `Record<Union, ...>` with `satisfies`: it fails to compile when a key is missing or unknown, and it needs no helper.

```ts
type HookType = "display" | "input" | "output" | "request";

// Do(Adding a member to `HookType` makes this fail until the new key is added.)
const hookLabel = {
  display: "Display",
  input: "Input",
  output: "Output",
  request: "Request",
} as const satisfies Record<HookType, string>;
```

Use `AssertNever` only when a list, or the order of its items, is what matters (e.g. a list of tabs for every hook type, shown in that order). `satisfies` on a list does not do it, since it accepts a list that misses members. `AssertNever` comes from [`@/lib/types/assert`](../../frontend/src/lib/types/assert.ts): give it the members the list leaves out. It resolves to `true` when there are none, so assigning `true` compiles. Otherwise the error names the missing members. Without a cast, and without a lint-disable comment:

```ts
import type { AssertNever } from "@/lib/types/assert";

// `HookType` is the union declared above.
const hookTypes = [
  { type: "display", label: "Display" },
  { type: "input", label: "Input" },
  { type: "output", label: "Output" },
  { type: "request", label: "Request" },
] as const satisfies { type: HookType; label: string }[];

// Fails with "Type 'true' is not assignable to type '"request"'" when `request` is removed above.
const _hookTypesCovered: AssertNever<Exclude<HookType, (typeof hookTypes)[number]["type"]>> = true;
```

### Declare Functions, Don't Assign Them

Declare named functions with `function`. They are hoisted, show their name in stack traces and are shorter. Keep arrow functions for inline callbacks.

```ts
// Don't
const loadPreviews = async () => {
  // ...
};

// Do
async function loadPreviews() {
  // ...
}

// Fine(Inline callback)
items.map((item) => item.id);
```

### Comments

- Write a comment that describes a declaration (a variable, function, type, field) as `/** ... */`, so IDEs show it on hover. A `//` comment is for a note about the code that follows it, such as why a workaround is needed.
- Don't use bold markup (`**Limitations:**`) in JSDoc. Plain text and lists are enough, and the markup is noise in IDE hovers.
- Don't think aloud in comments ("Maybe we should move it to top? No, keep the position."). Comments state what the code does and why, not the path the author took to it. Settle the question, then write down the result or nothing.

```ts
// Don't
// Order doesn't change on update usually, unless we want to move to top?
// No, keep position.

// Do(Only when the reader needs to know)
// An update keeps the character's position in the list.

// Don't
// Autosave: persist the settings shortly after any change.
let isFirstRun = true;

// Do
/** Autosave: persist the settings shortly after any change. */
let isFirstRun = true;
```

[^1]: This is automatically applied when you use VSCode with project settings.
