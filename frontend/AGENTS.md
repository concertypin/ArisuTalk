# Frontend AGENTS.md

This file provides guidance for AI coding agents working on the frontend of this project.

## Build and Test Commands

- **Install dependencies**: `pnpm install`
- **Run development server**: `pnpm dev:fe` or `pnpm --filter frontend dev`
- **Build for production**: `pnpm build:fe` or `pnpm --filter frontend build`
- **Format code**: `pnpm format:fe` or `pnpm --filter frontend format`
- **Run tests**: `pnpm test`

## Frontend Development Guidelines

### Code Style

- Follow the style of the existing codebase.
- Maintain consistency in indentation, variable names, and function names.
- Use the linter or formatter configured in the project to prettify your code.
- Use Svelte 5, not Svelte 4 or 3.
- **TypeScript Types**: Leverage TypeScript for type safety in all Svelte components (`<script lang="ts">`) and utility files (`.ts`). Use JSDoc for additional documentation where complex logic or API contracts require it.
- Do not use the `Object` type as it does not provide enough type information.
- Create `id` attributes for elements.
- Keep files under 300 lines when possible.
- Use `async/await` syntax for asynchronous functions.
- Avoid HTML strings in JS files. You can write HTML strings in separated file and load it via `import somethingName from "./thatfile.txt?raw";`.
- Do not disable Git hooks unless there's a special reason.

### Internationalization

- Use the `t()` function for all user-facing text.
- Add new translation keys to both `ko.ts` and `en.ts`.
- Use descriptive keys that indicate context.
- Maintain consistent terminology across translations.

### Event Handling

- Use Svelte's event handling mechanisms (`on:click`, custom events) for component interactions.
- For global event listeners, ensure they are properly cleaned up in the `onDestroy` lifecycle hook to prevent memory leaks.

## Testing Instructions

- Write or run tests to ensure your changes work well without breaking existing functionality.
- For the frontend, run tests using `pnpm test`.
