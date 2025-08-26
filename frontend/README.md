# ArisuTalk Frontend

This is the frontend component of the ArisuTalk AI chat application, built with modern JavaScript and featuring a modular, responsive architecture with comprehensive internationalization support.

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


## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

### License

This project follows Apache License 2.0. For commits created before the fork, CC BY-NC 4.0 license applies. See ../LICENSE.md and NOTICE files for details.
