# ArisuTalk - AI Agent Guide 🤖

## Mission: Project Kei
Ongoing remake of the application for modularity and performance.
- Frontend: Full overhaul using Svelte 5.
- Backend: Already stable; minor improvements only.


## Structure & Guides
- Frontend: Svelte 5 + Vite + Dexie. [Frontend Guide](./frontend/AGENTS.md)
- Backend: Web Workers + Cloudflare. [Backend Guide](./backend/AGENTS.md)
- Rules: [TypeScript/Svelte Conventions](./docs/rule/README.md)

## Core Rules
1. Svelte 5: Use Runes (`$state`, `$derived`). No Svelte 4 syntax.
2. TypeScript: Use `type`, `import type`, and absolute imports (`src/...`).
3. JSDoc: Document all exports and complex logic.
4. Consistency: Check existing patterns and `/docs/rule/` before coding.
