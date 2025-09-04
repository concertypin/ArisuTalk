# AGENTS.md

This file provides guidance for AI coding agents working on this project.

This project is a monorepo with a frontend and a backend. Please refer to the `AGENTS.md` file in each sub-directory for more specific guidelines.

- [Frontend AGENTS.md](./frontend/AGENTS.md)
- [Backend AGENTS.md](./backend/AGENTS.md)

## Project Overview

This project is an AI chat frontend application forked from [`github.com/dkfk5326/ArisuTalk`](https://github.com/dkfk5326/ArisuTalk). ArisuTalk provides a modern, responsive AI chat interface with comprehensive internationalization support and modular architecture.

### Key Features

- **Bot Management**: Create and manage various AI bots with customizable personas
- **Multi-Chat Rooms**: Operate multiple chat rooms simultaneously with group chat support
- **Multi-Provider AI Integration**: Supports multiple AI providers including Google Gemini, OpenAI, Claude, Grok, OpenRouter, and custom OpenAI-compatible APIs.
- **Responsive Design**: Optimized for both desktop and mobile devices.
- **PWA Support**: Progressive Web App capabilities with offline functionality.
- **Secure Storage**: Encrypted storage for sensitive data like API keys.

## Security Considerations

- Be careful when handling sensitive data like API keys.
- Use the provided secure storage mechanisms for storing sensitive information.
- Sanitize user input to prevent XSS and other injection attacks.

## Commit Messages Guidelines

- Use English for commit messages.
- Follow the [Conventional Commits](https://www.conventionalcommits.org) style.
- Write meaningful commit messages (e.g., `fix: typo in README`, `feat: add feature X`, `chore: update dependency Y`).
- Do not include too many changes in one commit.