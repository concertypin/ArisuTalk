# Magic Patterns

Magic Patterns are special patterns that can be used in the prompt to access character properties and current chatting log.
It is built every time when the prompt is used.

Patterns start with `{|` and ends with `|}`. Inner text is command. Multi-line is supported.

All patterns are interpreted, executed on sandboxed JavsaScript engine, which means you can use any valid JavaScript syntax as long as it doesn't access outside of the sandbox.

After you write the pattern, you MUST use `return` statement to make the pattern return something! If you don't, it will return empty string.

There are no escape mechanism, and all `{|` and `|}` patterns will be treated as magic patterns.

All properties are read-only, and you can't modify them.

## Magic Patterns Context

The following variables/functions are available in the context of magic patterns.

- [Safe Variables](https://github.com/nyariv/SandboxJS?tab=readme-ov-file#safe-globals) and [Safe Prototypes](https://github.com/nyariv/SandboxJS?tab=readme-ov-file#safe-prototypes) in SandboxJS.
- `console.log`: Logs a message to the console.
- `character`: The character object.
- `char`: Alias for `character.name`.
- `persona`: The user's persona object.
- `user`: Alias for `persona.name`.
- `chat(a, b)`: Function to access current chatting log from `a`-th to `b`-th. (0-indexed, inclusive, inclusive)
  - 0 means the newest element, 1 means second newest element, and so on.
  - negative index is allowed, like python. -1 means oldest element, -2 means second oldest element, and so on.
  - `a` can be grater than `b`, in that case, it means reverse order.
  - if `a` or `b` is out of range, it will be clamped to the valid range.
- `sessionStorage`: Same as [`window.sessionStorage`](https://developer.mozilla.org/ko/docs/Web/API/Window/sessionStorage). It can be used as a temporary variable storage (since the context is re-created every time).
  - It doesn't provide isolated storage per prompt or any other unit. So be careful not to conflict with other patterns.
