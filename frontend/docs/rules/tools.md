# Tools Configuration

This document provides guidelines for configuring the linting and formatting tools in the ArisuTalk frontend project.

## Linter Configuration

This project uses **oxlint** as the primary linter for fast, type-aware linting, with **ESLint** as a fallback for rules that oxlint doesn't support yet.

### Oxlint

Fast linter for TypeScript and JavaScript, built on the Oxc compiler stack.

**Supports:**

- Most typescript-eslint rules, including type-aware rules
- ESLint's JS plugins via the `jsPlugins` feature
- Plugins: `typescript`, `unicorn`, `import`, `vitest`, `promise`

**Doesn't support:**

- Custom file formats and parsers (Svelte, Vue, Angular templates)
- Some HTML-superset code (only checks `<script>` blocks in `.svelte` files)

**Configuration:** `.oxlintrc.json` and `scripts/linter/`

#### Adding New Plugins

When using new ESLint plugins, try oxlint's [JS Plugins compatibility](https://oxc.rs/docs/guide/usage/linter/js-plugins.html) first:

1. Add the plugin to `jsPlugins` in `.oxlintrc.json`:

    ```json
    {
        "jsPlugins": ["eslint-plugin-foo"]
    }
    ```

2. Add rules from the plugin under `rules`:

    ```json
    {
        "rules": {
            "foo/rule-name": "error"
        }
    }
    ```

3. If the plugin requires Svelte/Vue parser support, fall back to ESLint (see below).

### ESLint

ESLint is used **only** for rules that oxlint doesn't support, primarily:

- Svelte template-specific rules (`eslint-plugin-svelte`)
- Any future plugins requiring custom parsers

**Configuration:** `eslint.config.js`

The `eslint-plugin-oxlint` integration automatically disables ESLint rules that oxlint already handles, preventing duplicate warnings.

### Running Linters

```bash
# Run oxlint only (fast, catches most issues)
pnpm run lint:oxlint

# Run ESLint only (Svelte template rules)
pnpm run lint:eslint

# Run both with auto-fix
pnpm run lint

# Run both without auto-fix (for CI)
pnpm run lint:check
```

## Formatter Configuration

This project uses **Prettier** for code formatting. Prettier is configured in `.prettierrc` and runs via:

```bash
# Format all files
pnpm run format

# Check formatting without modifying files
pnpm run format:check
```

**Note:** `eslint-config-prettier` is **not** used, as CI already checks formatting separately and it can slow down TypeScript linting.
