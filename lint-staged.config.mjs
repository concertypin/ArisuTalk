const pnpmExecFrontend = `pnpm --filter ./frontend exec `
const pnpmExecBackend = `pnpm --filter ./backend exec `
const typescriptNodeOptions = `cross-env NODE_OPTIONS=--experimental-strip-types `

/**
 * @type {import("lint-staged").Configuration}
 */
export default {
    "frontend/src/**/*.{js,json,md}": pnpmExecFrontend + "prettier --write",
    "frontend/src/**/*.ts": pnpmExecFrontend + typescriptNodeOptions + "prettier --write",
    "frontend/src/**/*.svelte": pnpmExecFrontend + typescriptNodeOptions + "prettier --write --plugin prettier-plugin-svelte",
    "backend/src/**/*.ts": pnpmExecBackend + typescriptNodeOptions + "prettier --write",
    "backend/src/**/*.{js,json,md}": pnpmExecBackend + "prettier --write",
}