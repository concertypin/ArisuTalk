It describes how to validate data, and how to add your data schema.

## TL;DR
- Zod is used for data validation.
- Schemas and inferred types are defined in `src/lib/types`.
- JSDoc is used on schemas too.


## Detail
### JSDoc

- Don't use z.somewhat().describe() or z.somewhat().meta() for JSDoc.
    - Why? It is unavailable on IDE. Primary goal of JSDoc is to be available on IDE.
    - Instead, use JSDoc on schema's property. It works.
- Describe whether it is for who.
    - Human readable means it is for end-user.
    - AI readable means it is for AI, used in prompt.
    - System readable means it is for system, used in code. Not for AI nor end-user.
- If it's string for AI, describe whether it is scriptable.
    - Scriptable means it might contain JS script and not yet executed. When it is executed, it will be replaced with result and become not scriptable.
    - Not scriptable means it can be used as-is.

```ts

/**
 * @see {@link Character} - Since we will write JSDoc on type(not schema), we'll use `see` only.
 */
export const CharacterSchema = z.object({
    /**
     * Unique identifier for the character.
     */
    id: z.string(),
    /**
     * The display name of the character.
     * Human readable, not scriptable.
     */
    name: z.string(),
    /**
     * A short description of the character.
     * Human readable, not scriptable.
     */
    description: z.string(),
});

/**
 * Represents a specific AI character personality.
 * Here, we use JSDoc on type.
 * Don't have to link original schema, since type definition is simple with z.infer<typeof schema>.
 */
export type Character = z.infer<typeof CharacterSchema>;
```