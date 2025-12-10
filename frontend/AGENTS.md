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
(Not implemented yet. This is a placeholder for future use.)

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

### License

This project follows Apache License 2.0.
