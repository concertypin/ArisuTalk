# Backend AGENTS.md

This file provides guidance for AI coding agents working on the backend of this project.

## Build and Test Commands

- **Run the application**:`pnpm run -w dev:be`
- **Run tests**: Currently no tests.
- **Build the application**: `pnpm run -w build:be`
- **Format code**: `pnpm run -w format:be`
- **Lint code**: `pnpm run -w lint:be`

## Backend Development Guidelines

### Code Style

- Follow the style of the existing codebase.
- Maintain consistency in indentation, variable names, and function names.
- Use JSDoc for documentation.
  - Firing/receiving events MUST be documented with JSDoc!
- Don't use `any` type if possible; prefer specific types or generics.
- Use `async/await` for asynchronous code instead of `.then()`. We have ESNext support!
- This is NOT a Node.js project; it uses Web Workers. Use Web APIs instead of Node.js APIs.
- Use libraries instead of reinventing the wheel.
  - One exception: If Web APIs are available with the same functionality, prefer them over libraries.
    (example: `fetch` instead of `axios` library, `crypto.randomUUID` instead of `uuid` library).

### Developer's Guide

- Make code stateless to reduce trouble with containers, auto-scaling, etc.
- Use `pnpm add` instead of editing `package.json` directly.
- Use `import.meta.env`(injected at build time) or `c.env`(injected at runtime, per HTTP call) for environment variables.
