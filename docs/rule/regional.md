# Regional Convention
This is a regional convention for ArisuTalk.

## Using Schema
If you need to define a variable defined with Zod schema, use `apply` function to autofill default values.

```ts
declare function doSomething(char: Character);
// Worst: No default values, not type-checked on initialization.
const char = {
    name: "",
    description: "",
}
// Error message will be hard to read, like "Type (long type signature) is not assignable to type (another long type signature)"
doSomething(char);


// Don't: You should write all default values, not to make compiler error
import type { Character } from "@arisutalk/character-spec/v0/Character";
const char: Character = {
    name: "",
    description: "",
}


// Don't: Schema.parse gets parameter as `any`, not compile-time type-checked & no autocomplete
import { CharacterSchema } from "@arisutalk/character-spec/v0/Character";
const char = CharacterSchema.parse({
    name: "",
    description: "",
})

// Do: `apply` function autofills default values, and autocompletes required fields
import { CharacterSchema } from "@arisutalk/character-spec/v0/Character";
import { apply } from "@arisutalk/character-spec/utils";
// This will make an error, due to lack of required fields. Good!
const char = apply(CharacterSchema, {
    name: "",
    description: "",
})
```