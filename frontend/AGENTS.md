# ArisuTalk Frontend

## Development Guidelines

### Code Standards

- **JSDoc Documentation**: Use JSDoc for all exported functions and complex logic.
- HTML Separation: Avoid HTML strings in JS files. Who does that with Svelte?

### Event Handling

- Annotate event firers and receivers with JSDoc. Event fire/receive is hard to track without proper documentation!

## Development Setup

### Prerequisites

- Node.js (>20)
- pnpm (10.14.0+)

### Installation

```bash
git clone https://github.com/concertypin/ArisuTalk.git
cd ArisuTalk
pnpm install
```

### Development Server

```bash
pnpm run -F frontend dev
```

The development server will start at `http://localhost:5173` with hot reload enabled.

### Build for Production

```bash
pnpm run -F frontend build
```

The production-ready files will be in the `ArisuTalk/frontend/dist` directory.

### Testing

```bash
pnpm run -F frontend test
```

## Authentication Setup

The frontend uses [Clerk](https://clerk.com/) for optional user authentication. Some future screens may require a signed-in session, but the core experience still works without it.
(Not implemented yet. This is a placeholder for future use.)

## Web Worker Development

We use **Comlink** to simplify communication between the main thread and web workers. This ensures strict type safety and cleaner code compared to raw `postMessage`.

### Directory Structure

- `worker/<name>/main.ts`: The entry point for the worker. Must import `comlink` and expose the API.
- `worker/<name>/types.ts`: TypeScript interfaces defining the methods exposed by the worker.
- `src/lib/workers/<name>Client.ts`: Helper functions to instantiate and wrap the worker in the main thread.

### Creating a New Worker

1.  **Define the API** in `worker/<name>/types.ts`.
2.  **Implement the logic** in `worker/<name>/main.ts` and expose it using `Comlink.expose(api)`.
3.  **Create a client helper** in `src/lib/workers/` to lazily load and wrap the worker.

### Type Safety

Always use the types defined in `types.ts` when wrapping the worker with Comlink:

```typescript
const api = Comlink.wrap<MyWorkerApi>(worker);
```

### Testing

Worker logic should be tested via unit tests in `test/workers/`. Note that real Workers don't run in Vitest's default environment, so we mock the Worker construction and Comlink wrapping for unit tests.

### Common Mistakes

- Putting `.ts` on import statements.
    - Fix: Remove `.ts` from import statements.
- Using `lucide-svelte` instead of `@lucide/svelte`.
    - Fix: Replace `lucide-svelte` with `@lucide/svelte`.

### Documentation of Other Libraries

- DaisyUI: https://daisyui.com/llms.txt
- Svelte: https://svelte.dev/llms.txt

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

### License

This project follows Apache License 2.0.
