# AGENTS.md

This file provides guidance for AI coding agents working on this project.

## Project Overview

This project is an AI chat frontend application forked from [`github.com/dkfk5326/ArisuTalk`](https://github.com/dkfk5326/ArisuTalk). ArisuTalk provides a modern, responsive AI chat interface with comprehensive internationalization support and modular architecture.

### Key Features

- **Bot Management**: Create and manage various AI bots with customizable personas
- **Multi-Chat Rooms**: Operate multiple chat rooms simultaneously with group chat support
- **Multi-Provider AI Integration**: Supports multiple AI providers including Google Gemini, OpenAI, Claude, Grok, OpenRouter, and custom OpenAI-compatible APIs.
- **Responsive Design**: Optimized for both desktop and mobile devices.
- **PWA Support**: Progressive Web App capabilities with offline functionality.
- **Secure Storage**: Encrypted storage for sensitive data like API keys.

## Build and Test Commands

### Frontend

- **Install dependencies**: `pnpm install`
- **Run development server**: `pnpm dev:fe` or `pnpm --filter frontend dev`
- **Build for production**: `pnpm build:fe` or `pnpm --filter frontend build`
- **Format code**: `pnpm format:fe` or `pnpm --filter frontend format`
- **Run tests**: `pnpm test`

### Backend (Gradle)

- **Run the application**: `cd backend && ./gradlew run`
- **Run tests**: `cd backend && ./gradlew test`
- **Build the application**: `cd backend && ./gradlew build`
- **Check code style**: `cd backend && ./gradlew ktlintCheck`
- **Format code**: `cd backend && ./gradlew ktlintFormat`

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

## Backend Development Guidelines

### Code Style
- Follow the style of the existing codebase.
- Maintain consistency in indentation, variable names, and function names.
- Use KDoc for documentation.

### Developer's Guide
- Make code stateless to reduce trouble with containers, auto-scaling, etc.
- Put all dependencies into the `gradle/libs.versions.toml` version catalog.

## Testing Instructions

- Write or run tests to ensure your changes work well without breaking existing functionality.
- For the frontend, run tests using `pnpm test`.
- For the backend, use JUnit 5 for unit tests. You can run tests using `cd backend && ./gradlew test`.

## Security Considerations

- Be careful when handling sensitive data like API keys.
- Use the provided secure storage mechanisms for storing sensitive information.
- Sanitize user input to prevent XSS and other injection attacks.

## Commit Messages Guidelines

- Use English for commit messages.
- Follow the [Conventional Commits](https://www.conventionalcommits.org) style.
- Write meaningful commit messages (e.g., `fix: typo in README`, `feat: add feature X`, `chore: update dependency Y`).
- Do not include too many changes in one commit.
