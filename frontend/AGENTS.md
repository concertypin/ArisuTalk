# Frontend AGENTS.md

This file provides guidance for AI coding agents working on the frontend of this project.

## Svelte 5 Migration Notice

**Important**: This frontend is being migrated from Vanilla JS to Svelte 5. Please adhere to the following guidelines:

-   All new features and components **must** be written in Svelte.
-   Refer to the root `MIGRATION_PLAN.md` for the overall strategy.
-   A significant portion of the application has already been migrated, and most new development will involve interacting with or extending existing Svelte components and stores.
-   Prioritize converting existing JS modules to Svelte components (`.svelte`) and stores (`.ts`) as part of your tasks.
-   Avoid adding new logic to the old `PersonaChatApp` (`index.js`) or `ui.js`.

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
- Use JSDoc for all functions and components. You can also use `.d.ts` files.
- Do not use the `Object` type as it does not provide enough type information.
- Create `id` attributes for elements.
- Keep files under 300 lines when possible.
- Use `async/await` syntax for asynchronous functions.
- Avoid HTML strings in JS files. You can write HTML strings in separated file and load it via `import somethingName from "./thatfile.txt?raw";`.
- Do not disable Git hooks unless there's a special reason.

### Internationalization
- Use the `t()` function for all user-facing text.
- Add new translation keys to both `ko.js` and `en.js`.
- Use descriptive keys that indicate context.
- Maintain consistent terminology across translations.

### Event Handling
- Use the `data-listener-added` attribute to prevent duplicate event listeners.
- Ensure DOM elements exist before adding event listeners.
- Remove event listeners when components are destroyed.

## Testing Instructions

- Write or run tests to ensure your changes work well without breaking existing functionality.
- For the frontend, run tests using `pnpm test`.
