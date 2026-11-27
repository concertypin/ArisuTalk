# Magic Patterns

Magic Patterns are special patterns that can be used in the prompt to access character properties and current chatting log.
It is built every time when the prompt is used.

Patterns start with `{|` and ends with `|}`. Inner text is command. Multi-line is supported.

All patterns are interpreted, executed on sandboxed JavaScript engine, which means you can use any valid JavaScript syntax as long as it doesn't access outside of the sandbox.

After you write the pattern, you MUST use `return` statement to make the pattern return something! If you don't, it will return empty string.

There is no escape mechanism, and all `{|` and `|}` patterns will be treated as magic patterns. It can be escaped by using `{| return "{"+"|"; |}` or similar, using JavaScript string concatenation.

All properties are read-only, and you can't modify them. Use given functions to store outer data if exists.

## Magic Patterns Context

The following variables/functions are available in the context of magic patterns.

- [Safe Variables](https://github.com/nyariv/SandboxJS?tab=readme-ov-file#safe-globals) and [Safe Prototypes](https://github.com/nyariv/SandboxJS?tab=readme-ov-file#safe-prototypes) in SandboxJS.
- `console.log`: Logs a message to the console.
- `character`: The character object.
- `char`: Alias for `character.name`.
- `persona`: The user's persona object.
- `user`: Alias for `persona.name`.
- `chat(a, b)`: Function to access current chatting log from `a`-th to `b`-th. (0-indexed, start and end are inclusive)
  - Index 0 is always the **newest** message: 0 means the newest message, 1 means the second newest message, and so on.
  - Negative indexes count from the other end: -1 means the oldest message, -2 means the second oldest message, and so on.
  - The result lists the messages in the order the indexes go from `a` to `b`, so `a` greater than `b` gives the reverse order.
  - If `a` or `b` is out of range, it is clamped to the valid range.
  - Examples, for a history of `m1` (oldest) … `m5` (newest):
    - `chat(0, 0)` → `[m5]`
    - `chat(0, 2)` → `[m5, m4, m3]` (newest first)
    - `chat(2, 0)` → `[m3, m4, m5]` (oldest first)
    - `chat(-1, -2)` → `[m1, m2]`
    - `chat(-1, 0)` → `[m1, m2, m3, m4, m5]` (the whole history, oldest first)
    - `chat(0, 99)` → `[m5, m4, m3, m2, m1]`
- `sessionStorage`: `Record<string,string>` typed temporary storage, saved on [`window.sessionStorage`](https://developer.mozilla.org/docs/Web/API/Window/sessionStorage).
  - Doesn't provide any collision protection, so use unique keys.
    - This is intended to be used for communicating with other magic patterns in the same prompt, or even other prompts in the same session.
  - Data is cleared when the browser tab is closed.
