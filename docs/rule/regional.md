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

## Logging and Telemetry
ArisuTalk uses a centralized logging system. **Prefer structured logging (`Logger.structured`) over textual logging** whenever possible, even for minor events, as these are used for telemetry and analysis.

### 1. Structured Telemetry (Recommended)
For almost all events, use `Logger.structured`. These are type-safe, defined in `StructuredLogLevel`, and easier to analyze.
Structured logging is not shown in DevTools by default.

Rules:
- Structured First: If an event can be categorized, create/use a structured log event instead of a plain text log.
- Detailed Data: Include relevant context (IDs, durations, counts) in the payload.
- Non-PII: Do not include sensitive user data (PII).

```ts
import { Logger } from "@common/logger/Logger";

// Preferred over Logger.info("User sent message")
Logger.structured("chat.message.send", {
    chatId: "uuid-123",
    messageLength: 42
});
```

### 2. Standard Logging
Use standard methods only for non-telemetry debugging or unexpected system states where a structured event doesn't exist yet.
- `Logger.info`, `Logger.warn`, `Logger.error`, `Logger.debug`.

### 3. Logging in Web Workers
Web Workers cannot access the main `Logger` directly. Use `LogBridge` to forward logs to the main thread.

**Setup in Worker:**
1. Receive a `LogBridgeReceiver` proxy via Comlink.
2. Create a sender using `createLogBridgeSender`.

```ts
// In Worker
import { createLogBridgeSender, type LogBridgeReceiver } from "@common/logger/LogBridge";

let logger: ReturnType<typeof createLogBridgeSender>;

export const api = {
    setLogReceiver(receiver: LogBridgeReceiver) {
        logger = createLogBridgeSender(receiver);
    },
    doWork() {
        // Use the same API as the main Logger
        logger.structured("worker.status", { 
            workerName: "MyWorker", 
            status: "ready" 
        });
        logger.info("Doing some work...");
    }
};
```

