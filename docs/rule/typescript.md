It describes TypeScript rules for the project for readability.

> [!NOTE]
> This is not absolute rule! If you have a good reason to break the rule, feel free to do it with proper justification in code review.

- [TL;DR](#tldr)
- [Detail](#detail)
  - [Write Essay for Code](#write-essay-for-code)
  - [Interface is not interface but interface](#interface-is-not-interface-but-interface)
  - [Anyone Dislikes `Any` as Much `as unknown`one](#anyone-dislikes-any-as-much-as-unknownone)
  - [Lazy Dog Than The Quick Brown Fox](#lazy-dog-than-the-quick-brown-fox)
  - [Brain Can StackOverflow](#brain-can-stackoverflow)

## TL;DR

- Use `import type` when importing only types. [^1]
- Use absolute path imports starting from `src/` folder. [^1] "../../../some.ts" is hard to read.
- [Use `type` instead of `interface` where possible. `type` means type, `interface` means sometimes interface and sometimes type.](#interface-is-not-interface-but-interface)
- [Avoid using `any` type.](#anyone-dislikes-any-as-much-as-unknownone)
- [Use `satisfies` instead of `as` for type assertions where possible.](#anyone-dislikes-any-as-much-as-unknownone)
- [Write JSDoc comments for all exported functions and classes!](#write-essay-for-code)
- [Use named types instead of inline types on destructured parameters.](#brain-can-stackoverflow)
- [Use `await import()`](#lazy-dog-than-the-quick-brown-fox) to lazy-load large modules.

## Detail

### Write Essay for Code

People don't want to read poorly written text.
<a href="https://www.reddit.com/r/Handwriting/comments/i6gie3/wrote_this_for_an_example_but_this_is_my_normal/"><img src="https://preview.redd.it/orblc7pv2yf51.jpg?width=1080&crop=smart&auto=webp&s=1ce00792cfcc1e15650b3a271ee29d8053786907" alt="Poorly handwritten text">
</a>

Better than above, right?

<a href="https://en.wikipedia.org/wiki/File:Kfontview.png">
<img src="https://upload.wikimedia.org/wikipedia/commons/6/65/Kfontview.png" alt="Well typed 'The quick brown fox jumps over the(stripped)'">
</a>

Same goes for code documentation. It helps others (and future you) understand the code better. All parameters, methods, classes, functions, etc... should have proper JSDoc comments, which can accessible on IDE hover.

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

### Anyone Dislikes `Any` as Much `as unknown`one

Who knows what it really is? It's a mystery! Using `any` defeats the purpose of TypeScript, which is to provide type safety. Instead of `any`, use `unknown` when the type is not known at compile time. This forces you to perform type checks before using the value, enhancing code safety.
Also, `as` defeats the purpose of TypeScript's type safety. Use `satisfies` instead, which ensures that the value conforms to the specified type without losing type information.

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

// Don't(Declares type, but still uses `as`.)
const data = doSomething() as SomeType;

// Do(Uses `satisfies` to ensure type compatibility without losing type information.)
const data = doSomething() satisfies SomeType; // Will cause compile error if incompatible. Good!
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

[^1]: This is automatically applied when you use VSCode with project settings.
