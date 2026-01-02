# Change summary: Implement a robust scripting and message transformation system using character-defined hooks and a sandboxed QuickJS environment.

The implementation is well-architected, leveraging Web Workers for isolation and performance. The integration into `ChatStore` via `HookService` allows for flexible message processing. However, there are some logical inconsistencies and a critical typo in a utility function.

## File: frontend/src/lib/services/HookService.ts
### L131: [CRITICAL] Typo in `escapeRegExp` introduces unwanted spaces.
The replacement string "\\$& " contains a trailing space, which will corrupt any string-based hook matching by adding spaces after every escaped character.

Suggested change:
```typescript
-        return string.replace(/[.*+?^${}()|[\\]/g, "\\$& ");
+        return string.replace(/[.*+?^${}()|[\\]/g, "\\$& ");
```

### L103: [MEDIUM] Context role hardcoding is brittle.
The role is determined solely by `type === "input" ? "user" : "assistant"`. While correct for current usage, it doesn't account for `display` hooks or future extensions. It should ideally reflect the actual role of the content being processed.

### L34: [LOW] Workers can be fetched once per process call.
You've already optimized this in the code I read (moving `getRegexWorker` outside the loop), but the original diff showed it inside. Ensure the version with the optimization is what's committed.

## File: frontend/src/features/chat/stores/chatStore.svelte.ts
### L46: [MEDIUM] `activeChatContext` might be unstable during rapid state changes.
The getter relies on `characterStore.characters.find`. If the character store is still loading when a message is sent/received, hooks might be silently skipped because `character` is undefined.

Suggested change:
```typescript
    private get activeChatContext() {
        const activeChat = this.activeChatId
            ? this.chats.find((c) => c.id === this.activeChatId)
            : null;
        const character = activeChat
            ? characterStore.characters.find((c) => c.id === activeChat.characterId)
            : undefined;
+       if (activeChat && !character && characterStore.characters.length > 0) {
+           console.warn(`ChatStore: Character ${activeChat.characterId} not found for hooks`);
+       }
        const persona = personaStore.activePersona;
        return { activeChat, character, persona };
    }
```

## File: frontend/worker/scripting/main.ts
### L128: [HIGH] `pendingHostPromises` leak on timeout/abort.
If a `fetch` is in progress and the script times out or is aborted, the promise in `pendingHostPromises` might never be removed from the set because the `.finally` block relies on the host promise settling, which might be delayed.

Suggested change:
```typescript
                    const p = fetch(url, { signal: abortController.signal })
                        .then((res) => res.text())
                        .then((text) => {
                            if (context.alive && deferred.handle.alive) {
                                const result = context.newString(text);
                                deferred.resolve(result);
                                result.dispose();
                            }
                        })
                        .catch((err) => {
-                            if (context.alive && deferred.handle.alive) {
+                            if (context && context.alive && deferred.handle.alive) {
                                const error = context.newError(
                                    err instanceof Error ? err.message : String(err)
                                );
                                deferred.reject(error);
                                error.dispose();
                            }
                        })
                        .finally(() => {
-                           runtime.executePendingJobs();
+                           if (runtime && runtime.alive) runtime.executePendingJobs();
                            pendingHostPromises.delete(p);
                        });
```

### L171: [MEDIUM] Potential use-after-free or memory leak in Promise handling.
In the `while (!settled)` loop, if `timedOut` becomes true, the handles in `res` are disposed, but the `resultPromise` might still resolve later. The cleanup logic should be more defensive.

```