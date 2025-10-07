# ArisuTalk Frontend

This is the frontend component of the ArisuTalk AI chat application, built with Svelte 5. It features a modular, responsive architecture with comprehensive internationalization support.

## Key Features

- **Multi-Chat Modes:**
  - **Main Chat:** One-on-one conversations with a single AI character.
  - **Group Chat:** Chat with a manually selected group of AI characters.
  - **Open Chat:** A dynamic chatroom where AI characters autonomously join or leave based on the conversation's context and their internal state, creating a lively and unpredictable experience.
- **Svelte 5 Migration:** The frontend is actively being migrated to Svelte 5, utilizing modern, reactive, component-based patterns.
- **Extensive AI Provider Support:** Integrates with a wide range of AI models.
- **Comprehensive Internationalization:** Fully translated into multiple languages with real-time switching.

## Development Guidelines

### Code Standards

- **JSDoc Documentation**: Use JSDoc for all functions and components. You can also use `.d.ts` files.
  - **No `Object` Type!**: It doesn't provide enough type information.
- Element IDs: Create `id` attributes for elements (useful for plugins).
- File Size Limit: Keep files under 300 lines when possible.
- Async Functions: Always include `async` in function declarations, if the function is asynchronous.
- HTML Separation: Avoid HTML strings in JS files.

### Internationalization Guidelines

- **Translation Functions**: Use `t()` function for all user-facing text
- Language Keys: Add new translation keys to both `ko.js` and `en.js`
- Context Clarity: Use descriptive keys that indicate context
- Consistency: Maintain consistent terminology across translations

### Event Handling

- Data Attributes: Use `data-listener-added` to prevent duplicate listeners
- DOM Ready: Ensure DOM elements exist before adding event listeners
- Cleanup: Remove event listeners when components are destroyed

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
pnpm dev:fe
```

The development server will start at `http://localhost:5173` with hot reload enabled.

### Build for Production

```bash
pnpm build:fe
```
The production-ready files will be in the `ArisuTalk/frontend/dist` directory.

### Testing

```bash
pnpm test
```

## Authentication Setup

The frontend uses [Clerk](https://clerk.com/) for optional user authentication. Some future screens may require a signed-in session, but the core experience still works without it.

1. Create a Clerk application and locate your **Publishable key** in the Clerk dashboard.
2. Add the key to your environment configuration:

  ```properties
  VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
  ```

3. Restart the development server so the new environment variable is picked up.

When the key is present, users can sign in/out directly from the sidebar header and manage their profiles via Clerk's hosted UI.


## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

### License

This project follows Apache License 2.0. For commits created before the fork, CC BY-NC 4.0 license applies. See ../LICENSE.md and NOTICE files for details.
